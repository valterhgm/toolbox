# React/Next.js notes — building on "the basics"

Companion to [`SCALA_NOTES.md`](./SCALA_NOTES.md), for concepts on the frontend
side that go beyond React fundamentals.

## `"use client"` — the server/client boundary

Next.js (App Router) renders components on the **server by default**. A file
with `"use client"` at the top opts that component (and its subtree) into
running in the browser too, which is required for anything using `useState`,
event handlers, or browser-only APIs (like our `Worker`). There's no Rails
equivalent — Rails views are always server-rendered, and interactivity is
bolted on separately (Stimulus/jQuery/etc). In Next, a single component tree
can mix both: `page.tsx` in `app/tools/image-compressor/` is a plain Server
Component (just renders text), but it renders `<ImageCompressor />`, which is
marked `"use client"` because it needs interactivity.

## Discriminated unions — TypeScript's answer to Scala's sealed traits

```ts
export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: "unsupported-type" | "too-large" };
```

This is structurally the same idea as a Scala `enum`/sealed trait with case
classes: a closed set of shapes, distinguished by a "tag" field (`valid`
here). TypeScript narrows the type automatically once you check the tag:

```ts
const result = validateImageFile(file);
if (!result.valid) {
  // TS knows `result.reason` exists here, only in this branch
}
```

Same shape shows up in `useImageCompressor.ts`'s `CompressorState` (`idle` /
`compressing` / `done` / `error`), tagged by a `status` field instead — this
"tagged union" pattern is the TypeScript idiom worth reaching for whenever a
value can be one of several distinct shapes, instead of one object with a lot
of optional/nullable fields.

## Web Workers — client-side background jobs

A Web Worker is a separate JS thread in the browser with no access to the DOM,
communicating with the main thread only via `postMessage`/`onmessage`. It's
the closest browser equivalent to a background job (think Sidekiq), except it
runs on the user's device, not your server, and the "job" starts the moment
you construct it — no queue, no persistence. We use one so that compressing a
large image (a CPU-heavy loop over pixel data) doesn't freeze the page's UI
thread while it runs.

## Dynamic `import()` — paying for code only when you use it

```ts
const { default: heic2any } = await import("heic2any");
```

A normal `import` at the top of a file gets bundled into the page's JS
whether or not it's ever used. `await import(...)` (dynamic import) instead
creates a **separate chunk** that's only downloaded the moment this line
actually runs — in our case, only when a user drops a HEIC file. Nobody
compressing a plain JPEG pays for the ~1-2MB HEIC decoder. Rails has no direct
equivalent (asset pipeline bundles are more static); the closest idea is lazy
autoloading of a rarely-used gem, except this happens in the *browser*, per
page load, not per process boot.

## Ambient module declarations — typing a library that doesn't ship types

`libheif-js` ships a `.d.ts` for its raw low-level WASM bindings, but not for
the hand-written `HeifDecoder` convenience class we actually call. TypeScript
would otherwise treat `import ... from "libheif-js/libheif-wasm/libheif-bundle.mjs"`
as untyped. The fix is an **ambient module declaration**
(`src/types/libheif-js.d.ts`): a `.d.ts` file with no implementation, just
`declare module "exact/import/path" { ...shape... }`, describing the shape we
know the library has at runtime (from its README/source), so we get real type
checking instead of reaching for `any`. Any `.d.ts` anywhere under `src/`
is picked up automatically by `tsconfig.json`'s `**/*.ts` include pattern —
no registration step needed.

## `useRef` vs `useState`

In `useImageCompressor.ts`, the `Worker` instance is stored in a `useRef`, not
`useState`. `useState` triggers a re-render whenever it changes; `useRef` is a
mutable box that persists across renders *without* triggering one. We want
the worker to survive re-renders (so we don't recreate it every time), but we
don't want its existence to itself cause a re-render — only the compression
*result* (stored in `useState`) should do that.
