import { describe, expect, it } from "vitest";
import {
  mergeOwnedFromParsedChecklist,
  parseChecklistText,
  serializeChecklistToText,
} from "./parseChecklistText";

describe("parseChecklistText", () => {
  it("parses owned and unowned lines", () => {
    const raw = `[x] 7 - Foo\n[ ] 1a - Bar`;
    expect(parseChecklistText(raw)).toEqual([
      { collectorNumber: "7", name: "Foo", ownedByDefault: true },
      { collectorNumber: "1a", name: "Bar", ownedByDefault: false },
    ]);
  });

  it("ignores empty lines and # comments", () => {
    const raw = `\n# comment\n[x] S1 - Baz\n`;
    expect(parseChecklistText(raw)).toEqual([
      { collectorNumber: "S1", name: "Baz", ownedByDefault: true },
    ]);
  });

  it("rejects malformed lines", () => {
    expect(parseChecklistText("not a line")).toEqual([]);
  });
});

describe("serializeChecklistToText + merge", () => {
  const lines = [
    { collectorNumber: "1", name: "A", ownedByDefault: false },
    { collectorNumber: "2", name: "B", ownedByDefault: false },
  ] as const;

  it("round-trips marks via serialize", () => {
    const owned = { "1": true, "2": false };
    const text = serializeChecklistToText([...lines], owned, "id-1");
    expect(text).toContain("[x] 1 - A");
    expect(text).toContain("[ ] 2 - B");
  });

  it("mergeOwnedFromParsedChecklist matches by number and name", () => {
    const parsed = parseChecklistText(`[x] 1 - A\n[ ] 2 - B`);
    const prev = { "1": false, "2": false };
    const next = mergeOwnedFromParsedChecklist([...lines], parsed, prev);
    expect(next["1"]).toBe(true);
    expect(next["2"]).toBe(false);
  });
});
