/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Everything CLI Path (es.exe) - Custom path to es.exe. Leave empty to use system PATH. */
  "esExePath": string,
  /** Custom File Explorer Command - Custom command to open directories. Use %s as a placeholder for the path. */
  "fileExplorerCommand": string,
  /** Open Folder as Default Action - If enabled, the primary action will be to open the file's location instead of opening the file itself. */
  "openFolderAsDefault": boolean,
  /** Minimum Characters to Trigger Search - Number of characters required before a search is performed. */
  "minCharsToSearch": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-file` command */
  export type SearchFile = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-file` command */
  export type SearchFile = {}
}

