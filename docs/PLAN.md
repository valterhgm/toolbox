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

## Phase 1.5 — Complete the original V1 tool set (course correction)

**What happened:** the original plan's "🚀 What I would build if we did
this together" section named five V1 tools — Compress Image, HEIC → JPG,
Resize Image, Image → PDF, Find Duplicate Photos — and separately said
"Don't build 20 tools, build three" (Compressor, Resize, Convert to JPG).
Phase 1 above only built the first. This section closes that gap,
built after Phase 2 (analytics) rather than before, once the gap was
flagged. Image → PDF was swapped for a dedicated **HEIC → JPG** page
instead (matching the five-tool list's own naming, and a real distinct SEO
landing page per the plan's own SEO strategy - "compress-image-for-X" style
pages target specific search intent).

**Design pass first** (per explicit request for "a very simple and pretty
UI," grounded in the current dominant clean-tool aesthetic across the
React/Tailwind ecosystem - neutral palette, single accent color, card
grids, generous whitespace):
- [x] Shared `Header`, `ToolLayout`, and `src/lib/tools/registry.ts` (single
      source of truth for tool metadata, driving both the homepage grid and
      each tool page)
- [x] Homepage rebuilt as a real tool directory (was the Phase 0 health-check demo)
- [x] `FileDropzone` generalized to multi-file selection (`onFilesSelected`)

**The remaining four tools**, each with the same rigor as the compressor
(TDD for pure logic, Playwright E2E, analytics wiring):
- [x] **Resize Image** — TDD'd `calculateResizedDimensions` (aspect-ratio
      math) first. Its own E2E test caught a real bug: a corrupt file
      crashed silently instead of showing an error (a bare
      `createImageBitmap` call with no try/catch) - fixed.
- [x] **Convert to JPG** and **HEIC → JPG** — mechanically identical
      ("any image → JPEG at a fixed quality"), so they share one
      `JpegConverterTool` component parameterized by tool name/accept/hint
      rather than duplicating logic three times. (Also prompted extracting
      the compressor's worker/hook to `lib/images/` as shared infra, since
      it's now used by three tools, not one.)
- [x] **Find Duplicate Photos** — the "harder" one, exactly as the plan
      flagged it. Client-side perceptual hashing (dHash) + Hamming distance
      + union-find grouping, entirely pure and TDD'd with hand-built bit
      patterns (no image decoding needed to test the algorithm itself). See
      [ADR 0005](./adr/0005-duplicate-detection.md). E2E-verified with real
      photos: the same photo saved as JPEG and HEIC correctly grouped as
      duplicates, an unrelated photo correctly excluded.
- [x] tsconfig `target` bumped `ES2017` → `ES2020` (a real, necessary fix -
      BigInt literals, needed for the 64-bit perceptual hash, aren't valid
      syntax below ES2020)
- [x] **Revised the same day**, per explicit follow-up feedback: redesigned
      as an adaptive "scan for duplicates" flow (real folder scan via the
      File System Access API where supported, native multi-select picker
      elsewhere — notably iPhone Safari, which has no folder-access API at
      all) with an upfront savings estimate and a "Keep"/"Extra copy" label
      per photo. See ADR 0005's revision note for the real browser
      constraints this was designed around. 30/30 Playwright tests passing.

**Milestone: ACHIEVED.** All five tools from the original plan exist,
styled consistently, each independently E2E-tested: 28/28 Playwright tests
passing across Chromium and WebKit.

---

## Phase 2 — Make the Scala API earn its place: analytics

**Goal:** anonymous, privacy-respecting usage analytics stored in MongoDB,
built with TDD, so we know if anyone actually uses the tool.

- [x] [`docs/adr/0004-analytics-events.md`](./adr/0004-analytics-events.md)
      (numbered 0004, not 0003 — HEIC support claimed that number first)
- [x] **TDD** the layered Scala backend, bottom-up, each layer with its own tests:
  - [x] `EventRepository` (Mongo access) — tested against a real local Mongo.
        Tried testcontainers first; its Docker client couldn't negotiate
        with this machine's Docker Desktop version, so fell back to the
        plan's other explicitly-allowed option: the docker-compose Mongo.
  - [x] `EventService` (validation) — tested with an in-memory `Ref`-backed fake repository
  - [x] `EventRoutes` (http4s HTTP layer) — tested with a stub `EventService`
- [x] `POST /api/v1/events` accepting `{tool, event, metadata}` — never accepts file bytes
- [x] Rate limiting on the events endpoint — http4s `Throttle` middleware,
      30 requests/minute; confirmed live with a burst test (30× 201, then 429s)
- [x] Next.js fires events: `tool_viewed`, `file_selected`, `compression_started`, `compression_completed`, `download_clicked`
- [x] `GET /api/v1/admin/stats` — JSON counts grouped by tool + event.
      **No authentication yet — flagged in the ADR as a must-fix before any
      public deployment.**

**Milestone: ACHIEVED.** Verified live end-to-end against a real running
Mongo: posted real events via curl, confirmed validation errors return 400,
confirmed `/admin/stats` correctly aggregates counts, confirmed rate
limiting actually kicks in under a burst. 13/13 Scala tests passing
(unit + service + routes + real-Mongo integration).

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

- [x] ~~Extract a reusable "tool" pattern~~ — done in Phase 1.5
      (`src/lib/tools/registry.ts` + shared `ToolLayout`); a new tool is
      now mostly a registry entry + one processing function, not a new app
- [x] ~~Candidates: HEIC→JPG, resize~~ — built in Phase 1.5, since they were
      part of the original plan's explicit V1 scope, not truly
      data-driven "growth" picks
- [ ] Remaining growth candidates, now genuinely chosen from `/admin/stats`
      data rather than the original plan's starting wishlist: image→PDF,
      PDF compressor, or whatever `/admin/stats` shows people actually want
      once there's real traffic
- [ ] Landing-page-per-use-case pattern for SEO (e.g. "compress image for WhatsApp")
- [ ] Revisit premium tier only once free usage numbers justify it

---

## Working agreements (from the original discussion, worth keeping)

- Every non-trivial architecture decision gets a short ADR in `docs/adr/`, written *before* the code.
- Feature branches (`feature/xxx`) + PRs, even solo — review your own diff before merging.
- MVP stays brutally small. Resist adding tools beyond the original plan's
  explicit V1 scope before there's real usage data. (Phase 1.5 built the
  rest of that *original* V1 list, at explicit request, correcting a
  scope gap — not a violation of this principle. The principle still holds
  for anything *beyond* that five-tool list: Phase 5's remaining growth
  candidates wait for real `/admin/stats` data.)
- **Never** let a user's photo bytes reach MongoDB or any server we control.
- Scala backend layering is always `Routes → Service → Repository → Mongo`. No skipping layers.
- All Scala code is written test-first (red → green → refactor). This is also how you'll learn the language.
