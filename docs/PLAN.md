# Toolbox — Build Plan

Free, private, browser-first tools (starting with image compression), monetized
later via ads → premium. Stack: **Next.js/TypeScript** (frontend) + **Scala 3 /
http4s / Cats Effect** (API) + **MongoDB** (persistence, added only when needed).

This document is the checklist. Check items off as we go. Each phase ends with
a concrete "you can now do X" milestone — if you can't do X, the phase isn't done.

Related: [`docs/adr/`](./adr) for architecture decisions, [`docs/SCALA_NOTES.md`](./SCALA_NOTES.md)
for the running Scala-for-Rails-developers glossary, and [`docs/REACT_NOTES.md`](./REACT_NOTES.md)
for React/Next.js concepts beyond the basics — all built up as we go.

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

- [x] `docs/adr/0002-client-side-image-processing.md` — record *why* processing
      happens in-browser (privacy, cost, latency) before writing the code
- [x] Build shared UI primitive: `FileDropzone` (drag-and-drop + click-to-choose)
- [x] **TDD**: `formatBytes` (pure function, red→green)
- [x] **TDD**: `validateImageFile` (type + 25MB size limit, red→green)
- [x] Build the compression engine using the Canvas API (`OffscreenCanvas.convertToBlob`
      with a quality parameter) inside a **Web Worker** so the UI thread never freezes
- [x] Build the `/tools/image-compressor` page: dropzone → preview →
      before/after size → quality slider → download
- [x] Handle errors: wrong file type, huge file (validated before compression starts)
- [x] HEIC input support — client-side WASM decode, lazy-loaded; prompted by
      real user testing on an actual iPhone photo. First attempt used
      `heic2any` and failed on-device with `ERR_LIBHEIF: format not supported`
      (its bundled `libheif` is years out of date); switched to importing
      `libheif-js` directly (actively maintained) instead. See
      [ADR 0003](./adr/0003-heic-support.md) for the full story.
      **Confirmed working on a real iPhone HEIC photo: 4.8 MB → 2.5 MB.**
- [x] Dropzone made fully tap-friendly (whole box is the tap target, not just
      a small button) — first mobile-usability fix, prompted by real feedback
- [x] Corrupt-image error path — verified via Playwright: a bogus `.jpg`
      correctly shows an error and never offers a download
- [x] Basic mobile-responsive check — Playwright asserts no horizontal
      overflow at iPhone 14 viewport width (a full manual design pass is
      still a good idea eventually, but the automated baseline is covered)
- [x] Playwright E2E tests (`apps/web/e2e/image-compressor.spec.ts`), run
      across both Chromium and WebKit (mobile Safari emulation): JPEG
      compression with a genuine byte-level size check, HEIC conversion,
      corrupt-file error handling, and viewport overflow — **8/8 passing**
- [x] Vitest unit tests for the compression logic's pure pieces (`formatBytes`, `validateImageFile`, `isHeicFile`)
- [x] **Manual browser verification: PASSED.** Real iPhone HEIC photo,
      4.8 MB → 2.5 MB, on a real device.

**Milestone: ACHIEVED, and now backed by automated tests.** Drop a photo
(JPEG, PNG, WebP, or HEIC) on `/tools/image-compressor` and get a visibly
smaller download — confirmed on a real device with a real photo, and now
also covered by 8 passing Playwright tests across two browser engines so
this doesn't silently regress later. Phase 1 is closed.

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
