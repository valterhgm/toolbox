export async function convertHeicToJpeg(file: File): Promise<File> {
  const createLibheifModule = (
    await import("libheif-js/libheif-wasm/libheif-bundle.mjs")
  ).default;
  const libheif = await createLibheifModule();

  const decoder = new libheif.HeifDecoder();
  const buffer = await file.arrayBuffer();
  const images = decoder.decode(new Uint8Array(buffer));
  const image = images[0];
  if (!image) throw new Error("No image found in this HEIC file");

  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D canvas context");

  const imageData = ctx.createImageData(width, height);
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (result) => {
      if (!result) {
        reject(new Error("HEIF decoding failed for this image"));
        return;
      }
      resolve();
    });
  });
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not encode the converted image");

  const newName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
