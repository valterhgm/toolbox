# Toolbox

Free, private, browser-first tools — starting with an image compressor.
Photos are processed on your device and never uploaded.

See [`docs/PLAN.md`](docs/PLAN.md) for the full build plan and current phase,
and [`docs/adr/`](docs/adr) for architecture decisions.

## Stack

- **Web:** Next.js + TypeScript (`apps/web`)
- **API:** Scala 3 + http4s + Cats Effect (`apps/api`)
- **Database:** MongoDB (`docker-compose.yml`), added only where persistence is needed

## Running locally

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

### Web (Next.js)

```bash
cd apps/web
pnpm install
pnpm dev
```

Serves on `http://localhost:3000`.

### MongoDB

```bash
docker compose up -d
```

Available at `mongodb://localhost:27017`.
