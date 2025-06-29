import { Action, ActionPanel, Icon, List, showToast, Toast, open } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { exec } from "child_process";
import { promisify } from "util";
import { basename } from "path";
import { useState } from "react";

const execAsync = promisify(exec);

interface FileInfo {
  name: string;
  commandline: string;
  icon?: string;
}

async function loadProfiles(searchText: string): Promise<FileInfo[]> {
  try {
    const command = `es.exe -n 100 "${searchText.replace(/"/g, '""')}"`;

    // Execute the command. Node.js defaults to 'utf8' encoding for the output string.
    const { stdout } = await execAsync(command);

    // Process the correctly encoded string directly.
    const filePaths = stdout
      .trim()
      .split(/\r?\n/)
      .filter((path) => path);

    const fileInfos: FileInfo[] = filePaths.map((fullPath) => ({
      name: basename(fullPath),
      commandline: fullPath,
    }));

    return fileInfos;
  } catch (error) {
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

// This function is now simplified and more robust using the Raycast API
async function openFileFound(profile: FileInfo) {
  try {
    await open(profile.commandline); // <-- Use the Raycast 'open' function
    await showToast({
      style: Toast.Style.Success,
      title: "Opening File",
      message: `Opened ${profile.name}`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error Opening File",
      message: `Failed to open ${profile.name}`,
    });
  }
}

function getFileIcon(): string {
  return Icon.Document;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const {
    data: profiles,
    isLoading,
    revalidate,
  } = useCachedPromise(
    (text: string) => loadProfiles(text),
    [searchText],
    { initialData: [] }
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Files with Everything..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {profiles && profiles.length > 0 ? (
        profiles.map((file) => (
          <List.Item
            key={file.commandline}
            title={file.name}
            subtitle={file.commandline}
            icon={getFileIcon()}
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
  );
}