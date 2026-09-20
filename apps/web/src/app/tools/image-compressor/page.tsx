import { ImageCompressor } from "@/tools/image-compressor/ImageCompressor";

export default function ImageCompressorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          Compress Image
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Your image is processed entirely in your browser. It is never
          uploaded to our servers.
        </p>
      </div>
      <ImageCompressor />
    </main>
  );
}
