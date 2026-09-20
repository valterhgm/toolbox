import Link from "next/link";
import { Wrench } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[var(--background)]/90 backdrop-blur-sm dark:border-zinc-800/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <Wrench size={18} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
          Toolbox
        </Link>
      </div>
    </header>
  );
}
