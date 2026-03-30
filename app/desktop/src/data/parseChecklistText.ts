import type { ChecklistLine } from "./checklistTypes";

/**
 * Parser righe checklist: `[x] 7 - Nome` / `[ ] 1a - Nome` (numero = token senza spazi).
 * Ignora commenti `#` e righe vuote.
 */
export function parseChecklistText(raw: string): ChecklistLine[] {
  const lines: ChecklistLine[] = [];
  const re = /^\[([x ])\]\s*(\S+)\s*-\s*(.+)$/;

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(re);
    if (!m) continue;
    const owned = m[1] === "x";
    const collectorNumber = String(m[2]);
    const name = m[3].trim();
    lines.push({ collectorNumber, name, ownedByDefault: owned });
  }

  return lines;
}

function normChecklistName(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function lineMatchKey(collectorNumber: string, name: string): string {
  return `${collectorNumber}::${normChecklistName(name)}`;
}

/** Testo `.txt` leggibile: una riga per carta, `[x]` = posseduta. */
export function serializeChecklistToText(
  lines: readonly ChecklistLine[],
  ownedByNumber: Record<string, boolean>,
  setId?: string,
): string {
  const header = setId
    ? `# SetCheck — export checklist (setId: ${setId})\n# [x] posseduta · [ ] mancante\n\n`
    : "";
  const body = lines
    .map((l) => {
      const owned = ownedByNumber[l.collectorNumber] ?? l.ownedByDefault;
      const mark = owned ? "x" : " ";
      return `[${mark}] ${l.collectorNumber} - ${l.name}`;
    })
    .join("\n");
  return header + body;
}

/** Unisce righe da file testo con la checklist corrente (stesso numero + nome). */
export function mergeOwnedFromParsedChecklist(
  currentLines: readonly ChecklistLine[],
  parsed: readonly ChecklistLine[],
  previousOwned: Record<string, boolean>,
): Record<string, boolean> {
  const byKey = new Map<string, boolean>();
  for (const p of parsed) {
    byKey.set(lineMatchKey(p.collectorNumber, p.name), p.ownedByDefault);
  }

  const next: Record<string, boolean> = {};
  for (const l of currentLines) {
    const k = lineMatchKey(l.collectorNumber, l.name);
    next[l.collectorNumber] = byKey.has(k)
      ? byKey.get(k)!
      : (previousOwned[l.collectorNumber] ?? l.ownedByDefault);
  }
  return next;
}
