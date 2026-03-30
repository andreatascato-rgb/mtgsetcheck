import { useCallback, useEffect, useState } from "react";
import type { ChecklistLine } from "../data/checklistTypes";
import {
  fetchAllCardsForSet,
  getCardImageUrls,
  resolveScryfallCard,
  type ScryfallCard,
} from "../data/scryfallApi";

export type ResolvedCardImages = {
  grid: string | null;
  large: string | null;
};

type CacheEntry = {
  cards: ScryfallCard[];
  byLine: Map<string, ResolvedCardImages>;
};

const cache = new Map<string, CacheEntry>();

/** Dopo un refresh checklist con lo stesso codice set, invalida per forzare nuovo fetch/indice. */
export function invalidateScryfallSetCache(scryfallSetCode: string): void {
  cache.delete(scryfallSetCode);
}

function lineKey(line: ChecklistLine): string {
  return `${line.collectorNumber}::${line.name}`;
}

function buildIndex(cards: ScryfallCard[], lines: readonly ChecklistLine[]): Map<string, ResolvedCardImages> {
  const byLine = new Map<string, ResolvedCardImages>();
  for (const line of lines) {
    const card = resolveScryfallCard(cards, line.collectorNumber, line.name);
    if (!card) {
      byLine.set(lineKey(line), { grid: null, large: null });
      continue;
    }
    const urls = getCardImageUrls(card);
    byLine.set(lineKey(line), urls);
  }
  return byLine;
}

export function useScryfallSetImages(
  scryfallSetCode: string | null | undefined,
  lines: readonly ChecklistLine[],
): {
  loading: boolean;
  error: string | null;
  getImages: (line: ChecklistLine) => ResolvedCardImages;
  resolveCard: (line: ChecklistLine) => ScryfallCard | undefined;
} {
  const [loading, setLoading] = useState(() => {
    if (!scryfallSetCode || lines.length === 0) return false;
    return !cache.has(scryfallSetCode);
  });
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!scryfallSetCode || lines.length === 0) {
      setLoading(false);
      setError(null);
      return;
    }

    const hit = cache.get(scryfallSetCode);
    if (hit) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const cards = await fetchAllCardsForSet(scryfallSetCode);
        if (cancelled) return;
        const byLine = buildIndex(cards, lines);
        cache.set(scryfallSetCode, { cards, byLine });
        setError(null);
        setVersion((v) => v + 1);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Caricamento immagini fallito");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scryfallSetCode, lines]);

  const getImages = useCallback(
    (line: ChecklistLine): ResolvedCardImages => {
      if (!scryfallSetCode) return { grid: null, large: null };
      const entry = cache.get(scryfallSetCode);
      if (!entry) return { grid: null, large: null };
      const key = lineKey(line);
      if (!entry.byLine.has(key)) {
        const byLine = buildIndex(entry.cards, lines);
        cache.set(scryfallSetCode, { cards: entry.cards, byLine });
      }
      return cache.get(scryfallSetCode)!.byLine.get(key) ?? { grid: null, large: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` dopo fetch cache; `lines` per indice
    [scryfallSetCode, lines, version],
  );

  const resolveCard = useCallback(
    (line: ChecklistLine): ScryfallCard | undefined => {
      if (!scryfallSetCode) return undefined;
      const entry = cache.get(scryfallSetCode);
      if (!entry) return undefined;
      return resolveScryfallCard(entry.cards, line.collectorNumber, line.name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allineato a getImages
    [scryfallSetCode, lines, version],
  );

  return { loading, error, getImages, resolveCard };
}
