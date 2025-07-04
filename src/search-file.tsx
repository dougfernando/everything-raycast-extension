import { Action, ActionPanel, getPreferenceValues, Icon, List, open, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { execFile } from "child_process";
import { lstat, readFile, Stats } from "fs/promises";
import { promisify } from "util";
import { basename, dirname, extname } from "path";
import { useState } from "react";
import iconv from "iconv-lite";

const execFileAsync = promisify(execFile);

const PREVIEWABLE_EXTENSIONS = [".md", ".txt", ".js", ".ts", ".tsx", ".json", ".html", ".css", ".xml", ".log"];

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

interface FileInfo {
    name: string;
    commandline: string;
}

interface Preferences {
    fileExplorerCommand?: string;
    useCustomExplorerAsDefault?: boolean;
}

async function loadFilesList(searchText: string): Promise<FileInfo[]> {
    if (!searchText) {
        return [];
    }

    try {
        const executable = "es.exe";
        const args = ["-n", "100", ...searchText.split(/\s+/).filter((word) => word.length > 0)];

        const { stdout } = await execFileAsync(executable, args, { encoding: "buffer" });

        // --- UPDATED: Changed the decoding to the correct Portuguese OEM codepage ---
        const decodedStdout = iconv.decode(stdout, "cp860");

        const filePaths = decodedStdout
            .trim()
            .split(/\r?\n/)
            .filter((path) => path);

        return filePaths.map((fullPath) => ({
            name: basename(fullPath),
            commandline: fullPath,
        }));
    } catch (error) {
        console.log(error);
        if (error instanceof Error && "code" in error && (error as any).code === "ENOENT") {
            await showToast({
                style: Toast.Style.Failure,
                title: "'es.exe' not found",
                message: "Please ensure Everything's command-line tool is in your system's PATH.",
            });
        } else {
            await showToast({
                style: Toast.Style.Failure,
                title: "Error Searching Files",
                message: error instanceof Error ? error.message : "An unknown error occurred",
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
        console.log(error);
        await showToast({
            style: Toast.Style.Failure,
            title: "Error Opening File",
            message: `Failed to open ${fileInfo.name}`,
        });
    }
}

async function showInExplorer(path: string) {
    const { fileExplorerCommand } = getPreferenceValues<Preferences>();
    let targetPath: string;

    try {
        const stats = await lstat(path);
        if (stats.isDirectory()) {
            targetPath = path;
        } else {
            targetPath = dirname(path);
        }
    } catch (e) {
        console.log("Could not stat path, falling back to dirname:", e);
        targetPath = dirname(path);
    }

    if (fileExplorerCommand) {
        if (!fileExplorerCommand.includes("%s")) {
            await showToast({
                style: Toast.Style.Failure,
                title: "Configuration Error",
                message: "Your custom explorer command in preferences is missing the '%s' placeholder.",
            });
            return;
        }

        try {
            const commandParts = fileExplorerCommand.match(/"[^"]+"|\S+/g) || [];
            if (commandParts.length === 0) {
                throw new Error("File explorer command is invalid.");
            }

            const executable = commandParts[0].replace(/"/g, "");
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
        open(targetPath);
    }
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [isShowingDetail, setIsShowingDetail] = useState(false);
    const [selectedFileStats, setSelectedFileStats] = useState<Stats | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);

    const { data: searchResults, isLoading } = useCachedPromise((text: string) => loadFilesList(text), [searchText], {
        initialData: [],
    });
    const { useCustomExplorerAsDefault } = getPreferenceValues<Preferences>();

    async function onSelectionChange(itemId: string | null) {
        setPreviewContent(null);
        setSelectedFileStats(null);

        if (!itemId) {
            return;
        }

        try {
            const stats = await lstat(itemId);
            setSelectedFileStats(stats);

            if (stats.isFile() && PREVIEWABLE_EXTENSIONS.includes(extname(itemId).toLowerCase())) {
                const content = await readFile(itemId, "utf-8");
                setPreviewContent(content);
            }
        } catch (error) {
            console.error("Error getting file details:", error);
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
                title={searchText ? "No Files Found" : "Search for Anything"}
                description={
                    searchText ? `No results for "${searchText}"` : "Start typing to search your entire system with Everything."
                }
                icon={Icon.MagnifyingGlass}
            />
            {searchResults.map((file) => (
                <List.Item
                    key={file.commandline}
                    id={file.commandline}
                    title={file.name}
                    subtitle={isShowingDetail ? basename(dirname(file.commandline)) : file.commandline}
                    icon={{ fileIcon: file.commandline }}
                    actions={
                        <ActionPanel>
                            <ActionPanel.Section>
                                {useCustomExplorerAsDefault ? (
                                    <>
                                        <Action
                                            title="Show in Explorer"
                                            icon={Icon.Finder}
                                            onAction={() => showInExplorer(file.commandline)}
                                        />
                                        <Action title="Open File" icon={Icon.Desktop} onAction={() => openFileFound(file)} />
                                    </>
                                ) : (
                                    <>
                                        <Action title="Open File" icon={Icon.Desktop} onAction={() => openFileFound(file)} />
                                        <Action
                                            title="Show in Explorer"
                                            icon={Icon.Finder}
                                            onAction={() => showInExplorer(file.commandline)}
                                        />
                                    </>
                                )}
                            </ActionPanel.Section>
                            <ActionPanel.Section>
                                <Action.CopyToClipboard title="Copy Full Path" content={file.commandline} />
                                <Action
                                    title="Toggle Details"
                                    icon={Icon.AppWindowSidebarLeft}
                                    onAction={() => setIsShowingDetail(!isShowingDetail)}
                                    shortcut={{ modifiers: ["cmd"], key: "i" }}
                                />
                            </ActionPanel.Section>
                        </ActionPanel>
                    }
                    detail={
                        isShowingDetail && (
                            <List.Item.Detail
                                markdown={previewContent ?? undefined}
                                metadata={
                                    selectedFileStats && (
                                        <List.Item.Detail.Metadata>
                                            <List.Item.Detail.Metadata.Label title="Name" text={file.name} />
                                            <List.Item.Detail.Metadata.Label title="Where" text={file.commandline} />
                                            <List.Item.Detail.Metadata.Separator />
                                            <List.Item.Detail.Metadata.Label title="Size" text={formatBytes(selectedFileStats.size)} />
                                            <List.Item.Detail.Metadata.Separator />
                                            <List.Item.Detail.Metadata.Label
                                                title="Created"
                                                text={selectedFileStats.birthtime.toLocaleString()}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Modified"
                                                text={selectedFileStats.mtime.toLocaleString()}
                                            />
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