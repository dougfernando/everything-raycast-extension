/**
 * Convert Windows FILETIME to JavaScript Date
 * FILETIME is the number of 100-nanosecond intervals since January 1, 1601 (UTC)
 */
export function fileTimeToDate(fileTime: number): Date {
  return new Date ( fileTime / 10000 - 11644473600000 );
}
