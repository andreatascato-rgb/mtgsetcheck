import { useCallback, useEffect, useRef, useState } from "react";
import type { ChecklistLine } from "../data/checklistTypes";
import { STORAGE_SAVE_FAILED_IT } from "../constants/storageMessages";

const STORAGE_KEY = "mtgsetcheck.v1.userSets";

export type UseUserSetsOptions = {
  onPersistError?: (message: string) => void;
};

export type UserSetEntry = {
  id: string;
  scryfallCode: string;
  name: string;
  /** Codice display (maiuscolo, es. `MH3`). */
  code: string;
  lines: ChecklistLine[];
  createdAt: string;
};

type Stored = { v: 1; sets: UserSetEntry[] };

function load(): UserSetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as Stored;
    if (p.v !== 1 || !Array.isArray(p.sets)) return [];
    return p.sets
      .filter(
        (s) =>
          s &&
          typeof s.id === "string" &&
          typeof s.scryfallCode === "string" &&
          typeof s.name === "string" &&
          typeof s.code === "string" &&
          Array.isArray(s.lines),
      )
      .map((s) => ({
        ...s,
        lines: s.lines.map((l) => {
          const row = l as {
            collectorNumber: unknown;
            name: unknown;
            ownedByDefault: unknown;
            colorIdentity?: unknown;
          };
          const base = {
            collectorNumber: String(row.collectorNumber),
            name: String(row.name),
            ownedByDefault: Boolean(row.ownedByDefault),
          };
          if (
            Array.isArray(row.colorIdentity) &&
            row.colorIdentity.every((x) => typeof x === "string")
          ) {
            return { ...base, colorIdentity: row.colorIdentity as string[] };
          }
          return base;
        }),
      }));
  } catch {
    return [];
  }
}

export function useUserSets(options?: UseUserSetsOptions) {
  const onPersistErrorRef = useRef(options?.onPersistError);
  onPersistErrorRef.current = options?.onPersistError;

  const [sets, setSets] = useState<UserSetEntry[]>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, sets } satisfies Stored));
    } catch {
      onPersistErrorRef.current?.(STORAGE_SAVE_FAILED_IT);
    }
  }, [sets]);

  const addUserSet = useCallback((entry: UserSetEntry): boolean => {
    let accepted = false;
    setSets((prev) => {
      const code = entry.scryfallCode.toLowerCase();
      if (prev.some((s) => s.scryfallCode.toLowerCase() === code)) {
        return prev;
      }
      accepted = true;
      return [...prev, entry];
    });
    return accepted;
  }, []);

  const updateUserSetLines = useCallback((id: string, lines: ChecklistLine[]) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lines } : s)),
    );
  }, []);

  const removeUserSet = useCallback((id: string) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
    try {
      localStorage.removeItem(`mtgsetcheck.v1.collection.${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  return { userSets: sets, addUserSet, updateUserSetLines, removeUserSet };
}
