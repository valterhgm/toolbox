# Toolbox — Build Plan

Free, private, browser-first tools (starting with image compression), monetized
later via ads → premium. Stack: **Next.js/TypeScript** (frontend) + **Scala 3 /
http4s / Cats Effect** (API) + **MongoDB** (persistence, added only when needed).

This document is the checklist. Check items off as we go. Each phase ends with
a concrete "you can now do X" milestone — if you can't do X, the phase isn't done.

Related: [`docs/adr/`](./adr) for architecture decisions, [`docs/SCALA_NOTES.md`](./SCALA_NOTES.md)
for the running Scala-for-Rails-developers glossary we build as we go.

---

## Phase 0 — Foundation

**Goal:** dev environment + monorepo skeleton + one working end-to-end request
(`GET /api/v1/health`) between Next.js and Scala. No product code yet.

- [x] Install Homebrew (already present)
- [x] Install Java (JDK) — via **SDKMAN**, not Homebrew (see note below), Temurin 21 LTS
- [x] Install sbt via Homebrew — `brew install sbt` (sbt pulls the actual Scala/sbt engine version per-project, see `project/build.properties`)
- [x] Install pnpm — via `npm install -g pnpm`, not Homebrew (see note below)
- [x] Docker Desktop present — confirm the daemon is running (`docker ps`)
- [x] `git init` in `~/projects/toolbox`
- [x] Create monorepo skeleton:
  ```
  toolbox/
  ├── apps/
  │   ├── web/        # Next.js + TypeScript
  │   └── api/         # Scala 3 + http4s
  ├── packages/        # shared TS types, eslint config (later)
  ├── docs/
  │   ├── PLAN.md
  │   ├── SCALA_NOTES.md
  │   └── adr/
  ├── infrastructure/
  ├── docker-compose.yml
  ├── .gitignore
  └── README.md
  ```
- [x] Scaffold `apps/api` as an sbt project (Scala 3, http4s, cats-effect, circe, munit for tests)
- [x] **TDD**: write a failing test for `GET /health` returning `{"status":"ok"}`, then make it pass
- [x] Scaffold `apps/web` with `create-next-app` (TypeScript, App Router, Tailwind, ESLint)
- [x] Add a `docker-compose.yml` with a MongoDB service (not used yet, just available)
- [x] Wire Next.js to call the Scala health endpoint and render the result
- [x] Write `README.md` explaining how to run everything locally
- [ ] First commit (ready — waiting on you to say go)

**Milestone: ACHIEVED.** Two terminals — `sbt run` in `apps/api`, `pnpm dev` in
`apps/web` — give you Next.js on `:3000` calling Scala on `:8080`; the homepage
renders "Scala API status: ok" fetched live, server-side, from the Scala API.

> **Environment notes for next time (this machine is Intel x86_64 macOS):**
> Homebrew has dropped precompiled-binary ("bottle") support for Intel Macs, so
> `brew install openjdk` tries to compile it from source — which cascades into
> compiling LLVM from source (hours, not minutes). We killed that and used
> **SDKMAN** (`sdk install java 21.0.5-tem`) instead, which downloads a
> prebuilt Temurin archive with no compilation. Similarly, `brew install pnpm`
> would hit the same issue, so we used `npm install -g pnpm` instead (pnpm is
> pure JS, no compilation needed at all). `sbt` via Homebrew worked fine
> because the `sbt` command itself is just a tiny launcher script — the actual
> sbt engine version is downloaded separately per-project based on
> `project/build.properties`.
>
> Because SDKMAN was installed mid-session, `java`/`sbt` need
> `source "$HOME/.sdkman/bin/sdkman-init.sh"` before use in a *fresh terminal
> that predates the SDKMAN install*. Any new terminal you open from now on
> will have this automatically (SDKMAN added itself to `.zshrc`).

---

## Phase 1 — First real product: the Image Compressor

**Goal:** a stranger can visit the site and compress an image, entirely in
their browser (privacy promise: the photo never reaches our server).

- [ ] `docs/adr/0002-client-side-image-processing.md` — record *why* processing
      happens in-browser (privacy, cost, latency) before writing the code
- [ ] Build shared UI primitives: `FileDropzone`, `FilePreview`, `ProgressBar`, `DownloadButton`
- [ ] Build the compression engine using the Canvas API (`canvas.toBlob` with
      quality parameter) — start simple, no WASM yet
- [ ] Move compression into a **Web Worker** so the UI thread never freezes
- [ ] Build the `/tools/image-compressor` page: dropzone → preview →
      before/after size → quality slider → download
- [ ] Handle errors: wrong file type, huge file, corrupt image
- [ ] Mobile-responsive pass
- [ ] Playwright E2E test: upload a fixture image, assert output is smaller, assert download works
- [ ] Vitest unit tests for the compression logic (pure functions extracted from the worker)

**Milestone:** you can drop a JPEG on the page and download a visibly smaller one,
on desktop and mobile, with no network request carrying the image bytes.

---

## Phase 2 — Make the Scala API earn its place: analytics

**Goal:** anonymous, privacy-respecting usage analytics stored in MongoDB,
built with TDD, so we know if anyone actually uses the tool.

- [ ] `docs/adr/0003-analytics-event-shape.md`
- [ ] **TDD** the layered Scala backend, bottom-up, each layer with its own tests:
  - [ ] `EventRepository` (Mongo access) — tested against a real local Mongo via testcontainers or docker-compose
  - [ ] `EventService` (validation, rate-limit hook) — tested with an in-memory fake repository
  - [ ] `EventRoutes` (http4s HTTP layer) — tested with http4s's request/response test helpers, faked service
- [ ] `POST /api/v1/events` accepting `{tool, event, metadata}` — never accepts file bytes
- [ ] Rate limiting on the events endpoint (can't let one client spam it)
- [ ] Next.js fires events: `tool_viewed`, `file_selected`, `compression_started`, `compression_completed`, `download_clicked`
- [ ] A tiny internal `/admin/stats` view (even just JSON) showing counts per event

**Milestone:** you can see, from real MongoDB data, how many people viewed vs.
completed vs. downloaded — our first real product signal.

---

## Phase 3 — Discoverability (SEO)

**Goal:** Google can find and understand the tool pages.

- [ ] Metadata (title/description/OG tags) per tool page via Next.js Metadata API
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Structured data (JSON-LD `SoftwareApplication`) on tool pages
- [ ] `/privacy`, `/terms`, `/contact` pages (real content — "we don't upload your photos")
- [ ] FAQ section per tool page (also good for AI-answer-engine visibility)
- [ ] Register with Google Search Console, submit sitemap
- [ ] Server-side/edge analytics for page views (separate from the tool-usage events)

**Milestone:** the compressor page is indexed and shows up for a low-competition
long-tail query (e.g. "compress image to 2mb online").

---

## Phase 4 — Monetization

**Goal:** first euro of revenue, without ruining the product.

- [ ] Apply to an ad provider (AdSense) once there's real content/traffic
- [ ] Tasteful, fixed ad slots (top + bottom of tool, never inside the workflow)
- [ ] Cookie/consent banner if required for the ad provider + your visitors' regions
- [ ] Revenue + RPM tracking dashboard
- [ ] A/B test ad placement using the analytics pipeline from Phase 2

**Milestone:** ads are live, and you can say "we made €X from Y visitors."

---

## Phase 5 — Growth: more tools, chosen by data

**Goal:** use Phase 2 analytics to decide the next tool, not gut feeling.

- [ ] Extract a reusable "tool" pattern in `apps/web` so a new tool is mostly
      config + one processing function, not a new app
- [ ] Candidates (pick based on what Phase 2 data shows): HEIC→JPG, resize,
      image→PDF, PDF compressor
- [ ] Landing-page-per-use-case pattern for SEO (e.g. "compress image for WhatsApp")
- [ ] Revisit premium tier only once free usage numbers justify it

---

## Working agreements (from the original discussion, worth keeping)

- Every non-trivial architecture decision gets a short ADR in `docs/adr/`, written *before* the code.
- Feature branches (`feature/xxx`) + PRs, even solo — review your own diff before merging.
- MVP stays brutally small. Resist adding a 4th tool before the 1st has real usage data.
- **Never** let a user's photo bytes reach MongoDB or any server we control.
- Scala backend layering is always `Routes → Service → Repository → Mongo`. No skipping layers.
- All Scala code is written test-first (red → green → refactor). This is also how you'll learn the language.
