import { JpegConverterTool } from "@/lib/images/JpegConverterTool";

export function ImageConverter() {
  return (
    <JpegConverterTool
      tool="image-converter"
      accept="image/png,image/webp,image/heic,image/heif,image/jpeg"
      hint="PNG, WebP, or HEIC"
    />
  );
}
