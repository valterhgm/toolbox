import { describe, expect, it } from "vitest";
import { calculateSavings } from "./calculateSavings";

describe("calculateSavings", () => {
  it("keeps the largest file per group and totals the rest as reclaimable", () => {
    const result = calculateSavings([
      [
        { id: "a", size: 100 },
        { id: "b", size: 300 },
        { id: "c", size: 200 },
      ],
    ]);

    expect(result.groups).toEqual([
      { keepId: "b", removeIds: ["c", "a"], reclaimableBytes: 300 },
    ]);
    expect(result.totalReclaimableBytes).toBe(300);
  });

  it("sums reclaimable bytes across multiple groups", () => {
    const result = calculateSavings([
      [
        { id: "a", size: 100 },
        { id: "b", size: 300 },
      ],
      [
        { id: "x", size: 50 },
        { id: "y", size: 40 },
      ],
    ]);

    expect(result.totalReclaimableBytes).toBe(100 + 40);
  });

  it("is zero when there are no groups", () => {
    expect(calculateSavings([])).toEqual({ totalReclaimableBytes: 0, groups: [] });
  });
});
