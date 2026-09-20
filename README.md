# Toolbox

Free, private, browser-first tools, starting with an image compressor.
Photos are processed on your device and never uploaded.

Planning docs, architecture decisions, and running Scala/React notes are
kept locally under `docs/` (not tracked in this repo).

## Stack

- **Web:** Next.js + TypeScript (`apps/web`)
- **API:** Scala 3 + http4s + Cats Effect + MongoDB via `mongo4cats` (`apps/api`)
- **Database:** MongoDB (`docker-compose.yml`), analytics events only, never file bytes

## Running locally

### 0. MongoDB (start this first)

```bash
docker compose up -d
```

Available at `mongodb://localhost:27017`. The API's `sbt test` and `sbt run`
both expect this to be running (the events feature talks to a real Mongo,
including in tests).

### API (Scala)

```bash
cd apps/api
sbt run
```

Serves on `http://localhost:8080`.

Run tests:

```bash
cd apps/api
sbt test
```

> **First terminal on this machine after setup?** If `java`/`sbt` aren't
> found, run `source "$HOME/.sdkman/bin/sdkman-init.sh"` first. New
> terminal sessions pick this up automatically via `.zshrc`.

### Web (Next.js)

```bash
cd apps/web
pnpm install
pnpm dev
```

Serves on `http://localhost:3000`.

Run tests:

```bash
cd apps/web
pnpm test        # Vitest unit tests
pnpm test:e2e    # Playwright, across Chromium and mobile Safari emulation
```
