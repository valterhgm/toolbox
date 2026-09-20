import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/lib/tools/registry";
import { ImageResizer } from "@/tools/image-resizer/ImageResizer";

const tool = getTool("image-resizer")!;

export const metadata = {
  title: tool.name,
  description: tool.description,
};

export default function ImageResizerPage() {
  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <ImageResizer />
    </ToolLayout>
  );
}
