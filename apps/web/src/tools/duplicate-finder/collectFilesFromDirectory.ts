import { isImageFilename } from "./isImageFilename";

/** Recursively walks a directory handle (from the File System Access API)
 * and returns every image file found, at any depth. Real browser API, not
 * unit tested - same as our other integration boundaries (Canvas decode,
 * HEIC decode); verified manually/via E2E instead. */
export async function collectFilesFromDirectory(
  directory: FileSystemDirectoryHandle,
): Promise<File[]> {
  const files: File[] = [];

  for await (const entry of directory.values()) {
    if (entry.kind === "file") {
      if (isImageFilename(entry.name)) {
        files.push(await entry.getFile());
      }
    } else {
      files.push(...(await collectFilesFromDirectory(entry)));
    }
  }

  return files;
}
