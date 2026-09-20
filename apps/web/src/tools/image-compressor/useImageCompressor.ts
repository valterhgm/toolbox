"use client";

import { useCallback, useRef, useState } from "react";
import type { CompressRequest, CompressResponse } from "./compressor.worker";

type CompressorState =
  | { status: "idle" }
  | { status: "compressing" }
  | { status: "done"; blob: Blob }
  | { status: "error"; message: string };

export function useImageCompressor() {
  const [state, setState] = useState<CompressorState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const compress = useCallback((file: File, quality: number) => {
    setState({ status: "compressing" });

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./compressor.worker.ts", import.meta.url),
      );
    }
    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<CompressResponse>) => {
      const response = event.data;
      if (response.ok) {
        setState({ status: "done", blob: response.blob });
      } else {
        setState({ status: "error", message: response.error });
      }
    };

    const request: CompressRequest = { file, quality };
    worker.postMessage(request);
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, compress, reset };
}
