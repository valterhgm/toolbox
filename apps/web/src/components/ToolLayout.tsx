import type { ReactNode } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";

type ToolLayoutProps = {
  icon: LucideIcon;
  name: string;
  description: string;
  children: ReactNode;
};

export function ToolLayout({ icon: Icon, name, description, children }: ToolLayoutProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Icon size={24} strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {name}
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      {children}

      <p className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
        <ShieldCheck size={14} />
        Processed entirely on your device, never uploaded.
      </p>
    </main>
  );
}
