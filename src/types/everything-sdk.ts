/**
 * TypeScript interface for the native Everything SDK
 */
export interface EverythingSDK {
  // Write search state functions
  setSearch(search: string): void;
  setMatchPath(enable: boolean): void;
  setMatchCase(enable: boolean): void;
  setMatchWholeWord(enable: boolean): void;
  setRegex(enable: boolean): void;
  setMax(max: number): void;
  setOffset(offset: number): void;
  setSort(sort: number): void;
  setRequestFlags(flags: number): void;

  // Read search state functions
  getMatchPath(): boolean;
  getMatchCase(): boolean;
  getMatchWholeWord(): boolean;
  getRegex(): boolean;
  getMax(): number;
  getOffset(): number;
  getSearch(): string;
  getLastError(): number;
  getSort(): number;
  getRequestFlags(): number;

  // Execute query functions
  query(wait?: boolean): boolean;

  // Read result state functions
  getNumFileResults(): number;
  getNumFolderResults(): number;
  getNumResults(): number;
  getTotFileResults(): number;
  getTotFolderResults(): number;
  getTotResults(): number;
  isVolumeResult(index: number): boolean;
  isFolderResult(index: number): boolean;
  isFileResult(index: number): boolean;
  getResultFileName(index: number): string;
  getResultPath(index: number): string;
  getResultFullPathName(index: number): string;
  getResultExtension(index: number): string;
  getResultSize(index: number): number | null;
  getResultDateCreated(index: number): number | null;
  getResultDateModified(index: number): number | null;
  getResultDateAccessed(index: number): number | null;
  getResultAttributes(index: number): number;

  // Reset and cleanup
  reset(): void;
  cleanUp(): void;

  // Version functions
  getMajorVersion(): number;
  getMinorVersion(): number;
  getRevision(): number;
  getBuildNumber(): number;
}
