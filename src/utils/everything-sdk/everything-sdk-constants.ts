/**
 * Request flags for Everything SDK
 * These flags specify what information to retrieve for each search result
 */
export const EVERYTHING_REQUEST_FILE_NAME = 0x00000001;
export const EVERYTHING_REQUEST_PATH = 0x00000002;
export const EVERYTHING_REQUEST_FULL_PATH_AND_FILE_NAME = 0x00000004;
export const EVERYTHING_REQUEST_EXTENSION = 0x00000008;
export const EVERYTHING_REQUEST_SIZE = 0x00000010;
export const EVERYTHING_REQUEST_DATE_CREATED = 0x00000020;
export const EVERYTHING_REQUEST_DATE_MODIFIED = 0x00000040;
export const EVERYTHING_REQUEST_DATE_ACCESSED = 0x00000080;
export const EVERYTHING_REQUEST_ATTRIBUTES = 0x00000100;
export const EVERYTHING_REQUEST_FILE_LIST_FILE_NAME = 0x00000200;
export const EVERYTHING_REQUEST_RUN_COUNT = 0x00000400;
export const EVERYTHING_REQUEST_DATE_RUN = 0x00000800;
export const EVERYTHING_REQUEST_DATE_RECENTLY_CHANGED = 0x00001000;
export const EVERYTHING_REQUEST_HIGHLIGHTED_FILE_NAME = 0x00002000;
export const EVERYTHING_REQUEST_HIGHLIGHTED_PATH = 0x00004000;
export const EVERYTHING_REQUEST_HIGHLIGHTED_FULL_PATH_AND_FILE_NAME = 0x00008000;

/**
 * Sort types for Everything SDK
 * These constants define the available sort orders
 */
export const EVERYTHING_SORT_NAME_ASCENDING = 1;
export const EVERYTHING_SORT_NAME_DESCENDING = 2;
export const EVERYTHING_SORT_PATH_ASCENDING = 3;
export const EVERYTHING_SORT_PATH_DESCENDING = 4;
export const EVERYTHING_SORT_SIZE_ASCENDING = 5;
export const EVERYTHING_SORT_SIZE_DESCENDING = 6;
export const EVERYTHING_SORT_EXTENSION_ASCENDING = 7;
export const EVERYTHING_SORT_EXTENSION_DESCENDING = 8;
export const EVERYTHING_SORT_TYPE_NAME_ASCENDING = 9;
export const EVERYTHING_SORT_TYPE_NAME_DESCENDING = 10;
export const EVERYTHING_SORT_DATE_CREATED_ASCENDING = 11;
export const EVERYTHING_SORT_DATE_CREATED_DESCENDING = 12;
export const EVERYTHING_SORT_DATE_MODIFIED_ASCENDING = 13;
export const EVERYTHING_SORT_DATE_MODIFIED_DESCENDING = 14;
export const EVERYTHING_SORT_ATTRIBUTES_ASCENDING = 15;
export const EVERYTHING_SORT_ATTRIBUTES_DESCENDING = 16;
export const EVERYTHING_SORT_FILE_LIST_FILENAME_ASCENDING = 17;
export const EVERYTHING_SORT_FILE_LIST_FILENAME_DESCENDING = 18;
export const EVERYTHING_SORT_RUN_COUNT_ASCENDING = 19;
export const EVERYTHING_SORT_RUN_COUNT_DESCENDING = 20;
export const EVERYTHING_SORT_DATE_RECENTLY_CHANGED_ASCENDING = 21;
export const EVERYTHING_SORT_DATE_RECENTLY_CHANGED_DESCENDING = 22;
export const EVERYTHING_SORT_DATE_ACCESSED_ASCENDING = 23;
export const EVERYTHING_SORT_DATE_ACCESSED_DESCENDING = 24;
export const EVERYTHING_SORT_DATE_RUN_ASCENDING = 25;
export const EVERYTHING_SORT_DATE_RUN_DESCENDING = 26;

/**
 * Error codes for Everything SDK
 * These constants define the possible error states
 */
export const EVERYTHING_OK = 0;
export const EVERYTHING_ERROR_MEMORY = 1;
export const EVERYTHING_ERROR_IPC = 2;
export const EVERYTHING_ERROR_REGISTERCLASSEX = 3;
export const EVERYTHING_ERROR_CREATEWINDOW = 4;
export const EVERYTHING_ERROR_CREATETHREAD = 5;
export const EVERYTHING_ERROR_INVALIDINDEX = 6;
export const EVERYTHING_ERROR_INVALIDCALL = 7;

/**
 * Get human-readable error message from error code
 */
export function getErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case EVERYTHING_OK:
      return "The operation completed successfully.";
    case EVERYTHING_ERROR_MEMORY:
      return "Failed to allocate memory for the search query.";
    case EVERYTHING_ERROR_IPC:
      return "Everything is not running.";
    case EVERYTHING_ERROR_REGISTERCLASSEX:
      return "Failed to register the search query window class.";
    case EVERYTHING_ERROR_CREATEWINDOW:
      return "Failed to create the search query window.";
    case EVERYTHING_ERROR_CREATETHREAD:
      return "Failed to create the search query thread.";
    case EVERYTHING_ERROR_INVALIDINDEX:
      return "Invalid index. The index must be greater or equal to 0 and less than the number of visible results.";
    case EVERYTHING_ERROR_INVALIDCALL:
      return "Invalid call.";
    default:
      return `Unknown error code: ${errorCode}`;
  }
}

/**
 * Map preference sort string to Everything SDK sort constant
 */
export function mapSortPreferenceToSDK(sortPreference: string): number {
  const sortMap: Record<string, number> = {
    "-sort name-ascending": EVERYTHING_SORT_NAME_ASCENDING,
    "-sort name-descending": EVERYTHING_SORT_NAME_DESCENDING,
    "-sort path-ascending": EVERYTHING_SORT_PATH_ASCENDING,
    "-sort path-descending": EVERYTHING_SORT_PATH_DESCENDING,
    "-sort size-ascending": EVERYTHING_SORT_SIZE_ASCENDING,
    "-sort size-descending": EVERYTHING_SORT_SIZE_DESCENDING,
    "-sort extension-ascending": EVERYTHING_SORT_EXTENSION_ASCENDING,
    "-sort extension-descending": EVERYTHING_SORT_EXTENSION_DESCENDING,
    "-sort date-created-ascending": EVERYTHING_SORT_DATE_CREATED_ASCENDING,
    "-sort date-created-descending": EVERYTHING_SORT_DATE_CREATED_DESCENDING,
    "-sort date-modified-ascending": EVERYTHING_SORT_DATE_MODIFIED_ASCENDING,
    "-sort date-modified-descending": EVERYTHING_SORT_DATE_MODIFIED_DESCENDING,
    "-sort date-accessed-ascending": EVERYTHING_SORT_DATE_ACCESSED_ASCENDING,
    "-sort date-accessed-descending": EVERYTHING_SORT_DATE_ACCESSED_DESCENDING,
  };

  return sortMap[sortPreference] || EVERYTHING_SORT_NAME_ASCENDING;
}
