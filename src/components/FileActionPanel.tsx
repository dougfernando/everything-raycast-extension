import { Action, ActionPanel, Icon, open, useNavigation } from "@raycast/api";
import { FileInfo, Preferences } from "../types";
import { openFileFound, runAsAdministrator, showInExplorer, copyFileWithApi } from "../services/fileOperations";
import { isExecutableFile } from "../utils/file";
import { useEffect, useState } from "react";
import { useDirectoryStack } from "../hooks/useDirectoryStack";
import { DirectoryBrowser } from "./DirectoryBrowser";
import { dirname } from "path";

interface FileActionPanelProps {
  file: FileInfo | null;
  directory?: string;
  preferences: Preferences;
  isShowingDetail: boolean;
  onToggleDetails: () => void;
  directoryStack: ReturnType<typeof useDirectoryStack>;
  children?: React.ReactNode;
}

export function FileActionPanel({
  file,
  directory,
  preferences,
  isShowingDetail,
  onToggleDetails,
  directoryStack,
  children,
}: FileActionPanelProps) {
  if (!file) return null;

  const [isExecutable, setIsExecutable] = useState<boolean>(false);
  const openFolderAsDefault = preferences?.openFolderAsDefault;
  const { pop: navigateBack } = useNavigation();

  useEffect(() => {
    async function checkIfExecutable() {
      setIsExecutable(false);

      if (file) {
        const result = await isExecutableFile(file.commandline);
        setIsExecutable(result);
      }
    }

    checkIfExecutable();
  }, [file]);

  const directoryToCheck = directory || file.commandline;
  const isBaseDirectory = dirname(directoryToCheck) === directoryToCheck;

  return (
    <ActionPanel>
      <ActionPanel.Section>
        {openFolderAsDefault ? (
          <>
            <Action
              title="Show in Explorer"
              icon={Icon.Folder}
              onAction={() => showInExplorer(file.commandline, preferences)}
            />
            <Action
              title="Open"
              icon={Icon.Document}
              onAction={() => (file.isDirectory ? open(file.commandline) : openFileFound(file))}
            />
          </>
        ) : (
          <>
            <Action
              title="Open"
              icon={Icon.Document}
              onAction={() => (file.isDirectory ? open(file.commandline) : openFileFound(file))}
            />
            <Action
              title="Show in Explorer"
              icon={Icon.Folder}
              onAction={() => showInExplorer(file.commandline, preferences)}
            />
          </>
        )}

        {isExecutable && (
          <Action
            title="Run as Administrator"
            icon={Icon.Shield}
            onAction={() => runAsAdministrator(file.commandline)}
          />
        )}
        <Action
          title="Toggle Details"
          icon={Icon.AppWindowSidebarLeft}
          onAction={onToggleDetails}
          shortcut={{
            macOS: { modifiers: ["cmd", "shift"], key: "i" },
            windows: { modifiers: ["ctrl", "shift"], key: "i" },
          }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Copy File"
          icon={Icon.Clipboard}
          onAction={() => copyFileWithApi(file)}
          shortcut={{ modifiers: ["ctrl", "shift"], key: "." }}
        />
        <Action.CopyToClipboard
          title="Copy Name"
          content={file.name}
          shortcut={{
            macOS: { modifiers: ["cmd"], key: "c" },
            windows: { modifiers: ["ctrl"], key: "c" },
          }}
        />
        <Action.CopyToClipboard
          title="Copy Path"
          content={file.commandline}
          shortcut={{
            macOS: { modifiers: ["cmd", "shift"], key: "c" },
            windows: { modifiers: ["ctrl", "shift"], key: "c" },
          }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        {!isBaseDirectory &&
          (directoryStack.peek() === dirname(file.commandline) ? (
            <Action
              title="Navigate Up"
              icon={Icon.ArrowUp}
              onAction={() => navigateBack()}
              shortcut={{
                macOS: { modifiers: ["cmd", "shift"], key: "arrowUp" },
                windows: { modifiers: ["ctrl", "shift"], key: "arrowUp" },
              }}
            />
          ) : (
            <Action.Push
              title="Navigate Up"
              icon={Icon.ArrowUp}
              target={
                <DirectoryBrowser
                  directoryPath={dirname(file.commandline)}
                  preferences={preferences}
                  isShowingDetail={isShowingDetail}
                  onToggleDetails={onToggleDetails}
                  directoryStack={directoryStack}
                />
              }
              shortcut={{
                macOS: { modifiers: ["cmd", "shift"], key: "arrowUp" },
                windows: { modifiers: ["ctrl", "shift"], key: "arrowUp" },
              }}
            />
          ))}
        {file?.isDirectory &&
          (directoryStack.peek() === file.commandline ? (
            <Action
              title="Navigate Down"
              icon={Icon.ArrowDown}
              onAction={() => navigateBack()}
              shortcut={{
                macOS: { modifiers: ["cmd", "shift"], key: "arrowDown" },
                windows: { modifiers: ["ctrl", "shift"], key: "arrowDown" },
              }}
            />
          ) : (
            <Action.Push
              title="Navigate Down"
              icon={Icon.ArrowDown}
              target={
                <DirectoryBrowser
                  directoryPath={file.commandline}
                  preferences={preferences}
                  isShowingDetail={isShowingDetail}
                  onToggleDetails={onToggleDetails}
                  directoryStack={directoryStack}
                />
              }
              shortcut={{
                macOS: { modifiers: ["cmd", "shift"], key: "arrowDown" },
                windows: { modifiers: ["ctrl", "shift"], key: "arrowDown" },
              }}
            />
          ))}
      </ActionPanel.Section>
    </ActionPanel>
  );
}
