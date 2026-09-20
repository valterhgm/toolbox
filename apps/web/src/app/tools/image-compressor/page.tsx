import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/lib/tools/registry";
import { ImageCompressor } from "@/tools/image-compressor/ImageCompressor";

const tool = getTool("image-compressor")!;

export const metadata = {
  title: tool.name,
  description: tool.description,
};

export default function ImageCompressorPage() {
  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <ImageCompressor />
    </ToolLayout>
  );
}
