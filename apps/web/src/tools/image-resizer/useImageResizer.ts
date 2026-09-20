"use client";

import { useCallback, useRef, useState } from "react";
import type { ResizeRequest, ResizeResponse } from "./resizer.worker";

type ResizerState =
  | { status: "idle" }
  | { status: "resizing" }
  | { status: "done"; blob: Blob }
  | { status: "error"; message: string };

export function useImageResizer() {
  const [state, setState] = useState<ResizerState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const resize = useCallback((file: File, width: number, height: number) => {
    setState({ status: "resizing" });

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./resizer.worker.ts", import.meta.url),
      );
    }
    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<ResizeResponse>) => {
      const response = event.data;
      if (response.ok) {
        setState({ status: "done", blob: response.blob });
      } else {
        setState({ status: "error", message: response.error });
      }
    };

    const request: ResizeRequest = { file, width, height };
    worker.postMessage(request);
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, resize, reset };
}
