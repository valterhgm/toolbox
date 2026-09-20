import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/lib/tools/registry";
import { HeicConverterTool } from "@/tools/heic-converter/HeicConverterTool";

const tool = getTool("heic-converter")!;

export const metadata = {
  title: tool.name,
  description: tool.description,
};

export default function HeicConverterPage() {
  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <HeicConverterTool />
    </ToolLayout>
  );
}
