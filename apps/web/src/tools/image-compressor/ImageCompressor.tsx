"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { formatBytes } from "./formatBytes";
import { validateImageFile } from "./validateImageFile";
import { isHeicFile } from "./isHeicFile";
import { convertHeicToJpeg } from "./convertHeicToJpeg";
import { useImageCompressor } from "./useImageCompressor";

const TOOL = "image-compressor";

const REASON_MESSAGES: Record<string, string> = {
  "unsupported-type": "That file type isn't supported. Use JPEG, PNG, or WebP.",
  "too-large": "That file is too large. Max size is 25 MB.",
};

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { state, compress, reset } = useImageCompressor();

  useEffect(() => {
    trackEvent({ tool: TOOL, event: "tool_viewed" });
  }, []);

  useEffect(() => {
    if (state.status === "done") {
      trackEvent({
        tool: TOOL,
        event: "compression_completed",
        metadata: {
          inputSize: file?.size,
          outputSize: state.blob.size,
        },
      });
    }
  }, [state, file]);

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
    setFile(workingFile);
    reset();
    trackEvent({ tool: TOOL, event: "compression_started", metadata: { quality } });
    compress(workingFile, quality);
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

      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}

      {file && (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="flex w-full flex-col items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Quality: {Math.round(quality * 100)}%
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              className="w-full accent-indigo-600"
              onChange={(event) => {
                const next = Number(event.target.value);
                setQuality(next);
                trackEvent({
                  tool: TOOL,
                  event: "compression_started",
                  metadata: { quality: next },
                });
                compress(file, next);
              }}
            />
          </label>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Original: {formatBytes(file.size)}
            {state.status === "done" && (
              <> &rarr; Compressed: {formatBytes(state.blob.size)}</>
            )}
          </p>

          {state.status === "compressing" && (
            <p className="text-sm text-zinc-500">Compressing&hellip;</p>
          )}

          {state.status === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          {state.status === "done" && downloadUrl && (
            <a
              href={downloadUrl}
              download={`compressed-${file.name.replace(/\.[^.]+$/, "")}.jpg`}
              onClick={() => trackEvent({ tool: TOOL, event: "download_clicked" })}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Download
            </a>
          )}
        </div>
      )}
    </div>
  );
}
