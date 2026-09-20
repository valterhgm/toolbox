"use client";

import { useEffect, useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { formatBytes } from "@/lib/images/formatBytes";
import { validateImageFile } from "@/lib/images/validateImageFile";
import { isHeicFile } from "@/lib/images/isHeicFile";
import { convertHeicToJpeg } from "@/lib/images/convertHeicToJpeg";
import { useDuplicateFinder } from "./useDuplicateFinder";

const TOOL = "duplicate-finder";

export function DuplicateFinder() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { state, findDuplicates, reset } = useDuplicateFinder();

  useEffect(() => {
    trackEvent({ tool: TOOL, event: "tool_viewed" });
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

  const handleFilesSelected = async (selected: File[]) => {
    setValidationError(null);
    trackEvent({
      tool: TOOL,
      event: "file_selected",
      metadata: { count: selected.length },
    });

    const validFiles: File[] = [];
    for (const original of selected) {
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

    if (validFiles.length < 2) {
      setValidationError("Select at least 2 photos to compare.");
      return;
    }

    reset();
    trackEvent({
      tool: TOOL,
      event: "compression_started",
      metadata: { count: validFiles.length },
    });
    findDuplicates(validFiles);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hint="Select 2 or more photos"
        label="Tap to choose photos, or drop them here"
        multiple
        onFilesSelected={handleFilesSelected}
      />

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {state.status === "hashing" && (
        <p className="text-sm text-zinc-500">
          Checking photo {state.completed} of {state.total}&hellip;
        </p>
      )}

      {state.status === "done" && state.groups.length === 0 && (
        <p className="text-sm text-zinc-500">
          No duplicates found &mdash; nice and tidy!
        </p>
      )}

      {state.status === "done" && state.groups.length > 0 && (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Found {state.groups.length}{" "}
            {state.groups.length === 1 ? "group" : "groups"} of similar photos
          </p>
          {state.groups.map((group, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {group.length} similar photos
              </p>
              <div className="flex flex-wrap gap-3">
                {group.map(({ id, file }) => (
                  <div key={id} className="flex flex-col items-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- object URLs can't use next/image's optimizer */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <p className="max-w-20 truncate text-xs text-zinc-400" title={file.name}>
                      {formatBytes(file.size)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
