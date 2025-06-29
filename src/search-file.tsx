import { Action, ActionPanel, FileIcon, Icon, List, open, showToast, Toast } from "@raycast/api"
import { useCachedPromise } from "@raycast/utils"
import { execFile } from "child_process" // Changed from exec
import { promisify } from "util"
import { basename } from "path"
import { useState } from "react"

const execFileAsync = promisify(execFile) // Changed to use execFile

interface FileInfo {
    name: string
    commandline: string
    icon?: string
}

async function loadFilesList(searchText: string): Promise<FileInfo[]> {
    // Do not search on empty text
    if (!searchText) {
        return []
    }

    try {
        const executable = "es.exe"
        // Pass arguments as an array to avoid shell parsing issues
        // const args = ["-n", "100", searchText]
        const args = ["-n", "100", ...searchText.split(/\s+/).filter(word => word.length > 0)]
        // Execute the command directly using execFileAsync
        const { stdout } = await execFileAsync(executable, args)

        // Process the correctly encoded string directly.
        const filePaths = stdout
            .trim()
            .split(/\r?\n/)
            .filter(path => path)

        const fileInfos: FileInfo[] = filePaths.map(fullPath => ({
            name: basename(fullPath),
            commandline: fullPath,
        }))

        return fileInfos
    } catch (error) {
        if (error instanceof Error && "code" in error && (error as any).code === "ENOENT") {
            await showToast({
                style: Toast.Style.Failure,
                title: "'es.exe' not found",
                message: "Please ensure Everything's command-line tool is in your system's PATH.",
            })
        } else {
            await showToast({
                style: Toast.Style.Failure,
                title: "Error Searching Files",
                message: error instanceof Error ? error.message : "An unknown error occurred",
            })
        }
        return []
    }
}

// This function is now simplified and more robust using the Raycast API
async function openFileFound(fileInfo: FileInfo) {
    try {
        await open(fileInfo.commandline) // <-- Use the Raycast 'open' function
        await showToast({
            style: Toast.Style.Success,
            title: "Opening File",
            message: `Opened ${fileInfo.name}`,
        })
    } catch (error) {
        await showToast({
            style: Toast.Style.Failure,
            title: "Error Opening File",
            message: `Failed to open ${fileInfo.name}`,
        })
    }
}
function getFileIcon(filePath: string) {
    return { fileIcon: filePath }
}

export default function Command() {
    const [searchText, setSearchText] = useState("")
    const {
        data: profiles,
        isLoading,
        revalidate,
    } = useCachedPromise((text: string) => loadFilesList(text), [searchText], { initialData: [] })

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search Files with Everything..."
            onSearchTextChange={setSearchText}
            throttle
        >
            {profiles && profiles.length > 0 ? (
                profiles.map(file => (
                    <List.Item
                        key={file.commandline}
                        title={file.name}
                        subtitle={file.commandline}
                        icon={getFileIcon(file.commandline)}
                        actions={
                            <ActionPanel>
                                <Action title="Open File" icon={Icon.Desktop} onAction={() => openFileFound(file)} />
                                <Action.ShowInFinder
                                    title="Show in Explorer"
                                    path={file.commandline}
                                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                                />
                            </ActionPanel>
                        }
                    />
                ))
            ) : (
                <List.EmptyView
                    title={searchText ? "No Files Found" : "Search for Anything"}
                    description={
                        searchText
                            ? `No results for "${searchText}"`
                            : "Start typing to search your entire system with Everything."
                    }
                    icon={Icon.MagnifyingGlass}
                />
            )}
        </List>
    )
}
