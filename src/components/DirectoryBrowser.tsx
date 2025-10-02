import { Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { FileInfo, Preferences } from "../types";
import { loadDirectoryContents } from "../services/fileOperations";
import { useEffect, useState } from "react";
import { basename, dirname } from "path";
import { formatBytes } from "../utils/file";
import { FileActionPanel } from "./FileActionPanel";
import { FileDetailMetadata } from "./FileDetailMetadata";
import { useDirectoryStack } from "../hooks/useDirectoryStack";

interface DirectoryBrowserProps {
  directoryPath: string;
  preferences: Preferences;
  isShowingDetail: boolean;
  onToggleDetails: () => void;
  directoryStack: ReturnType<typeof useDirectoryStack>;
}

export function DirectoryBrowser({
  directoryPath,
  preferences,
  isShowingDetail,
  onToggleDetails,
  directoryStack,
}: DirectoryBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    directoryStack.push(directoryPath);
    return () => {
      console.log("DirectoryBrowser unmounting, popping directory stack");
      directoryStack.pop();
    };
  }, []);

  const { data: directoryContents, isLoading } = useCachedPromise(
    async (path: string) => {
      return loadDirectoryContents(path);
    },
    [directoryPath],
    {
      initialData: [],
    },
  );

  async function onSelectionChange(itemId: string | null) {
    if (!itemId) {
      return;
    }

    const fileInfo = directoryContents.find((file) => file.commandline === itemId);
    if (fileInfo) {
      setSelectedFile(fileInfo);
    }
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      navigationTitle={`Browse: ${basename(directoryPath)}`}
      onSelectionChange={onSelectionChange}
    >
      <List.EmptyView
        title="Empty Directory"
        description={`No contents found in ${directoryPath}`}
        icon={Icon.Folder}
      />
      {directoryContents.map((item, index) => (
        <List.Item
          key={`${item.commandline}-${index}`}
          id={item.commandline}
          title={item.name}
          subtitle={isShowingDetail ? dirname(item.commandline) : undefined}
          icon={{ fileIcon: item.commandline }}
          accessories={[
            {
              text: item.isDirectory ? "Folder" : formatBytes(item.size || 0),
            },
          ]}
          actions={
            <FileActionPanel
              file={item}
              directory={directoryPath}
              preferences={preferences}
              isShowingDetail={isShowingDetail}
              onToggleDetails={onToggleDetails}
              directoryStack={directoryStack}
            />
          }
          detail={isShowingDetail && <FileDetailMetadata file={selectedFile || item} />}
        />
      ))}
    </List>
  );
}
