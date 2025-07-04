/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Custom File Explorer Command - Custom command to open directories. Use %s as a placeholder for the path. */
  "fileExplorerCommand": string,
  /** Use Custom Explorer as Default Action - If enabled, the primary action will be to open the file's location in your custom explorer. */
  "useCustomExplorerAsDefault": boolean
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

