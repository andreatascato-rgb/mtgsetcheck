import type { ChecklistLine } from "./checklistTypes";

/** Segmenti barra completamento: WUBRG, multicolor (3+), incolore. */
export type ManaSegment = "W" | "U" | "B" | "R" | "G" | "gold" | "C";

export const MANA_SEGMENT_ORDER: readonly ManaSegment[] = [
  "W",
  "U",
  "B",
  "R",
  "G",
  "gold",
  "C",
];

const VALID = new Set(["W", "U", "B", "R", "G"]);

/** 5 colori distinti → contributo `gold` (stesso criterio 3+ colori). */
export const FALLBACK_IDENTITY_FOR_GOLD: readonly string[] = [
  "W",
  "U",
  "B",
  "R",
  "G",
];

/** Normalizza `color_identity` Scryfall ai soli simboli mana. */
export function normalizeColorIdentity(
  colorIdentity: readonly string[] | undefined | null,
): readonly string[] {
  if (!colorIdentity?.length) return [];
  return colorIdentity.filter((c): c is "W" | "U" | "B" | "R" | "G" =>
    VALID.has(c),
  );
}

/**
 * Pesi: monocolor 1; bicolor 0,5+0,5; 3+ colori → oro; nessun colore → C.
 */
export function contributionsFromColorIdentity(
  colorIdentity: readonly string[] | undefined | null,
): Record<ManaSegment, number> {
  const out: Record<ManaSegment, number> = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    gold: 0,
    C: 0,
  };
  const uniq = [...new Set(normalizeColorIdentity(colorIdentity))].sort();
  if (uniq.length === 0) {
    out.C = 1;
    return out;
  }
  if (uniq.length === 1) {
    out[uniq[0] as "W" | "U" | "B" | "R" | "G"] = 1;
    return out;
  }
  if (uniq.length === 2) {
    out[uniq[0] as "W" | "U" | "B" | "R" | "G"] = 0.5;
    out[uniq[1] as "W" | "U" | "B" | "R" | "G"] = 0.5;
    return out;
  }
  out.gold = 1;
  return out;
}

export type ColorBarSegmentStats = { total: number; owned: number };

export type ColorBarStats = {
  segments: Record<ManaSegment, ColorBarSegmentStats>;
  totalWeight: number;
  ownedWeight: number;
  /** true se ogni riga ha un’identity nota (dati checklist o Scryfall). */
  hasColorData: boolean;
};

function emptySegments(): Record<ManaSegment, ColorBarSegmentStats> {
  return {
    W: { total: 0, owned: 0 },
    U: { total: 0, owned: 0 },
    B: { total: 0, owned: 0 },
    R: { total: 0, owned: 0 },
    G: { total: 0, owned: 0 },
    gold: { total: 0, owned: 0 },
    C: { total: 0, owned: 0 },
  };
}

/**
 * Somma contributi per segmento. `getColorIdentity` deve restituire `undefined`
 * se i colori non sono ancora noti (nessun dato).
 */
export function computeColorBarStats(
  lines: readonly ChecklistLine[],
  ownedByNumber: Record<string, boolean>,
  getColorIdentity: (line: ChecklistLine) => readonly string[] | undefined,
): ColorBarStats {
  const segments = emptySegments();
  let unknownLines = 0;

  for (const line of lines) {
    const ci = getColorIdentity(line);
    if (ci === undefined) {
      unknownLines += 1;
      continue;
    }
    const owned = ownedByNumber[line.collectorNumber] ?? false;
    const contrib = contributionsFromColorIdentity(ci);
    for (const seg of MANA_SEGMENT_ORDER) {
      const w = contrib[seg];
      if (w <= 0) continue;
      segments[seg].total += w;
      if (owned) segments[seg].owned += w;
    }
  }

  const totalWeight = MANA_SEGMENT_ORDER.reduce((s, k) => s + segments[k].total, 0);
  const ownedWeight = MANA_SEGMENT_ORDER.reduce((s, k) => s + segments[k].owned, 0);

  const hasColorData =
    lines.length > 0 && unknownLines === 0 && totalWeight > 0;

  return { segments, totalWeight, ownedWeight, hasColorData };
}

/** Palette segmenti (per future UI mana; la barra completamento è attualmente uniforme). */
export const SEGMENT_FILL_CLASS: Record<ManaSegment, string> = {
  W: "bg-zinc-100",
  U: "bg-sky-400",
  B: "bg-violet-500",
  R: "bg-red-500",
  G: "bg-emerald-500",
  gold: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500",
  C: "bg-zinc-400",
};
