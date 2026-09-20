import Link from "next/link";
import { TOOLS } from "@/lib/tools/registry";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Free tools that just work.
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          No account. No watermark. No bullshit. Everything runs on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <tool.icon size={20} strokeWidth={1.75} />
            </div>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              {tool.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
