import { describe, expect, it } from "vitest";
import {
  getCardFaceImageUrls,
  manaColorsFromScryfallCard,
  resolveScryfallCard,
  type ScryfallCard,
} from "./scryfallApi";

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

describe("manaColorsFromScryfallCard", () => {
  it("uses colors (mana cost), not color_identity", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "x",
      name: "Test",
      collector_number: "1",
      colors: ["U"],
      color_identity: ["U", "R"],
    };
    expect(manaColorsFromScryfallCard(c)).toEqual(["U"]);
  });

  it("falls back to front face colors on MDFC", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "y",
      name: "Flip",
      collector_number: "2",
      card_faces: [{ name: "Front", colors: ["G", "W"] }],
    };
    expect(manaColorsFromScryfallCard(c)).toEqual(["G", "W"]);
  });

  it("merges face colors when root colors is empty", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "z",
      name: "Face",
      collector_number: "3",
      colors: [],
      card_faces: [{ name: "Front", colors: ["R"] }],
    };
    expect(manaColorsFromScryfallCard(c)).toEqual(["R"]);
  });

  it("parses mana_cost when colors arrays are empty", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "cost",
      name: "Bolt",
      collector_number: "4",
      colors: [],
      mana_cost: "{R}",
    };
    expect(manaColorsFromScryfallCard(c)).toEqual(["R"]);
  });

  it("uses color_identity when no colored cost (e.g. basic land)", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "plains",
      name: "Plains",
      collector_number: "5",
      colors: [],
      color_identity: ["W"],
    };
    expect(manaColorsFromScryfallCard(c)).toEqual(["W"]);
  });
});

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

describe("getCardFaceImageUrls", () => {
  const u = {
    small: "s.png",
    normal: "n.png",
    large: "l.png",
    png: "p.png",
  };

  it("returns one face from root image_uris", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "1",
      name: "Sol Ring",
      collector_number: "1",
      image_uris: u,
    };
    expect(getCardFaceImageUrls(c)).toEqual([
      { label: "Sol Ring", grid: "n.png", large: "p.png" },
    ]);
  });

  it("returns two faces for MDFC with card_faces", () => {
    const c: ScryfallCard = {
      object: "card",
      id: "2",
      name: "Day // Night",
      collector_number: "2",
      card_faces: [
        { name: "Day", image_uris: u },
        { name: "Night", image_uris: { ...u, png: "p2.png" } },
      ],
    };
    const faces = getCardFaceImageUrls(c);
    expect(faces).toHaveLength(2);
    expect(faces[0]).toMatchObject({ label: "Day", large: "p.png" });
    expect(faces[1]).toMatchObject({ label: "Night", large: "p2.png" });
  });
});
