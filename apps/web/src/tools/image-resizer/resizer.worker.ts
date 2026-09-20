export type ResizeRequest = {
  file: File;
  width: number;
  height: number;
};

export type ResizeResponse =
  | { ok: true; blob: Blob }
  | { ok: false; error: string };

self.onmessage = async (event: MessageEvent<ResizeRequest>) => {
  const { file, width, height } = event.data;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a 2D canvas context");

    ctx.drawImage(bitmap, 0, 0, width, height);
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await canvas.convertToBlob({ type: outputType, quality: 0.92 });

    const response: ResizeResponse = { ok: true, blob };
    self.postMessage(response);
  } catch (err) {
    const response: ResizeResponse = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
    self.postMessage(response);
  }
};
