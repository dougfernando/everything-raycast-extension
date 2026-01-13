import { showToast, Toast, environment } from "@raycast/api";
import { join } from "path";
import { FileInfo, Preferences } from "../types";
import { EverythingSDK } from "../types/everything-sdk";
import {
  EVERYTHING_REQUEST_FILE_NAME,
  EVERYTHING_REQUEST_PATH,
  EVERYTHING_REQUEST_SIZE,
  EVERYTHING_REQUEST_DATE_CREATED,
  EVERYTHING_REQUEST_DATE_MODIFIED,
  mapSortPreferenceToSDK,
  getErrorMessage,
} from "../utils/everything-sdk/everything-sdk-constants";
import { fileTimeToDate } from "../utils/everything-sdk/everything-sdk-utils";

const { platform, arch } = process;

let everythingSDK: EverythingSDK | null = null;
let loadError: Error | null = null;

// Load the appropriate native module based on platform and architecture
switch (platform) {
  case "win32":
    switch (arch) {
      case "x64":
        try {
          everythingSDK = require(join(environment.assetsPath, "/native/everything-search-node-64.node"));
        } catch (e) {
          loadError = e as Error;
        }
        break;
      case "ia32":
        try {
          everythingSDK = require(join(environment.assetsPath, "/native/everything-search-node-32.node"));
        } catch (e) {
          loadError = e as Error;
        }
        break;
      case "arm64":
        try {
          everythingSDK = require(join(environment.assetsPath, "/native/everything-search-node-arm64.node"));
        } catch (e) {
          loadError = e as Error;
        }
        break;
      default:
        loadError = new Error(`Unsupported architecture on Windows: ${arch}`);
    }
    break;
  default:
    loadError = new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}

if (loadError) {
  console.error("Failed to load native Everything SDK:", loadError);
}

export async function searchFilesWithSDK(searchText: string, preferences: Preferences): Promise<FileInfo[]> {
  if (!searchText) {
    return [];
  }
  
  if (!everythingSDK) {
    await showToast({
      style: Toast.Style.Failure,
      title: "SDK Not Available",
      message: "Failed to load Everything SDK. Please use CLI mode instead.",
    });
    return [];
  }

  try {
    // Set configured parameters for search
    everythingSDK.setSearch(searchText);
    everythingSDK.setMax(100);

    const sortType = mapSortPreferenceToSDK(preferences.defaultSort);
    everythingSDK.setSort(sortType);

    const requestFlags =
      EVERYTHING_REQUEST_FILE_NAME |
      EVERYTHING_REQUEST_PATH |
      EVERYTHING_REQUEST_SIZE |
      EVERYTHING_REQUEST_DATE_CREATED |
      EVERYTHING_REQUEST_DATE_MODIFIED;

    everythingSDK.setRequestFlags(requestFlags);

    const success = everythingSDK.query(true);

    if (!success) {
      const errorCode = everythingSDK.getLastError();
      throw new Error(getErrorMessage(errorCode));
    }

    const numResults = everythingSDK.getNumResults();
    const results: FileInfo[] = [];

    for (let i = 0; i < numResults; i++) {
      try {
        const fullPath = everythingSDK.getResultFullPathName(i);
        const fileName = everythingSDK.getResultFileName(i);
        const isDirectory = everythingSDK.isFolderResult(i);

        const sizeValue = !isDirectory ? everythingSDK.getResultSize(i) : null;
        const size = sizeValue !== null ? sizeValue : undefined;

        const dateCreatedValue = everythingSDK.getResultDateCreated(i);
        const dateModifiedValue = everythingSDK.getResultDateModified(i);

        const dateCreated = dateCreatedValue !== null ? fileTimeToDate(dateCreatedValue) : undefined;
        const dateModified = dateModifiedValue !== null ? fileTimeToDate(dateModifiedValue) : undefined;

        results.push({
          name: fileName,
          commandline: fullPath,
          size,
          dateCreated,
          dateModified,
          isDirectory,
        });
      } catch (error) {
        console.error(`Error processing result ${i}:`, error);
      }
    }
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await showToast({
      style: Toast.Style.Failure,
      title: "Error Searching Files",
      message: errorMessage,
    });
    
    return [];
  }
}