import { describe, expect, it } from "vitest";
import { matchesManaColorFilter, normalizeManaColors } from "./manaColorFilter";
import type { ChecklistLine } from "./checklistTypes";

function line(overrides: Partial<ChecklistLine> & Pick<ChecklistLine, "name">): ChecklistLine {
  return {
    collectorNumber: "1",
    ownedByDefault: false,
    ...overrides,
  };
}

describe("normalizeManaColors", () => {
  it("filters to WUBRG and drops unknown", () => {
    expect(normalizeManaColors(["W", "U", "X"])).toEqual(["W", "U"]);
  });

  it("returns empty for null/empty", () => {
    expect(normalizeManaColors(undefined)).toEqual([]);
    expect(normalizeManaColors([])).toEqual([]);
  });
});

describe("matchesManaColorFilter", () => {
  it("empty active: matches all", () => {
    expect(matchesManaColorFilter(line({ name: "a" }), new Set())).toBe(true);
    expect(matchesManaColorFilter(line({ name: "a", manaColors: ["R"] }), new Set())).toBe(
      true,
    );
  });

  it("missing manaColors: excluded when filter on", () => {
    expect(matchesManaColorFilter(line({ name: "a" }), new Set(["W"]))).toBe(false);
  });

  it("colorless matches only C", () => {
    const c = line({ name: "x", manaColors: [] });
    expect(matchesManaColorFilter(c, new Set(["C"]))).toBe(true);
    expect(matchesManaColorFilter(c, new Set(["W"]))).toBe(false);
    expect(matchesManaColorFilter(c, new Set(["W", "C"]))).toBe(true);
  });

  it("OR: any mana color in selection", () => {
    const wu = line({ name: "x", manaColors: ["W", "U"] });
    expect(matchesManaColorFilter(wu, new Set(["U"]))).toBe(true);
    expect(matchesManaColorFilter(wu, new Set(["W"]))).toBe(true);
    expect(matchesManaColorFilter(wu, new Set(["B"]))).toBe(false);
  });

  it("mono-W does not match U-only filter", () => {
    expect(matchesManaColorFilter(line({ name: "w", manaColors: ["W"] }), new Set(["U"]))).toBe(
      false,
    );
  });
});
