import { getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { FileInfo, Preferences } from "./types";
import { useCachedPromise } from "@raycast/utils";
import { loadFilesList } from "./services/fileOperations";
import { SearchResult } from "./components/SearchResult";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  const preferences: Preferences = getPreferenceValues();
  const minChars: number = parseInt(preferences?.minCharsToSearch || "3", 10);

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

  const onToggleDetail = () => {
    setIsShowingDetail(!isShowingDetail);
  };

  async function onSelectionChange(itemId: string | null) {
    setSelectedFile(null);

    if (!itemId) return;

    const fileInfo = searchResults.find((file) => file.commandline === itemId);
    if (fileInfo) {
      setSelectedFile(fileInfo);
    }
  }

  return (
    <SearchResult
      searchResults={searchResults}
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      searchText={searchText}
      minChars={minChars}
      preferences={preferences}
      selectedFile={selectedFile}
      onToggleDetails={onToggleDetail}
      onSearchTextChange={setSearchText}
      onSelectionChange={onSelectionChange}
    />
  );
}
