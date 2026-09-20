# ADR 0001: Overall architecture and stack

## Status
Accepted: 2026-09-18

## Context
We're building a small ecosystem of free, privacy-respecting browser tools
(starting with image compression), monetized via ads and later a premium
tier. The developer knows Rails and basic React, and wants to learn Scala
through real, test-driven work rather than tutorials.

## Decision
- **Frontend:** Next.js + TypeScript (App Router). SSR/SEO matter for this
  product from day one, since organic search is the acquisition channel.
- **Backend:** Scala 3 + http4s + Cats Effect + Circe. Layered
  `Routes → Service → Repository`. No SQL initially; Doobie stays an option
  if a relational need appears later.
- **Database:** MongoDB, via the official Scala driver. Added only when a
  real persistence need exists (Phase 2 analytics), not before.
- **Core privacy rule:** user files (photos, PDFs, etc.) are processed
  client-side (Canvas API / Web Workers, later possibly WASM) and never
  uploaded. The backend never stores file bytes.
- **Monorepo:** `apps/web`, `apps/api`, `packages/*`, `docs/*`,
  `infrastructure/*`, single `docker-compose.yml` for local MongoDB.

## Consequences
- Backend V1 is small (just health + later events). That's intentional,
  not a sign it's unnecessary.
- Because processing is client-side, server costs and scaling concerns stay
  low even at high traffic. This is a deliberate cost/privacy trade-off,
  not a shortcut.
- Scala code is written test-first throughout, partly for quality, partly
  because it's the chosen learning method for this project.
