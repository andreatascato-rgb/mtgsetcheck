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

/** Altezza riga vista lista (miniatura + padding). */
export const CHECKLIST_LIST_ROW_HEIGHT_PX = 60;
