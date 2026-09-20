export type CompressRequest = {
  file: File;
  quality: number;
};

export type CompressResponse =
  | { ok: true; blob: Blob }
  | { ok: false; error: string };

self.onmessage = async (event: MessageEvent<CompressRequest>) => {
  const { file, quality } = event.data;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a 2D canvas context");

    ctx.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });

    const response: CompressResponse = { ok: true, blob };
    self.postMessage(response);
  } catch (err) {
    const response: CompressResponse = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
    self.postMessage(response);
  }
};
