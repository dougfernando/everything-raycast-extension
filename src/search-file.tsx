import { Action, ActionPanel, getPreferenceValues, Icon, List, open, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { execFile } from "child_process";
import { lstat } from "fs/promises";
import { promisify } from "util";
import { basename, dirname } from "path";
import { useState } from "react";

const execFileAsync = promisify(execFile);

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
        const { stdout } = await execFileAsync(executable, args);

        const filePaths = stdout
            .trim()
            .split(/\r?\n/)
            .filter((path) => path);

        return filePaths.map((fullPath) => ({
            name: basename(fullPath),
            commandline: fullPath,
        }));
    } catch (error) {
        console.log(error); // For debugging
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
        console.log(error); // For debugging
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
        // Check if the given path is a file or a directory
        const stats = await lstat(path);
        if (stats.isDirectory()) {
            targetPath = path; // If it's a directory, use the path directly
        } else {
            targetPath = dirname(path); // If it's a file, use its parent directory
        }
    } catch (e) {
        // If stat fails, fall back to the parent directory as a safe default
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
            console.log(error); // For debugging
            await showToast({
                style: Toast.Style.Failure,
                title: "Error Opening in Custom Explorer",
                message: error instanceof Error ? error.message : `Failed to execute: ${fileExplorerCommand}`,
            });
        }
    } else {
        // Fallback to default behavior
        open(targetPath);
    }
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const { data: searchResults, isLoading } = useCachedPromise((text: string) => loadFilesList(text), [searchText], {
        initialData: [],
    });
    const { useCustomExplorerAsDefault } = getPreferenceValues<Preferences>();

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search Files with Everything..."
            onSearchTextChange={setSearchText}
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
                    title={file.name}
                    subtitle={file.commandline}
                    icon={{ fileIcon: file.commandline }}
                    actions={
                        <ActionPanel>
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
                            <Action.CopyToClipboard
                                title="Copy Full Path"
                                content={file.commandline}
                                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}