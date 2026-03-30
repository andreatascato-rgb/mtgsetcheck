/** Allineato a `grid-cols-4 sm:5 …` in SetWorkspace (breakpoint Tailwind). */
export function getChecklistGridColumnCount(containerWidth: number): number {
  if (containerWidth >= 1536) return 9;
  if (containerWidth >= 1280) return 8;
  if (containerWidth >= 1024) return 7;
  if (containerWidth >= 768) return 6;
  if (containerWidth >= 640) return 5;
  return 4;
}

/** Padding orizzontale contenuto (p-2 vs sm:p-3). */
export function getChecklistPaddingX(containerWidth: number): number {
  return containerWidth >= 640 ? 12 : 8;
}

const GAP_PX = 6; /* gap-1.5 */
const CARD_ASPECT = 88 / 63;

export function getChecklistGridRowHeightPx(containerWidth: number, columnCount: number): number {
  if (containerWidth <= 0) return 120;
  const padX = getChecklistPaddingX(containerWidth) * 2;
  const inner = Math.max(0, containerWidth - padX);
  const cardW = (inner - GAP_PX * (columnCount - 1)) / columnCount;
  return cardW * CARD_ASPECT + GAP_PX;
}

/* --- Vista tabella checklist: larghezze e padding coerenti con `SetWorkspace` --- */

/**
 * Larghezza unica per tutte le colonne “fisse” (anteprima, N°, Foil, Posseduta).
 * Stesso valore = griglia visiva allineata.
 */
export const CHECKLIST_TABLE_FIXED_COL_WIDTH_CLASS =
  "w-[4.75rem] min-w-[4.75rem] max-w-[4.75rem] shrink-0";

/** Colonna 1 — miniatura (stessa larghezza delle altre colonne strette). */
export const CHECKLIST_TABLE_ART_COL_CLASS = CHECKLIST_TABLE_FIXED_COL_WIDTH_CLASS;

/**
 * Larghezza effettiva della miniatura carta (più stretta della colonna, centrata).
 */
export const CHECKLIST_TABLE_ART_THUMB_WRAP_CLASS = "w-9 shrink-0 sm:w-10";

/** Colonna N° — stessa base larghezza + monospace. */
export const CHECKLIST_TABLE_NUM_COL_CLASS = `${CHECKLIST_TABLE_FIXED_COL_WIDTH_CLASS} font-mono tabular-nums`;

/** Colonna Foil — stessa base larghezza + monospace. */
export const CHECKLIST_TABLE_FOIL_COL_CLASS = `${CHECKLIST_TABLE_FIXED_COL_WIDTH_CLASS} font-mono tabular-nums`;

/** Colonna Posseduta (checkbox) — stessa larghezza delle altre strette. */
export const CHECKLIST_TABLE_OWNED_COL_CLASS = CHECKLIST_TABLE_FIXED_COL_WIDTH_CLASS;

/**
 * Colonna nome: occupa il resto (`flex-1`), minimo leggibile.
 */
export const CHECKLIST_TABLE_NAME_COL_CLASS =
  "min-h-0 min-w-[12rem] flex-1 basis-0";

/**
 * Inset orizzontale della tabella rispetto all’area scroll (`pl` + `pr`).
 * Stesso valore usato nella griglia (`p-2` / `sm:p-3`); qui solo i lati orizzontali.
 * Applicare alla riga, non alle singole celle, così le larghezze fisse restano coerenti.
 */
export const CHECKLIST_TABLE_ROW_EDGE_INSET = "pl-2 sm:pl-3 pr-2 sm:pr-3";
