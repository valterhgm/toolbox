"use client";

import { useCallback, useRef, useState } from "react";
import { groupNearDuplicates } from "./groupNearDuplicates";
import type { HashRequest, HashResponse } from "./hashImage.worker";

// Out of 64 bits. Chosen empirically for dHash: small enough to avoid
// grouping genuinely different photos, large enough to catch the same
// photo re-saved/re-compressed/lightly cropped.
const SIMILARITY_THRESHOLD = 6;

export type FileGroup = { id: string; file: File }[];

type DuplicateFinderState =
  | { status: "idle" }
  | { status: "hashing"; total: number; completed: number }
  | { status: "done"; groups: FileGroup[] }
  | { status: "error"; message: string };

export function useDuplicateFinder() {
  const [state, setState] = useState<DuplicateFinderState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const findDuplicates = useCallback((files: File[]) => {
    setState({ status: "hashing", total: files.length, completed: 0 });

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./hashImage.worker.ts", import.meta.url),
      );
    }
    const worker = workerRef.current;

    const filesById = new Map(files.map((file, index) => [String(index), file]));
    const hashes: { id: string; hash: bigint }[] = [];
    let completed = 0;

    worker.onmessage = (event: MessageEvent<HashResponse>) => {
      const response = event.data;
      completed += 1;

      // A file that fails to hash (corrupt, unreadable) is excluded from
      // duplicate detection rather than failing the whole batch - one bad
      // file shouldn't block results for the rest.
      if (response.ok) {
        hashes.push({ id: response.id, hash: BigInt(response.hash) });
      }

      if (completed === files.length) {
        const idGroups = groupNearDuplicates(hashes, SIMILARITY_THRESHOLD);
        const groups: FileGroup[] = idGroups.map((ids) =>
          ids.map((id) => ({ id, file: filesById.get(id)! })),
        );
        setState({ status: "done", groups });
      } else {
        setState({ status: "hashing", total: files.length, completed });
      }
    };

    filesById.forEach((file, id) => {
      const request: HashRequest = { id, file };
      worker.postMessage(request);
    });
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, findDuplicates, reset };
}
