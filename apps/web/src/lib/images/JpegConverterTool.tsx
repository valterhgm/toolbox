"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { formatBytes } from "@/lib/images/formatBytes";
import { validateImageFile } from "@/lib/images/validateImageFile";
import { isHeicFile } from "@/lib/images/isHeicFile";
import { convertHeicToJpeg } from "@/lib/images/convertHeicToJpeg";
import { useImageToJpeg } from "@/lib/images/useImageToJpeg";

// High, fixed quality: the point of this tool is compatibility, not
// shrinking the file (that's what the Compressor is for).
const OUTPUT_QUALITY = 0.92;

const REASON_MESSAGES: Record<string, string> = {
  "unsupported-type": "That file type isn't supported.",
  "too-large": "That file is too large. Max size is 25 MB.",
};

type JpegConverterToolProps = {
  /** Analytics tool identifier - each route using this shares the same
   * mechanics but is tracked as its own tool (different SEO landing pages
   * target different search intent, per the plan). */
  tool: string;
  accept: string;
  hint: string;
};

export function JpegConverterTool({ tool, accept, hint }: JpegConverterToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { state, convert, reset } = useImageToJpeg();

  useEffect(() => {
    trackEvent({ tool, event: "tool_viewed" });
  }, [tool]);

  useEffect(() => {
    if (state.status === "done" && file) {
      trackEvent({
        tool,
        event: "compression_completed",
        metadata: { inputSize: file.size, outputSize: state.blob.size },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleFilesSelected = async ([selected]: File[]) => {
    setValidationError(null);
    trackEvent({
      tool,
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
    trackEvent({ tool, event: "compression_started" });
    convert(workingFile, OUTPUT_QUALITY);
  };

  const downloadUrl = useMemo(() => {
    if (state.status !== "done") return null;
    return URL.createObjectURL(state.blob);
  }, [state]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <FileDropzone accept={accept} hint={hint} onFilesSelected={handleFilesSelected} />

      {isConverting && (
        <p className="text-sm text-zinc-500">Converting HEIC photo&hellip;</p>
      )}

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {file && (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {file.name} ({formatBytes(file.size)})
          </p>

          {state.status === "compressing" && (
            <p className="text-sm text-zinc-500">Converting&hellip;</p>
          )}

          {state.status === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          {state.status === "done" && downloadUrl && (
            <a
              href={downloadUrl}
              download={`${file.name.replace(/\.[^.]+$/, "")}.jpg`}
              onClick={() => trackEvent({ tool, event: "download_clicked" })}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Download JPG ({formatBytes(state.blob.size)})
            </a>
          )}
        </div>
      )}
    </div>
  );
}
