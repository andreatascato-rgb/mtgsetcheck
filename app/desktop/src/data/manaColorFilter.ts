import type { ChecklistLine } from "./checklistTypes";

const VALID = new Set(["W", "U", "B", "R", "G"]);

/** Chiavi filtro: cinque colori + incolore (C). */
export type ManaFilterKey = "W" | "U" | "B" | "R" | "G" | "C";

export const MANA_FILTER_ORDER: readonly ManaFilterKey[] = [
  "W",
  "U",
  "B",
  "R",
  "G",
  "C",
];

/** Normalizza un array Scryfall `colors` ai soli W/U/B/R/G. */
export function normalizeManaColors(
  colors: readonly string[] | undefined | null,
): readonly string[] {
  if (!colors?.length) return [];
  return colors.filter((c): c is "W" | "U" | "B" | "R" | "G" => VALID.has(c));
}

/**
 * Filtro OR su `manaColors` (derivato da Scryfall alla creazione/refresh del set).
 * - Nessun toggle → tutte le righe.
 * - Con toggle: righe senza `manaColors` (solo import testo / dati non migrati) **non** passano;
 *   `[]` = incolore (solo se il toggle C è tra i selezionati); altrimenti basta un colore in comune.
 */
export function matchesManaColorFilter(
  line: ChecklistLine,
  active: ReadonlySet<ManaFilterKey>,
): boolean {
  if (active.size === 0) return true;
  if (line.manaColors === undefined) return false;
  const mc = normalizeManaColors(line.manaColors);
  if (mc.length === 0) return active.has("C");
  return mc.some((c) => active.has(c as ManaFilterKey));
}
