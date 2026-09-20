export {};

// TypeScript's bundled DOM types recognize FileSystemDirectoryHandle but,
// as of this TS version, omit its async-iteration methods from the File
// System Access API spec. Interfaces are open/mergeable in TypeScript, so
// this augments the existing global type rather than redefining it.
declare global {
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    keys(): AsyncIterableIterator<string>;
    entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
  }
}
