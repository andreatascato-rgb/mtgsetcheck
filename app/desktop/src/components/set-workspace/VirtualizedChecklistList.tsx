import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, type RefObject } from "react";
import type { ChecklistLine } from "../../data/checklistTypes";
import { CHECKLIST_LIST_ROW_HEIGHT_PX } from "./checklistLayout";

type VirtualizedChecklistListProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  items: readonly ChecklistLine[];
  children: (line: ChecklistLine) => React.ReactNode;
};

/**
 * Lista compatta virtualizzata (stesso ordine delle righe checklist).
 */
export function VirtualizedChecklistList({
  scrollRef,
  items,
  children,
}: VirtualizedChecklistListProps) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CHECKLIST_LIST_ROW_HEIGHT_PX,
    overscan: 8,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, items.length]);

  const totalSize = virtualizer.getTotalSize();

  if (items.length === 0) return null;

  return (
    <div className="relative w-full" style={{ height: totalSize }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const line = items[virtualRow.index];
        return (
          <div
            key={`${line.collectorNumber}::${line.name}`}
            className={[
              "absolute left-0 right-0 border-t border-border/80",
              virtualRow.index === 0 ? "border-t-0" : "",
            ].join(" ")}
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {children(line)}
          </div>
        );
      })}
    </div>
  );
}
