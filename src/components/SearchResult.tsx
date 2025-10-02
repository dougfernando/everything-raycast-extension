import { Action, Icon, List } from "@raycast/api";
import { basename, dirname } from "path";
import { FileInfo, Preferences } from "../types";
import { formatBytes, truncatePath } from "../utils/file";
import { FileActionPanel } from "./FileActionPanel";
import { FileDetailMetadata } from "./FileDetailMetadata";
import { DirectoryBrowser } from "./DirectoryBrowser";

interface SearchResultProps {
  searchResults: FileInfo[];
  isLoading: boolean;
  isShowingDetail: boolean;
  searchText: string;
  minChars: number;
  preferences: Preferences;
  selectedFile: FileInfo | null;
  onToggleDetails: () => void;
  onSearchTextChange: (text: string) => void;
  onSelectionChange: (id: string | null) => void;
}

export function SearchResult({
  searchResults,
  isLoading,
  isShowingDetail,
  searchText,
  minChars,
  preferences,
  selectedFile,
  onToggleDetails,
  onSearchTextChange,
  onSelectionChange,
}: SearchResultProps) {
  return (
    <List
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      searchBarPlaceholder="Search Files with Everything..."
      onSearchTextChange={onSearchTextChange}
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
          subtitle={isShowingDetail ? basename(dirname(file.commandline)) : truncatePath(dirname(file.commandline))}
          icon={{ fileIcon: file.commandline }}
          accessories={[
            {
              text: file.isDirectory ? "Folder" : formatBytes(file.size || 0),
            },
          ]}
          actions={
            preferences && (
              <FileActionPanel file={file} preferences={preferences} onToggleDetails={onToggleDetails}>
                {dirname(file.commandline) !== file.commandline && (
                  <Action.Push
                    title="Navigate Up"
                    icon={Icon.ArrowUp}
                    target={
                      <DirectoryBrowser
                        directoryPath={dirname(file.commandline)}
                        preferences={preferences}
                        previousDir={file.commandline}
                        isShowingDetail={isShowingDetail}
                        onToggleDetails={onToggleDetails}
                      />
                    }
                    shortcut={{
                      macOS: { modifiers: ["cmd", "shift"], key: "arrowUp" },
                      windows: { modifiers: ["ctrl", "shift"], key: "arrowUp" },
                    }}
                  />
                )}
                <Action.Push
                  title="Navigate Down"
                  icon={Icon.ArrowDown}
                  target={
                    <DirectoryBrowser
                      directoryPath={file.commandline}
                      preferences={preferences}
                      previousDir={dirname(file.commandline)}
                      isShowingDetail={isShowingDetail}
                      onToggleDetails={onToggleDetails}
                    />
                  }
                  shortcut={{
                    macOS: { modifiers: ["cmd", "shift"], key: "arrowDown" },
                    windows: { modifiers: ["ctrl", "shift"], key: "arrowDown" },
                  }}
                />
              </FileActionPanel>
            )
          }
          detail={isShowingDetail && <FileDetailMetadata file={selectedFile} />}
        />
      ))}
    </List>
  );
}
