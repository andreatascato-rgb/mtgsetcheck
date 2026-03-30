import { describe, expect, it } from "vitest";
import {
  contributionsFromColorIdentity,
  normalizeColorIdentity,
} from "./colorProgress";

describe("normalizeColorIdentity", () => {
  it("filters to WUBRG and drops unknown", () => {
    expect(normalizeColorIdentity(["W", "U", "X"])).toEqual(["W", "U"]);
  });

  it("returns empty for null/empty", () => {
    expect(normalizeColorIdentity(undefined)).toEqual([]);
    expect(normalizeColorIdentity([])).toEqual([]);
  });
});

describe("contributionsFromColorIdentity", () => {
  it("monocolor: 1 on that color", () => {
    const c = contributionsFromColorIdentity(["R"]);
    expect(c.R).toBe(1);
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("bicolor: 0.5 each", () => {
    const c = contributionsFromColorIdentity(["G", "W"]);
    expect(c.G).toBe(0.5);
    expect(c.W).toBe(0.5);
  });

  it("3+ colors: gold", () => {
    const c = contributionsFromColorIdentity(["W", "U", "B"]);
    expect(c.gold).toBe(1);
  });

  it("empty: colorless", () => {
    const c = contributionsFromColorIdentity([]);
    expect(c.C).toBe(1);
  });
});
