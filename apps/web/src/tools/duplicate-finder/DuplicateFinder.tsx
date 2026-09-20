"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Images } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { formatBytes } from "@/lib/images/formatBytes";
import { validateImageFile } from "@/lib/images/validateImageFile";
import { isHeicFile } from "@/lib/images/isHeicFile";
import { convertHeicToJpeg } from "@/lib/images/convertHeicToJpeg";
import { useDuplicateFinder } from "./useDuplicateFinder";
import { collectFilesFromDirectory } from "./collectFilesFromDirectory";
import { calculateSavings } from "./calculateSavings";

const TOOL = "duplicate-finder";

// The File System Access API (a real folder scan) only exists on
// Chromium-based browsers - no type in lib.dom.d.ts covers it consistently
// across TS versions, so this stays narrow and explicit.
type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

export function DuplicateFinder() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [supportsFolderScan, setSupportsFolderScan] = useState(false);
  const { state, findDuplicates, reset } = useDuplicateFinder();

  useEffect(() => {
    trackEvent({ tool: TOOL, event: "tool_viewed" });
  }, []);

  useEffect(() => {
    // Deliberately set after mount, not computed during render: this is a
    // client-only browser-API check (`window` doesn't exist during SSR),
    // so setting it during the initial render would make the server-
    // rendered HTML and the first client render disagree and trigger a
    // hydration mismatch. Setting it a tick after mount is the standard,
    // hydration-safe way to branch on browser-only capabilities.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsFolderScan(
      typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function",
    );
  }, []);

  useEffect(() => {
    if (state.status === "done") {
      trackEvent({
        tool: TOOL,
        event: "compression_completed",
        metadata: { groupsFound: state.groups.length },
      });
    }
  }, [state]);

  const prepareFiles = async (rawFiles: File[]): Promise<File[]> => {
    const validFiles: File[] = [];
    for (const original of rawFiles) {
      let file = original;
      if (isHeicFile(file)) {
        try {
          file = await convertHeicToJpeg(file);
        } catch {
          continue; // skip photos that fail to convert rather than aborting the batch
        }
      }
      if (validateImageFile(file).valid) validFiles.push(file);
    }
    return validFiles;
  };

  const startScan = async (rawFiles: File[], source: "folder" | "picker") => {
    setValidationError(null);
    trackEvent({
      tool: TOOL,
      event: "file_selected",
      metadata: { count: rawFiles.length, source },
    });

    setIsPreparing(true);
    const validFiles = await prepareFiles(rawFiles);
    setIsPreparing(false);

    if (validFiles.length < 2) {
      setValidationError(
        rawFiles.length < 2
          ? "Select at least 2 photos to compare."
          : "Found fewer than 2 readable photos in that selection.",
      );
      return;
    }

    reset();
    trackEvent({
      tool: TOOL,
      event: "compression_started",
      metadata: { count: validFiles.length, source },
    });
    findDuplicates(validFiles);
  };

  const handleChooseFolder = async () => {
    setValidationError(null);
    try {
      const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
      if (!picker) return;
      const directory = await picker();
      setIsPreparing(true);
      const files = await collectFilesFromDirectory(directory);
      setIsPreparing(false);
      await startScan(files, "folder");
    } catch (err) {
      setIsPreparing(false);
      // The user closing the picker without choosing anything throws
      // AbortError - not a real failure, nothing to show for that.
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Folder scan failed:", err);
        setValidationError("Couldn't read that folder. Try choosing photos instead.");
      }
    }
  };

  const savings = useMemo(() => {
    if (state.status !== "done") return null;
    return calculateSavings(
      state.groups.map((group) => group.map(({ id, file }) => ({ id, size: file.size }))),
    );
  }, [state]);

  const hasStarted = state.status !== "idle";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {!hasStarted && (
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            We&rsquo;ll check the photos you choose for duplicates and near-duplicates.
            Nothing is uploaded &mdash; the comparison happens entirely on your
            device. Nothing is deleted automatically either: you&rsquo;ll get an
            exact list to review yourself.
          </p>

          {supportsFolderScan && (
            <button
              onClick={handleChooseFolder}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <FolderOpen size={16} />
              Choose a Folder to Scan
            </button>
          )}

          <div className="w-full">
            {supportsFolderScan && (
              <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-600">
                or select individual photos instead
              </p>
            )}
            <FileDropzone
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              hint="Select 2 or more photos"
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Images size={16} />
                  Tap to choose photos, or drop them here
                </span>
              }
              multiple
              onFilesSelected={(files) => startScan(files, "picker")}
            />
          </div>
        </div>
      )}

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {isPreparing && (
        <p className="text-sm text-zinc-500">Reading photos&hellip;</p>
      )}

      {state.status === "hashing" && (
        <p className="text-sm text-zinc-500">
          Checking photo {state.completed} of {state.total}&hellip;
        </p>
      )}

      {state.status === "done" && state.groups.length === 0 && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-zinc-500">No duplicates found &mdash; nice and tidy!</p>
          <ScanAgainButton onClick={reset} />
        </div>
      )}

      {state.status === "done" && state.groups.length > 0 && savings && (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Found {state.groups.length}{" "}
              {state.groups.length === 1 ? "group" : "groups"} of similar photos
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You could save {formatBytes(savings.totalReclaimableBytes)} by removing
              the extra copies
            </p>
          </div>

          {state.groups.map((group, index) => {
            const groupSavings = savings.groups[index];
            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {group.length} similar photos &middot; save{" "}
                  {formatBytes(groupSavings.reclaimableBytes)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {group.map(({ id, file }) => {
                    const isKeeper = id === groupSavings.keepId;
                    return (
                      <div key={id} className="flex flex-col items-center gap-1">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element -- object URLs can't use next/image's optimizer */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className={`h-20 w-20 rounded-lg object-cover ${
                              isKeeper ? "ring-2 ring-indigo-500" : "opacity-60"
                            }`}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-medium ${
                            isKeeper
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {isKeeper ? "Keep" : "Extra copy"}
                        </p>
                        <p
                          className="max-w-20 truncate text-[10px] text-zinc-400"
                          title={file.name}
                        >
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <ScanAgainButton onClick={reset} />
        </div>
      )}
    </div>
  );
}

function ScanAgainButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-center rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      Scan again
    </button>
  );
}
