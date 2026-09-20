"use client";

import { useCallback, useState, type DragEvent } from "react";

type FileDropzoneProps = {
  accept: string;
  onFileSelected: (file: File) => void;
};

export function FileDropzone({ accept, onFileSelected }: FileDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const file = event.dataTransfer.files[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`flex h-52 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
        isDraggingOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-zinc-300 active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-900"
      }`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-zinc-400 dark:text-zinc-500"
        aria-hidden
      >
        <path
          d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="px-4 text-center text-zinc-600 dark:text-zinc-400">
        Tap to choose a photo, or drop one here
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        JPEG, PNG, WebP, or HEIC
      </p>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
    </label>
  );
}
