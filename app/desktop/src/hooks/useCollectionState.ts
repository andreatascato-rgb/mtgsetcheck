import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChecklistLine } from "../data/checklistTypes";
import { STORAGE_SAVE_FAILED_IT } from "../constants/storageMessages";
import {
  mergeOwnedFromParsedChecklist,
  parseChecklistText,
  serializeChecklistToText,
} from "../data/parseChecklistText";

const STORAGE_PREFIX = "mtgsetcheck.v1.collection";

function storageKey(setId: string): string {
  return `${STORAGE_PREFIX}.${setId}`;
}

function loadStored(setId: string): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(storageKey(setId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== "boolean") continue;
      out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

function mergeWithFile(
  lines: readonly ChecklistLine[],
  stored: Record<string, boolean> | null,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const l of lines) {
    const n = l.collectorNumber;
    out[n] = stored && n in stored ? stored[n]! : l.ownedByDefault;
  }
  return out;
}

export type UseCollectionStateOptions = {
  onPersistError?: (message: string) => void;
};

export function useCollectionState(
  setId: string,
  lines: readonly ChecklistLine[],
  options?: UseCollectionStateOptions,
) {
  const onPersistErrorRef = useRef(options?.onPersistError);
  onPersistErrorRef.current = options?.onPersistError;

  const [ownedByNumber, setOwnedByNumber] = useState<Record<string, boolean>>(() =>
    mergeWithFile(lines, loadStored(setId)),
  );

  useEffect(() => {
    setOwnedByNumber(mergeWithFile(lines, loadStored(setId)));
  }, [setId, lines]);

  const persist = useCallback(
    (next: Record<string, boolean>) => {
      try {
        localStorage.setItem(storageKey(setId), JSON.stringify(next));
        return true;
      } catch {
        onPersistErrorRef.current?.(STORAGE_SAVE_FAILED_IT);
        return false;
      }
    },
    [setId],
  );

  const setOwned = useCallback(
    (collectorNumber: string, owned: boolean) => {
      setOwnedByNumber((prev) => {
        const next = { ...prev, [collectorNumber]: owned };
        if (!persist(next)) return prev;
        return next;
      });
    },
    [persist],
  );

  const counts = useMemo(() => {
    let owned = 0;
    let missing = 0;
    for (const l of lines) {
      if (ownedByNumber[l.collectorNumber]) owned += 1;
      else missing += 1;
    }
    return {
      total: lines.length,
      owned,
      missing,
    };
  }, [lines, ownedByNumber]);

  const exportJson = useCallback(() => {
    return JSON.stringify({ v: 1 as const, setId, owned: ownedByNumber }, null, 2);
  }, [setId, ownedByNumber]);

  const importFromJson = useCallback(
    (json: string): { ok: true } | { ok: false; error: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return { ok: false, error: "File non valido (JSON)." };
      }
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, error: "Formato non riconosciuto." };
      }
      const o = parsed as Record<string, unknown>;
      if (o.v !== 1) {
        return { ok: false, error: "Versione file non supportata." };
      }
      if (o.setId !== setId) {
        return {
          ok: false,
          error: `Questo file è per un altro set (“${String(o.setId)}”).`,
        };
      }
      const ownedRaw = o.owned;
      if (!ownedRaw || typeof ownedRaw !== "object") {
        return { ok: false, error: "Dati collezione mancanti." };
      }
      const incoming: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(ownedRaw as Record<string, unknown>)) {
        if (typeof v !== "boolean") continue;
        incoming[k] = v;
      }
      const next: Record<string, boolean> = {};
      for (const l of lines) {
        const n = l.collectorNumber;
        next[n] = n in incoming ? incoming[n]! : l.ownedByDefault;
      }
      if (!persist(next)) {
        return { ok: false, error: STORAGE_SAVE_FAILED_IT };
      }
      setOwnedByNumber(next);
      return { ok: true };
    },
    [setId, lines, persist],
  );

  const exportChecklistText = useCallback(() => {
    return serializeChecklistToText(lines, ownedByNumber, setId);
  }, [lines, ownedByNumber, setId]);

  const importFromChecklistText = useCallback(
    (raw: string): { ok: true } | { ok: false; error: string } => {
      const parsed = parseChecklistText(raw);
      if (parsed.length === 0) {
        return {
          ok: false,
          error:
            "Nessuna riga riconosciuta. Formato: [x] o [ ] poi numero - nome (vedi esportazione .txt).",
        };
      }
      const next = mergeOwnedFromParsedChecklist(lines, parsed, ownedByNumber);
      if (!persist(next)) {
        return { ok: false, error: STORAGE_SAVE_FAILED_IT };
      }
      setOwnedByNumber(next);
      return { ok: true };
    },
    [lines, ownedByNumber, persist],
  );

  return {
    ownedByNumber,
    setOwned,
    counts,
    exportJson,
    importFromJson,
    exportChecklistText,
    importFromChecklistText,
  };
}
