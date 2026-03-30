import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getTabbable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest("[aria-hidden=\"true\"]") && el.offsetParent !== null,
  );
}

/**
 * Mantiene il focus dentro `containerRef` mentre `enabled` è true (Tab / Shift+Tab ciclici).
 * Alla fine ripristina il focus sull’elemento attivo prima dell’apertura.
 */
export function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const el = document.activeElement;
    previousFocus.current = el instanceof HTMLElement ? el : null;
    return () => {
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getTabbable(root);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, containerRef]);
}
