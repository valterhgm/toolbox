export type SizedItem = { id: string; size: number };

export type SavingsGroup = {
  keepId: string;
  removeIds: string[];
  reclaimableBytes: number;
};

export type SavingsResult = {
  totalReclaimableBytes: number;
  groups: SavingsGroup[];
};

/** For each duplicate group, "keep" the largest file (the best-quality
 * copy is the most useful one to hang on to) and count the rest as
 * reclaimable space - the same heuristic a person would use by eye. */
export function calculateSavings(groups: SizedItem[][]): SavingsResult {
  const resultGroups: SavingsGroup[] = groups.map((group) => {
    const [keep, ...rest] = [...group].sort((a, b) => b.size - a.size);
    return {
      keepId: keep.id,
      removeIds: rest.map((item) => item.id),
      reclaimableBytes: rest.reduce((sum, item) => sum + item.size, 0),
    };
  });

  return {
    totalReclaimableBytes: resultGroups.reduce((sum, g) => sum + g.reclaimableBytes, 0),
    groups: resultGroups,
  };
}
