import { hammingDistance } from "./hammingDistance";

export type HashedItem = { id: string; hash: bigint };

/**
 * Groups items whose hashes are within `threshold` bits of each other,
 * using union-find so matches are transitive: if A matches B and B matches
 * C, all three land in one group even if A and C aren't within the
 * threshold of *each other*. That's a deliberate choice - a burst of
 * near-identical photos (slightly different each time, like a photo
 * series) should end up as one group, not split into overlapping pairs.
 *
 * A group of exactly one item isn't returned - nothing to call a
 * "duplicate" of.
 */
export function groupNearDuplicates(items: HashedItem[], threshold: number): string[][] {
  const parent = new Map<string, string>();

  function find(id: string): string {
    if (!parent.has(id)) parent.set(id, id);
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  }

  function union(a: string, b: string): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }

  for (const item of items) find(item.id);

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (hammingDistance(items[i].hash, items[j].hash) <= threshold) {
        union(items[i].id, items[j].id);
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const item of items) {
    const root = find(item.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(item.id);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}
