import { getPreferenceValues, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { FileInfo, Preferences } from "./types";
import { useCachedPromise } from "@raycast/utils";
import { loadFilesList } from "./services/fileOperations";
import { formatBytes, truncatePath } from "./utils/file";
import { basename, dirname } from "path";
import { FileActionPanel } from "./components/FileActionPanel";
import { FileDetailMetadata } from "./components/FileDetailMetadata";
import { useDirectoryStack } from "./hooks/useDirectoryStack";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const directoryStack = useDirectoryStack();

  useEffect(() => {
    const loadPrefs = () => {
      const prefs = getPreferenceValues<Preferences>();
      setPreferences(prefs);
    };
    loadPrefs();
  }, []);

  const minChars = parseInt(preferences?.minCharsToSearch || "3", 10);

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
    },
  );

  async function onSelectionChange(itemId: string | null) {
    setSelectedFile(null);

    if (!itemId) return;

    const fileInfo = searchResults.find((file) => file.commandline === itemId);
    if (fileInfo) {
      setSelectedFile(fileInfo);
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
          subtitle={isShowingDetail ? basename(dirname(file.commandline)) : truncatePath(dirname(file.commandline))}
          icon={{ fileIcon: file.commandline }}
          accessories={[
            {
              text: file.isDirectory ? "Folder" : formatBytes(file.size || 0),
            },
          ]}
          actions={
            preferences && (
              <FileActionPanel
                file={selectedFile}
                isShowingDetail={isShowingDetail}
                onToggleDetails={() => setIsShowingDetail(!isShowingDetail)}
                preferences={preferences}
                directoryStack={directoryStack}
              ></FileActionPanel>
            )
          }
          detail={isShowingDetail && <FileDetailMetadata file={selectedFile} />}
        />
      ))}
    </List>
  );
}
