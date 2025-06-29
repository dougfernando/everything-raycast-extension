/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Should start with empty list? - Decides if the search should start with an empty list or not */
  "emptyStart": boolean
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

