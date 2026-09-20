# ADR 0003: HEIC input support via client-side WASM decoding

## Status
Accepted — 2026-09-20

## Context
iPhones save photos as HEIC by default. Chrome and Firefox ship no HEIC
decoder at all (HEIC uses the patented HEVC codec; only Safari's OS-level
decoder supports it natively), so a HEIC file dropped on the compressor
silently fails in most browsers. HEIC is arguably the single most important
input format for this product's actual users, so this isn't a "later" nice-to-have.

## Decision
Decode HEIC entirely client-side using `libheif-js` (an actively-maintained
Emscripten/WASM build of `libheif` itself), lazy-loaded via dynamic `import()`
only when a HEIC file is actually dropped, converting it to a JPEG `File`
before it enters the existing validate → compress pipeline unchanged.

**Revised 2026-09-20:** originally implemented with `heic2any`, a thin
wrapper around a years-old bundled `libheif` build. Real-world testing (a
photo from a current iPhone) immediately failed with
`ERR_LIBHEIF: format not supported` — the old decoder simply doesn't
understand newer HEIC encoding variants. Switched to importing `libheif-js`
directly (`libheif-js@1.23.2`, released 2026-09-05, actively maintained) for
an up-to-date decoder, writing our own thin wrapper (`convertHeicToJpeg.ts`)
using its `HeifDecoder` API instead of depending on `heic2any`'s abandoned
wrapper layer.

**License note:** `libheif-js` (and `libheif` itself) is LGPL-3.0. Used here
as a dynamically-imported, separately-replaceable module (satisfying LGPL's
relinking requirement), but we still owe it proper attribution/license
inclusion before shipping publicly — tracked as a to-do alongside the
privacy/terms pages in Phase 2/3, not solved yet.

Rejected alternative: decode server-side in Scala. Simpler to implement, but
requires uploading the original photo to our server, directly violating
[ADR 0002](./0002-client-side-image-processing.md)'s "photos never leave the
device" guarantee — which is this product's main differentiator against
every other "free" compressor site. Not worth trading away for implementation
convenience.

## Consequences
- HEIC becomes a pre-processing adapter step (`isHeicFile` + `convertHeicToJpeg`),
  not a change to the core compression pipeline — `validateImageFile` and the
  compressor worker are unaware HEIC ever existed; they only ever see JPEG/PNG/WebP.
- Extra bundle weight (~1.9MB, WASM inlined as base64 inside the JS module —
  see below) is paid only by users who actually drop a HEIC file, via dynamic
  import, not by everyone.
- `convertHeicToJpeg` is an integration boundary (real WASM decode), not unit
  tested, the same way the Canvas-based compressor worker isn't — verified
  manually in a real browser instead. `isHeicFile` (the detection logic) is
  unit tested.
- `libheif-js`'s browser bundle (`libheif-wasm/libheif-bundle.mjs`) inlines
  the compiled `.wasm` binary as a base64 string directly in the JS, rather
  than fetching it separately at a relative path. This sidesteps a known
  class of bundler bugs (Next.js/Turbopack workers failing to resolve
  relative WASM paths inside blob-URL worker contexts) — worth remembering
  for any future WASM dependency: prefer a "bundle"/inlined build variant
  over one that does its own runtime `fetch()` of a `.wasm` file.
