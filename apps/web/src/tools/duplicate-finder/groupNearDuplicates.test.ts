import { describe, expect, it } from "vitest";
import { groupNearDuplicates } from "./groupNearDuplicates";

describe("groupNearDuplicates", () => {
  it("returns no groups when nothing is within the threshold", () => {
    const items = [
      { id: "a", hash: 0b0000n },
      { id: "b", hash: 0b1111n },
    ];
    expect(groupNearDuplicates(items, 1)).toEqual([]);
  });

  it("groups two hashes within the threshold, excluding a far one", () => {
    const items = [
      { id: "a", hash: 0b0000n },
      { id: "b", hash: 0b0001n }, // distance 1 from a
      { id: "c", hash: 0b1111n }, // distance 4 from a
    ];
    const groups = groupNearDuplicates(items, 2).map((g) => g.sort());
    expect(groups).toEqual([["a", "b"]]);
  });

  it("transitively groups a chain: a~b and b~c groups all three, even if a is far from c", () => {
    const items = [
      { id: "a", hash: 0b000000n },
      { id: "b", hash: 0b000011n }, // distance 2 from a
      { id: "c", hash: 0b001111n }, // distance 2 from b, distance 4 from a
    ];
    const groups = groupNearDuplicates(items, 2).map((g) => g.sort());
    expect(groups).toEqual([["a", "b", "c"]]);
  });

  it("puts unrelated items in separate groups", () => {
    const items = [
      { id: "a", hash: 0b0000n },
      { id: "b", hash: 0b0001n },
      { id: "x", hash: 0b1110n },
      { id: "y", hash: 0b1111n },
    ];
    const groups = groupNearDuplicates(items, 1)
      .map((g) => g.sort())
      .sort();
    expect(groups).toEqual([
      ["a", "b"],
      ["x", "y"],
    ]);
  });

  it("never returns a group of one - a photo with no matches isn't a duplicate", () => {
    const items = [
      { id: "a", hash: 0b0000n },
      { id: "b", hash: 0b1111n },
      { id: "c", hash: 0b1010n },
    ];
    expect(groupNearDuplicates(items, 0)).toEqual([]);
  });
});
