/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Settings Path - Path to file */
  "settingsPath": string,
  /** Profile Sort Order - Choose how the sorting order of the profiles is determined */
  "sortOrder": "alphabetical" | "settings",
  /** Quake Mode - Open all profiles in Quake Mode */
  "quakeMode": boolean
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

