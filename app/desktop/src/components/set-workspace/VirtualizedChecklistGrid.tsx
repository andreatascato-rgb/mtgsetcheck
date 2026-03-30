import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo } from "react";
import type { ChecklistLine } from "../../data/checklistTypes";
import {
  getChecklistGridColumnCount,
  getChecklistGridRowHeightPx,
} from "./checklistLayout";
import type { RefObject } from "react";

type VirtualizedChecklistGridProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Da `useContainerWidth(scrollRef)`; 0 prima del primo layout. */
  containerWidth: number;
  items: readonly ChecklistLine[];
  children: (line: ChecklistLine) => React.ReactNode;
};

/**
 * Griglia carte virtualizzata per riga (riduce DOM con set grandi).
 */
export function VirtualizedChecklistGrid({
  scrollRef,
  containerWidth,
  items,
  children,
}: VirtualizedChecklistGridProps) {
  const w = containerWidth > 0 ? containerWidth : 400;
  const columnCount = useMemo(() => getChecklistGridColumnCount(w), [w]);

  const rowCount = Math.max(0, Math.ceil(items.length / columnCount));

  const rowHeightPx = useMemo(
    () => getChecklistGridRowHeightPx(w, columnCount),
    [w, columnCount],
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeightPx,
    overscan: 2,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeightPx, columnCount, rowCount]);

  const totalSize = virtualizer.getTotalSize();

  if (items.length === 0) return null;

  return (
    <div
      className="relative w-full"
      style={{ height: totalSize }}
      role="list"
      aria-label="Carte in griglia"
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columnCount;
        const rowItems = items.slice(start, start + columnCount);
        return (
          <div
            key={virtualRow.key}
            className="absolute left-0 right-0 px-2 sm:px-3"
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              className="grid h-full w-full gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map((line) => (
                <div key={`${line.collectorNumber}::${line.name}`} className="min-w-0">
                  {children(line)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
