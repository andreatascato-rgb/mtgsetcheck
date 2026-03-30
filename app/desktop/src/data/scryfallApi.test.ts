import { describe, expect, it } from "vitest";
import { resolveScryfallCard, type ScryfallCard } from "./scryfallApi";

function makeCard(
  collector_number: string,
  name: string,
  id = "id",
): ScryfallCard {
  return {
    object: "card",
    id,
    name,
    collector_number,
  };
}

describe("resolveScryfallCard", () => {
  it("returns single match by exact number", () => {
    const cards = [makeCard("5", "Lightning Bolt")];
    expect(resolveScryfallCard(cards, "5", "Lightning Bolt")).toEqual(cards[0]);
  });

  it("disambiguates same number by normalized name", () => {
    const a = makeCard("1", "Card A", "a");
    const b = makeCard("1", "Card B", "b");
    const cards = [a, b];
    expect(resolveScryfallCard(cards, "1", "Card B")).toBe(b);
  });

  it("falls back to first when multiple exact number and name not found", () => {
    const a = makeCard("1", "Card A", "a");
    const b = makeCard("1", "Card B", "b");
    expect(resolveScryfallCard([a, b], "1", "Unknown")).toBe(a);
  });

  it("matches by numeric part when suffix differs", () => {
    const cards = [makeCard("12a", "Variant")];
    expect(resolveScryfallCard(cards, "12", "Variant")).toBe(cards[0]);
  });

  it("returns undefined when no match", () => {
    expect(resolveScryfallCard([], "1", "X")).toBeUndefined();
  });
});
