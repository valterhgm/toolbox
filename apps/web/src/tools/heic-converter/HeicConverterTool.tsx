import { JpegConverterTool } from "@/lib/images/JpegConverterTool";

export function HeicConverterTool() {
  return (
    <JpegConverterTool
      tool="heic-converter"
      accept="image/heic,image/heif"
      hint="HEIC or HEIF (iPhone photos)"
    />
  );
}
