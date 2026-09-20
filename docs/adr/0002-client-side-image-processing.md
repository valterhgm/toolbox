# ADR 0002: Image processing happens entirely in the browser

## Status
Accepted — 2026-09-19

## Context
The first real product is an image compressor. We need to decide where the
actual compression work happens: uploaded to the Scala API and processed
there, or done locally in the user's browser.

## Decision
All image processing (compression, and later resize/convert) happens
client-side, using the browser's Canvas API, moved into a Web Worker so the
UI thread doesn't freeze. The image's bytes never leave the device.

## Consequences
- **Privacy is a real, provable claim**, not just a policy statement — we can
  say "your photo is never uploaded" because the network tab proves it.
- **No server storage or bandwidth cost** for the core feature, regardless of
  traffic volume — this is what makes an ads-only V1 economically sane.
- The Scala backend's job for this feature is limited to serving the page and
  (later, Phase 2) receiving anonymous *metadata* about the event
  (`{tool: "image-compressor", event: "completed", inputSize, outputSize}`),
  never file bytes.
- Trade-off: we're bounded by what browsers can do client-side (Canvas
  `toBlob` quality control, no access to more advanced codecs without extra
  libraries). Acceptable for V1; revisit only if data shows it's a real
  limitation.
