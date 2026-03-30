import { type RefObject, useLayoutEffect, useState } from "react";

/** Larghezza `clientWidth` del nodo osservato (0 prima del primo layout). */
export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setW(el.clientWidth);
    });
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);

  return w;
}
