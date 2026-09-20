"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { formatBytes } from "@/lib/images/formatBytes";
import { validateImageFile } from "@/lib/images/validateImageFile";
import { isHeicFile } from "@/lib/images/isHeicFile";
import { convertHeicToJpeg } from "@/lib/images/convertHeicToJpeg";
import { calculateResizedDimensions, type Dimensions } from "./calculateResizedDimensions";
import { useImageResizer } from "./useImageResizer";

const TOOL = "image-resizer";

const REASON_MESSAGES: Record<string, string> = {
  "unsupported-type": "That file type isn't supported. Use JPEG, PNG, or WebP.",
  "too-large": "That file is too large. Max size is 25 MB.",
};

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [natural, setNatural] = useState<Dimensions | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { state, resize, reset } = useImageResizer();

  useEffect(() => {
    trackEvent({ tool: TOOL, event: "tool_viewed" });
  }, []);

  useEffect(() => {
    if (state.status === "done" && file) {
      trackEvent({
        tool: TOOL,
        event: "compression_completed",
        metadata: { inputSize: file.size, outputSize: state.blob.size, width, height },
      });
    }
    // Only fire when the resize actually finishes - not on every width/height edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleFilesSelected = async ([selected]: File[]) => {
    setValidationError(null);
    trackEvent({
      tool: TOOL,
      event: "file_selected",
      metadata: { fileType: selected.type, fileSize: selected.size },
    });

    let workingFile = selected;
    if (isHeicFile(selected)) {
      setIsConverting(true);
      try {
        workingFile = await convertHeicToJpeg(selected);
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setValidationError(
          "Couldn't convert this HEIC photo. Try exporting it as JPEG first.",
        );
        setIsConverting(false);
        return;
      }
      setIsConverting(false);
    }

    const result = validateImageFile(workingFile);
    if (!result.valid) {
      setValidationError(REASON_MESSAGES[result.reason]);
      setFile(null);
      return;
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(workingFile);
    } catch (err) {
      console.error("Could not read image dimensions:", err);
      setValidationError("That file doesn't look like a valid image.");
      setFile(null);
      return;
    }
    setNatural({ width: bitmap.width, height: bitmap.height });
    setWidth(bitmap.width);
    setHeight(bitmap.height);
    bitmap.close();

    setFile(workingFile);
    reset();
  };

  const updateWidth = (next: number) => {
    setWidth(next);
    if (lockAspectRatio && natural) {
      setHeight(
        calculateResizedDimensions({
          originalWidth: natural.width,
          originalHeight: natural.height,
          targetWidth: next,
          maintainAspectRatio: true,
        }).height,
      );
    }
  };

  const updateHeight = (next: number) => {
    setHeight(next);
    if (lockAspectRatio && natural) {
      setWidth(
        calculateResizedDimensions({
          originalWidth: natural.width,
          originalHeight: natural.height,
          targetHeight: next,
          maintainAspectRatio: true,
        }).width,
      );
    }
  };

  const handleResize = () => {
    if (!file) return;
    trackEvent({ tool: TOOL, event: "compression_started", metadata: { width, height } });
    resize(file, width, height);
  };

  const downloadUrl = useMemo(() => {
    if (state.status !== "done") return null;
    return URL.createObjectURL(state.blob);
  }, [state]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hint="JPEG, PNG, WebP, or HEIC"
        onFilesSelected={handleFilesSelected}
      />

      {isConverting && (
        <p className="text-sm text-zinc-500">Converting HEIC photo&hellip;</p>
      )}

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {file && natural && (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Original: {natural.width}&times;{natural.height} ({formatBytes(file.size)})
          </p>

          <div className="flex w-full items-end gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              Width
              <input
                type="number"
                min={1}
                value={width}
                onChange={(event) => updateWidth(Number(event.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              Height
              <input
                type="number"
                min={1}
                value={height}
                onChange={(event) => updateHeight(Number(event.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          </div>

          <label className="flex w-full items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={lockAspectRatio}
              onChange={(event) => setLockAspectRatio(event.target.checked)}
              className="accent-indigo-600"
            />
            Maintain aspect ratio
          </label>

          <button
            onClick={handleResize}
            className="w-full rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Resize
          </button>

          {state.status === "resizing" && (
            <p className="text-sm text-zinc-500">Resizing&hellip;</p>
          )}

          {state.status === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          {state.status === "done" && downloadUrl && (
            <a
              href={downloadUrl}
              download={`resized-${file.name.replace(/\.[^.]+$/, "")}.jpg`}
              onClick={() => trackEvent({ tool: TOOL, event: "download_clicked" })}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Download ({formatBytes(state.blob.size)})
            </a>
          )}
        </div>
      )}
    </div>
  );
}
