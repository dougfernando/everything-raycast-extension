import {
    Action,
    ActionPanel,
    getPreferenceValues,
    Icon,
    List,
    open,
    showToast,
    Toast,
    Clipboard, // Import Clipboard from the API
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { exec, execFile } from "child_process";
import { readFile } from "fs/promises";
import { promisify } from "util";
import { basename, dirname, extname } from "path";
import { useEffect, useState } from "react";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Known text file extensions for fast path detection
const KNOWN_TEXT_EXTENSIONS = new Set([
    ".txt",
    ".md",
    ".json",
    ".xml",
    ".html",
    ".css",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".log",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".sh",
    ".bat",
    ".ps1",
    ".sql",
    ".csv",
    ".conf",
    ".properties",
]);

async function isTextFile(filePath: string): Promise<boolean> {
    try {
        const buffer = await readFile(filePath, { encoding: null });
        const sample = buffer.slice(0, Math.min(512, buffer.length));

        // Check for null bytes (binary indicator)
        const nullBytes = sample.filter((byte) => byte === 0).length;

        // If more than 1% null bytes, likely binary
        return nullBytes / sample.length < 0.01;
    } catch {
        return false;
    }
}

async function isFilePreviewable(filePath: string, fileSize?: number): Promise<boolean> {
    const ext = extname(filePath).toLowerCase();

    // Known text extensions - fast path
    if (KNOWN_TEXT_EXTENSIONS.has(ext)) return true;

    // Unknown extension or no extension - content detection for small files only
    if ((!ext || !KNOWN_TEXT_EXTENSIONS.has(ext)) && fileSize && fileSize < 10000) {
        return await isTextFile(filePath);
    }

    return false;
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function truncatePath(path: string, maxLength = 50): string {
    if (path.length <= maxLength) return path;

    const pathSeparator = path.includes("\\") ? "\\" : "/";
    const parts = path.split(pathSeparator);

    if (parts.length <= 3) return path;

    // Always keep the first two parts (drive + first folder) and last part
    const first = parts[0];
    const second = parts[1];
    const last = parts[parts.length - 1];
    const ellipsis = "...";

    // Build: first + separator + second + separator + ellipsis + separator + last
    const basicTruncated = `${first}${pathSeparator}${second}${pathSeparator}${ellipsis}${pathSeparator}${last}`;
    if (basicTruncated.length <= maxLength) {
        return basicTruncated;
    }

    // If still too long, truncate the last part
    const fixedPart = `${first}${pathSeparator}${second}${pathSeparator}${ellipsis}${pathSeparator}`;
    const availableSpace = maxLength - fixedPart.length;
    if (availableSpace > 0) {
        const truncatedLast = last.length > availableSpace ? last.substring(0, availableSpace - 3) + "..." : last;
        return `${fixedPart}${truncatedLast}`;
    }

    // If extremely long, just show first two parts with ellipsis
    return `${first}${pathSeparator}${second}${pathSeparator}${ellipsis}`;
}

function parseEsDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    // Parse date format: "22/07/2025 16:18"
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
    if (!match) return undefined;

    const [, day, month, year, hour, minute] = match;
    // JavaScript Date constructor expects month to be 0-indexed
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
}

interface FileInfo {
    name: string;
    commandline: string;
    size?: number;
    dateCreated?: Date;
    dateModified?: Date;
}

interface Preferences {
    esExePath?: string;
    fileExplorerCommand?: string;
    openFolderAsDefault?: boolean;
    minCharsToSearch?: string;
}

async function loadFilesList(searchText: string, preferences: Preferences): Promise<FileInfo[]> {
    if (!searchText) {
        return [];
    }

    const { esExePath } = preferences;

    try {
        const esCommand = esExePath || "es.exe";

        // Use es.exe with CSV output format to get file info in one call
        const command = `chcp 65001 > nul && "${esCommand}" -n 100 -csv -name -filename-column -size -date-created -date-modified ${searchText}`;

        const { stdout } = await execAsync(command);

        const lines = stdout
            .trim()
            .split(/\r?\n/)
            .filter((line) => line);

        // Skip header line and parse CSV data
        const dataLines = lines.slice(1);

        const results = dataLines.map((line) => {
            // Parse CSV line (handle quoted values that may contain commas)
            const csvRegex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
            const values: string[] = [];
            let match;

            while ((match = csvRegex.exec(line)) !== null) {
                values.push(match[1] || match[2] || "");
            }

            if (values.length < 5) {
                // Fallback if CSV parsing fails
                const fullPath = values[0] || line;
                return {
                    name: basename(fullPath),
                    commandline: fullPath,
                };
            }

            const [fileName, fullPath, sizeStr, dateCreatedStr, dateModifiedStr] = values;

            return {
                name: fileName || basename(fullPath),
                commandline: fullPath,
                size: sizeStr ? parseInt(sizeStr, 10) : undefined,
                dateCreated: parseEsDate(dateCreatedStr),
                dateModified: parseEsDate(dateModifiedStr),
            };
        });
        return results;
    } catch (error) {
        console.log(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const hasStderr = error && typeof error === "object" && "stderr" in error;
        const stderr = hasStderr ? String(error.stderr) : "";

        // Check if es.exe command is not recognized (Windows) or not found (Unix-like)
        if (
            stderr.includes("not recognized") ||
            stderr.includes("command not found") ||
            errorMessage.includes("not recognized")
        ) {
            await showToast({
                style: Toast.Style.Failure,
                title: esExePath ? "Custom es.exe path not found" : "'es.exe' not found",
                message: esExePath
                    ? `Cannot find es.exe at: ${esExePath}`
                    : "Please ensure Everything's command-line tool is in your system's PATH or set a custom path in preferences.",
            });
        } else {
            await showToast({
                style: Toast.Style.Failure,
                title: "Error Searching Files",
                message: errorMessage,
            });
        }
        return [];
    }
}

async function openFileFound(fileInfo: FileInfo) {
    try {
        await open(fileInfo.commandline);
        await showToast({
            style: Toast.Style.Success,
            title: "Opening File",
            message: `Opened ${fileInfo.name}`,
        });
    } catch (error) {
        // if the error is related to permissions, run as administrator
        if (
            error instanceof Error &&
            (error.message.includes("The requested operation requires elevation.") ||
                error.message.includes("请求的操作需要提升。")) &&
            fileInfo.commandline.toLowerCase().endsWith(".exe")
        ) {
            await runAsAdministrator(fileInfo.commandline);
            return;
        }

        console.log(error);
        await showToast({
            style: Toast.Style.Failure,
            title: "Error Opening File",
            message: `Failed to open ${fileInfo.name}`,
        });
    }
}

async function runAsAdministrator(path: string) {
    const command = `powershell -Command "Start-Process -FilePath '${path.replace(/'/g, "''")}' -Verb RunAs"`;
    execAsync(command);
}

async function showInExplorer(path: string, preferences: Preferences) {
    const { fileExplorerCommand } = preferences;
    // For files, show the containing directory; for directories, show the directory itself
    const targetPath = dirname(path);

    if (fileExplorerCommand) {
        try {
            const commandParts = fileExplorerCommand.match(/"[^"]+"|\S+/g) || [];
            if (commandParts.length === 0) {
                throw new Error("File explorer command is invalid.");
            }

            const executable = commandParts[0]!.replace(/"/g, "");
            const args = commandParts.slice(1).map((arg) => arg.replace("%s", targetPath));

            await execFileAsync(executable, args);
        } catch (error) {
            console.log(error);
            await showToast({
                style: Toast.Style.Failure,
                title: "Error Opening in Custom Explorer",
                message: error instanceof Error ? error.message : `Failed to execute: ${fileExplorerCommand}`,
            });
        }
    } else {
        await open(targetPath);
    }
}

async function copyFileWithApi(fileInfo: FileInfo) {
    try {
        await Clipboard.copy({ file: fileInfo.commandline });
        await showToast({
            style: Toast.Style.Success,
            title: "Copied to Clipboard",
            message: `Copied ${fileInfo.name}`,
        });
    } catch (error) {
        console.log(error);
        await showToast({
            style: Toast.Style.Failure,
            title: "Error Copying File",
            message: "Could not copy the file to the clipboard.",
        });
    }
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [isShowingDetail, setIsShowingDetail] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<Preferences | null>(null);

    useEffect(() => {
        const loadPrefs = () => {
            const prefs = getPreferenceValues<Preferences>();
            setPreferences(prefs);
        };
        loadPrefs();
    }, []);

    const minChars = parseInt(preferences?.minCharsToSearch || "3", 10);
    const openFolderAsDefault = preferences?.openFolderAsDefault;

    const { data: searchResults, isLoading } = useCachedPromise(
        (text: string, prefs: Preferences | null) => {
            if (!prefs || text.length < minChars) {
                return Promise.resolve([]);
            }
            return loadFilesList(text, prefs);
        },
        [searchText, preferences],
        {
            initialData: [],
        }
    );

    async function onSelectionChange(itemId: string | null) {
        setPreviewContent(null);
        setSelectedFile(null);

        if (!itemId) {
            return;
        }

        // Find the selected file from search results
        const fileInfo = searchResults.find((file) => file.commandline === itemId);
        if (fileInfo) {
            setSelectedFile(fileInfo);

            // Try to load preview for previewable files
            const canPreview = await isFilePreviewable(itemId, fileInfo.size);
            if (canPreview) {
                try {
                    const content = await readFile(itemId, "utf-8");
                    setPreviewContent(content);
                } catch (error) {
                    console.error("Error reading file for preview:", error);
                }
            }
        }
    }

    return (
        <List
            isLoading={isLoading}
            isShowingDetail={isShowingDetail}
            searchBarPlaceholder="Search Files with Everything..."
            onSearchTextChange={setSearchText}
            onSelectionChange={onSelectionChange}
            throttle
        >
            <List.EmptyView
                title={
                    searchText.length > 0 && searchText.length < minChars
                        ? "Keep typing..."
                        : searchText
                        ? "No Files Found"
                        : "Search for Anything"
                }
                description={
                    searchText.length > 0 && searchText.length < minChars
                        ? `The search will start after you type at least ${minChars} characters.`
                        : searchText
                        ? `No results for "${searchText}"`
                        : "Start typing to search your entire system with Everything."
                }
                icon={Icon.MagnifyingGlass}
            />
            {searchResults.map((file, index) => (
                <List.Item
                    key={`${file.commandline}-${index}`}
                    id={file.commandline}
                    title={file.name}
                    subtitle={
                        isShowingDetail ? basename(dirname(file.commandline)) : truncatePath(dirname(file.commandline))
                    }
                    icon={{ fileIcon: file.commandline }}
                    accessories={[
                        {
                            text: formatBytes(file.size || 0),
                        },
                    ]}
                    actions={
                        <ActionPanel>
                            <ActionPanel.Section>
                                {openFolderAsDefault ? (
                                    <>
                                        <Action
                                            title="Show in Explorer"
                                            icon={Icon.Finder}
                                            onAction={() => preferences && showInExplorer(file.commandline, preferences)}
                                        />
                                        <Action
                                            title="Open File"
                                            icon={Icon.Desktop}
                                            onAction={() => openFileFound(file)}
                                        />
                                        {file.commandline.toLowerCase().endsWith(".exe") && (
                                            <Action
                                                title="Run as Administrator"
                                                icon={Icon.Shield}
                                                onAction={() => runAsAdministrator(file.commandline)}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Action
                                            title="Open File"
                                            icon={Icon.Desktop}
                                            onAction={() => openFileFound(file)}
                                        />
                                        <Action
                                            title="Show in Explorer"
                                            icon={Icon.Finder}
                                            onAction={() => preferences && showInExplorer(file.commandline, preferences)}
                                        />
                                        {file.commandline.toLowerCase().endsWith(".exe") && (
                                            <Action
                                                title="Run as Administrator"
                                                icon={Icon.Shield}
                                                onAction={() => runAsAdministrator(file.commandline)}
                                            />
                                        )}
                                    </>
                                )}
                            </ActionPanel.Section>
                            <ActionPanel.Section>
                                <Action
                                    title="Copy File/Directory"
                                    icon={Icon.Clipboard}
                                    onAction={() => copyFileWithApi(file)}
                                    shortcut={{ modifiers: ["ctrl", "shift"], key: "." }}
                                />
                                <Action.CopyToClipboard
                                    title="Copy File Name"
                                    content={file.name}
                                    shortcut={{
                                        macOS: { modifiers: ["cmd"], key: "c" },
                                        windows: { modifiers: ["ctrl"], key: "c" },
                                    }}
                                />
                                <Action.CopyToClipboard
                                    title="Copy Full Path"
                                    content={file.commandline}
                                    shortcut={{
                                        macOS: { modifiers: ["cmd", "shift"], key: "c" },
                                        windows: { modifiers: ["ctrl", "shift"], key: "c" },
                                    }}
                                />
                                <Action
                                    title="Toggle Details"
                                    icon={Icon.AppWindowSidebarLeft}
                                    onAction={() => setIsShowingDetail(!isShowingDetail)}
                                    shortcut={{
                                        macOS: { modifiers: ["cmd"], key: "i" },
                                        windows: { modifiers: ["ctrl"], key: "i" },
                                    }}
                                />
                            </ActionPanel.Section>
                        </ActionPanel>
                    }
                    detail={
                        isShowingDetail && (
                            <List.Item.Detail
                                markdown={previewContent ?? undefined}
                                metadata={
                                    selectedFile && (
                                        <List.Item.Detail.Metadata>
                                            <List.Item.Detail.Metadata.Label title="Name" text={file.name} />
                                            <List.Item.Detail.Metadata.Label title="Where" text={file.commandline} />
                                            <List.Item.Detail.Metadata.Separator />
                                            {selectedFile.size !== undefined && (
                                                <List.Item.Detail.Metadata.Label
                                                    title="Size"
                                                    text={formatBytes(selectedFile.size)}
                                                />
                                            )}
                                            {selectedFile.size !== undefined && <List.Item.Detail.Metadata.Separator />}
                                            {selectedFile.dateCreated && (
                                                <List.Item.Detail.Metadata.Label
                                                    title="Created"
                                                    text={selectedFile.dateCreated.toLocaleString()}
                                                />
                                            )}
                                            {selectedFile.dateModified && (
                                                <List.Item.Detail.Metadata.Label
                                                    title="Modified"
                                                    text={selectedFile.dateModified.toLocaleString()}
                                                />
                                            )}
                                        </List.Item.Detail.Metadata>
                                    )
                                }
                            />
                        )
                    }
                />
            ))}
        </List>
    );
}
