import {
  Copy,
  ImageDown,
  Maximize2,
  RefreshCw,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "image-compressor",
    name: "Compress Image",
    description: "Shrink JPG, PNG, WebP, and HEIC photos without losing quality.",
    icon: ImageDown,
  },
  {
    slug: "image-resizer",
    name: "Resize Image",
    description: "Change an image's dimensions while keeping it sharp.",
    icon: Maximize2,
  },
  {
    slug: "image-converter",
    name: "Convert to JPG",
    description: "Turn PNG, WebP, or HEIC photos into a JPG anyone can open.",
    icon: RefreshCw,
  },
  {
    slug: "heic-converter",
    name: "HEIC to JPG",
    description: "Convert iPhone photos to JPG, right in your browser.",
    icon: Smartphone,
  },
  {
    slug: "duplicate-finder",
    name: "Find Duplicate Photos",
    description: "Spot identical and near-identical photos to free up space.",
    icon: Copy,
  },
];

export function getTool(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
