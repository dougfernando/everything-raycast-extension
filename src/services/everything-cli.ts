import { showToast, Toast } from "@raycast/api";
import { stat } from "fs/promises";
import { basename } from "path";
import { FileInfo, Preferences } from "../types";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function searchFilesWithCLI(searchText: string, preferences: Preferences): Promise<FileInfo[]> {
  if (!searchText) {
    return [];
  }

  const { esExePath, defaultSort } = preferences;

  try {
    const esCommand = esExePath || "es.exe";

    // Use es.exe with CSV output format to get file info in one call
    const command = `chcp 65001 > nul && "${esCommand}" -n 100 -csv -name -filename-column -size -date-created -date-modified ${defaultSort} ${searchText}`;

    const { stdout } = await execAsync(command);

    const lines = stdout
      .trim()
      .split(/\r?\n/)
      .filter((line) => line);

    // Skip header line and parse CSV data
    const dataLines = lines.slice(1);

    const results = await Promise.all(
      dataLines.map(async (line) => {
        // Parse CSV line (handle quoted values that may contain commas)
        const csvRegex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
        const values: string[] = [];
        let match;

        while ((match = csvRegex.exec(line)) !== null) {
          values.push(match[1] || match[2] || "");
        }

        if (values.length < 5) {
          // Fallback if CSV parsing fails
          const fullPath = values[0] || line;
          // Check if it's a directory
          let isDirectory = false;
          try {
            const stats = await stat(fullPath);
            isDirectory = stats.isDirectory();
          } catch {
            // If stat fails, assume it's a file
          }
          return {
            name: basename(fullPath),
            commandline: fullPath,
            isDirectory,
          };
        }

        const [fileName, fullPath, sizeStr, dateCreatedStr, dateModifiedStr] = values;

        // Check if it's a directory
        let isDirectory = false;
        try {
          const stats = await stat(fullPath);
          isDirectory = stats.isDirectory();
        } catch {
          // If stat fails, assume it's a file
        }

        return {
          name: fileName || basename(fullPath),
          commandline: fullPath,
          size: sizeStr && !isDirectory ? parseInt(sizeStr, 10) : undefined,
          dateCreated: Date.parse(dateCreatedStr) ? new Date(dateCreatedStr) : undefined,
          dateModified: Date.parse(dateModifiedStr) ? new Date(dateModifiedStr) : undefined,
          isDirectory,
        };
      }),
    );
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const hasStderr = error && typeof error === "object" && "stderr" in error;
    const stderr = hasStderr ? String(error.stderr) : "";

    // Check if es.exe command is not recognized (Windows) or not found (Unix-like)
    if (
      stderr.includes("not recognized") ||
      stderr.includes("command not found") ||
      errorMessage.includes("not recognized")
    ) {
      await showToast({
        style: Toast.Style.Failure,
        title: esExePath ? "Custom es.exe path not found" : "'es.exe' not found",
        message: esExePath
          ? `Cannot find es.exe at: ${esExePath}`
          : "Please ensure Everything's command-line tool is in your system's PATH or set a custom path in preferences.",
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Searching Files",
        message: errorMessage,
      });
    }
    return [];
  }
}
