"use client";

import { useCallback, useRef, useState } from "react";
import type { ToJpegRequest, ToJpegResponse } from "./toJpeg.worker";

type ToJpegState =
  | { status: "idle" }
  | { status: "compressing" }
  | { status: "done"; blob: Blob }
  | { status: "error"; message: string };

/**
 * Shared by any tool that needs "turn this image into a JPEG at quality X" -
 * the Image Compressor (user-controlled quality), the JPG Converter (fixed
 * high quality), and the HEIC-to-JPG landing page tool are all the same
 * underlying operation.
 */
export function useImageToJpeg() {
  const [state, setState] = useState<ToJpegState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const convert = useCallback((file: File, quality: number) => {
    setState({ status: "compressing" });

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./toJpeg.worker.ts", import.meta.url),
      );
    }
    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<ToJpegResponse>) => {
      const response = event.data;
      if (response.ok) {
        setState({ status: "done", blob: response.blob });
      } else {
        setState({ status: "error", message: response.error });
      }
    };

    const request: ToJpegRequest = { file, quality };
    worker.postMessage(request);
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, convert, reset };
}
