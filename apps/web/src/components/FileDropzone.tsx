"use client";

import { useCallback, useState, type DragEvent, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";

type FileDropzoneProps = {
  accept: string;
  hint: string;
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  label?: ReactNode;
};

export function FileDropzone({
  accept,
  hint,
  onFilesSelected,
  multiple = false,
  label = "Tap to choose a photo, or drop one here",
}: FileDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFilesSelected(multiple ? files : [files[0]]);
    },
    [onFilesSelected, multiple],
  );

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`flex h-52 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white transition-colors dark:bg-zinc-900 ${
        isDraggingOver
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
          : "border-zinc-200 active:bg-zinc-50 dark:border-zinc-700 dark:active:bg-zinc-800"
      }`}
    >
      <UploadCloud
        size={32}
        strokeWidth={1.5}
        className="text-zinc-400 dark:text-zinc-500"
      />
      <p className="px-4 text-center text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-600">{hint}</p>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFilesSelected(files);
        }}
      />
    </label>
  );
}
