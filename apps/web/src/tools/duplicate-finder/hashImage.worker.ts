import { computeDHash, HASH_WIDTH, HASH_HEIGHT } from "./computeDHash";

export type HashRequest = { id: string; file: File };

export type HashResponse =
  | { ok: true; id: string; hash: string }
  | { ok: false; id: string; error: string };

self.onmessage = async (event: MessageEvent<HashRequest>) => {
  const { id, file } = event.data;

  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: HASH_WIDTH,
      resizeHeight: HASH_HEIGHT,
      resizeQuality: "medium",
    });
    const canvas = new OffscreenCanvas(HASH_WIDTH, HASH_HEIGHT);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a 2D canvas context");

    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, HASH_WIDTH, HASH_HEIGHT);

    const grayscale: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      // Standard luma weighting - human eyes are most sensitive to green.
      grayscale.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    const hash = computeDHash(grayscale, HASH_WIDTH, HASH_HEIGHT);
    const response: HashResponse = { ok: true, id, hash: hash.toString() };
    self.postMessage(response);
  } catch (err) {
    const response: HashResponse = {
      ok: false,
      id,
      error: err instanceof Error ? err.message : "Unknown error",
    };
    self.postMessage(response);
  }
};
