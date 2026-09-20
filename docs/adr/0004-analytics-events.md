# ADR 0004: Anonymous usage analytics, stored in MongoDB

## Status
Accepted — 2026-09-20

## Context
Per the original plan, we need to know what people actually do with each
tool (viewed it? started? finished? downloaded?) to guide what gets built
next — without ever compromising the "your photo never leaves your device"
privacy promise ([ADR 0002](./0002-client-side-image-processing.md)).

## Decision
A layered Scala backend (`Routes → Service → Repository → MongoDB`), built
test-first at every layer:

- **`EventRepository[F]`** — a trait, so it can be swapped for a
  `Ref`-based in-memory fake in service-layer tests. Real implementation
  (`MongoEventRepository`) uses `mongo4cats` (a Cats Effect-native MongoDB
  client) rather than the raw MongoDB Scala driver's `Observable`-based API,
  for idiomatic `IO`-returning methods with no manual `Observable → IO`
  conversion boilerplate.
- **`EventService[F]`** — validates requests (non-empty `tool`/`event`,
  max 64 chars each) and generates the `_id`/`timestamp` server-side; the
  client-supplied request (`EventRequest`) deliberately has no `_id` or
  `timestamp` field at all, so there's nothing to trust or not trust there.
- **`EventRoutes`** — `POST /api/v1/events` (rate-limited to 30/min via
  http4s's `Throttle` middleware) and `GET /api/v1/admin/stats` (a simple
  JSON view of counts grouped by tool + event, computed in-memory from
  `repository.all` rather than a Mongo aggregation pipeline — deliberately
  simple for a "tiny internal view" per the plan; revisit only if event
  volume ever makes that naive approach a real problem).
- **Frontend**: `trackEvent()` fire-and-forget helper, called from
  `ImageCompressor.tsx` at `tool_viewed`, `file_selected`,
  `compression_started`, `compression_completed`, and `download_clicked`.
  Analytics failures are always swallowed — this must never break the tool
  itself.

**Testing strategy** (each layer isolated from the one below):
- `EventStats.summarize` — pure function, plain `munit.FunSuite`.
- `DefaultEventService` — tested against an in-memory `Ref`-backed fake
  repository, no real Mongo needed.
- `EventRoutes` — tested against a stub `EventService`, no real validation
  or storage logic involved.
- `MongoEventRepository` — integration test against a **real MongoDB**.
  We tried `testcontainers-scala` first (an ephemeral, disposable
  container per test run), but its bundled Docker client (testcontainers-java
  1.20.2) couldn't negotiate with this machine's Docker Desktop version —
  a genuine third-party tooling incompatibility, not our code. Fell back to
  the plan's other explicitly-allowed option: testing against the same
  docker-compose Mongo used for local dev. Because that database is shared
  and persistent (not disposable), the test avoids asserting on the whole
  collection's contents and instead inserts a uniquely-tagged event and
  checks it round-trips correctly.

## Consequences
- **`GET /api/v1/admin/stats` has no authentication.** Acceptable for local
  development; this is a known gap that must be closed (even something
  simple like an API key or IP allowlist) before this is ever deployed
  publicly. Tracked here so it doesn't get forgotten — do not ship without
  addressing this.
- Rate limiting is global (one shared token bucket, 30 requests/minute), not
  per-client/IP. Simple and sufficient for V1; a determined abuser sharing
  the bucket with real users is a real limitation, revisit if it becomes a
  problem in practice.
- MongoDB now stores real operational data for the first time — analytics
  events only, still never file bytes, matching the "never trust client-side
  analytics" and "never let a photo reach MongoDB" rules from the original
  plan.
