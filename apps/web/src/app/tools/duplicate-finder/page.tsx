import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/lib/tools/registry";
import { DuplicateFinder } from "@/tools/duplicate-finder/DuplicateFinder";

const tool = getTool("duplicate-finder")!;

export const metadata = {
  title: tool.name,
  description: tool.description,
};

export default function DuplicateFinderPage() {
  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <DuplicateFinder />
    </ToolLayout>
  );
}
