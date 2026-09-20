# ADR 0005: Client-side perceptual hashing for duplicate photo detection

## Status
Accepted — 2026-09-20

## Context
The original plan's fuller tool wishlist included "Find Duplicate Photos,"
explicitly flagged as "the more interesting technology/product challenge"
compared to the other four (compress/resize/convert/HEIC), since it needs
to compare *multiple* photos for visual similarity — not just process one
file — while still honoring the "never uploaded" privacy promise
([ADR 0002](./0002-client-side-image-processing.md)).

## Decision
Implemented **difference hashing (dHash)**, a well-known, simple perceptual
image hash, entirely client-side:

1. Shrink each photo to a 9×8 grayscale grid (via `createImageBitmap`'s
   built-in resize, in a Web Worker).
2. Compare each pixel to its right neighbor → one bit per comparison → a
   64-bit hash per photo (`computeDHash`).
3. Compare hashes pairwise via **Hamming distance** (`hammingDistance`) —
   number of differing bits. Small distance = visually similar, even
   across different file formats or compression levels, unlike a
   cryptographic hash (which would differ completely for a single
   different byte).
4. Group photos within a similarity threshold (6 bits, chosen empirically)
   using **union-find**, so matches are transitive (`groupNearDuplicates`):
   if A matches B and B matches C, all three land in one group even if A
   and C aren't within the threshold of each other directly.

All three pieces are pure functions, TDD'd with hand-constructed bit
patterns (no real image decoding needed for the algorithm tests) — the only
untested integration boundary is `hashImage.worker.ts`'s actual Canvas
decode step, verified instead via Playwright with real photos: the same
source photo saved as both JPEG and HEIC correctly groups as one duplicate
pair, while an unrelated photo is correctly excluded.

## Consequences
- **This is a detection tool, not a deletion tool.** Browsers can't delete
  arbitrary files from a user's device; V1 shows groups of similar photos
  for the user to act on manually. Matches the original plan's own framing
  of this as a "technology/product challenge" to solve incrementally.
- **dHash is color-blind** (it operates on grayscale luminance only). Two
  photos with the same composition but very different color grading could
  register as similar. Acceptable for V1 (catches the common cases: exact
  duplicates, re-saves, format conversions, minor edits); worth remembering
  if false positives show up in real usage.
- A file that fails to hash (corrupt, unreadable) is silently excluded from
  results rather than failing the whole batch — one bad photo in a folder
  of hundreds shouldn't block results for the rest.
- The similarity threshold (6 out of 64 bits) is a constant, not
  user-configurable in V1. Revisit if real usage shows it's too strict or
  too loose.
