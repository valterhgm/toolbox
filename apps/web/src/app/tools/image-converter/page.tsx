import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/lib/tools/registry";
import { ImageConverter } from "@/tools/image-converter/ImageConverter";

const tool = getTool("image-converter")!;

export const metadata = {
  title: tool.name,
  description: tool.description,
};

export default function ImageConverterPage() {
  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <ImageConverter />
    </ToolLayout>
  );
}
