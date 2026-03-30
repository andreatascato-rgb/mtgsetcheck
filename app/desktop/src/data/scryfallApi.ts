/**
 * Client minimale API Scryfall (solo lettura).
 * Policy: https://scryfall.com/docs/api — rispettare rate limit tra richieste paginate.
 */

import type { ChecklistLine } from "./checklistTypes";
import { extractWubrgFromManaCost } from "./manaCostPips";
import { normalizeManaColors } from "./manaColorFilter";

export type ScryfallCard = {
  object: "card";
  id: string;
  name: string;
  collector_number: string;
  /** Presenza versione foil (API Scryfall). */
  foil?: boolean;
  /**
   * Colori del costo (regole). Se null, spesso su `card_faces[]`.
   * @see https://scryfall.com/docs/api/cards
   */
  colors?: string[] | null;
  /** Non usato per filtri costo mana (include testo regole / Commander). */
  color_identity?: string[];
  /** Costo mana (stringa `{...}`). Usato se `colors` assente. */
  mana_cost?: string;
  image_uris?: {
    png?: string;
    large?: string;
    normal?: string;
    small?: string;
    art_crop?: string;
  };
  card_faces?: Array<{
    name: string;
    colors?: string[] | null;
    mana_cost?: string;
    image_uris?: {
      png?: string;
      large?: string;
      normal?: string;
      small?: string;
    };
  }>;
};

type ScryfallList = {
  object: "list";
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
};

type ScryfallError = {
  object: "error";
  details?: string;
};

/** Catalogo set Scryfall (solo campi usati dall’app). */
export type ScryfallSet = {
  object: "set";
  id: string;
  code: string;
  name: string;
  released_at: string | null;
  set_type: string;
};

type ScryfallSetList = {
  object: "list";
  data: ScryfallSet[];
  has_more: boolean;
  next_page?: string;
};

const RATE_MS = 75;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getFrontImageUris(card: ScryfallCard): ScryfallCard["image_uris"] {
  if (card.image_uris) return card.image_uris;
  return card.card_faces?.[0]?.image_uris;
}

function urisToGridLarge(u: NonNullable<ScryfallCard["image_uris"]>): {
  grid: string | null;
  large: string | null;
} {
  const grid = u.normal ?? u.small ?? u.large ?? u.png ?? null;
  const large = u.png ?? u.large ?? u.normal ?? null;
  return { grid, large };
}

/** URL per griglia (leggero) e per anteprima/modale (nitido) — solo faccia “davanti”. */
export function getCardImageUrls(card: ScryfallCard): {
  grid: string | null;
  large: string | null;
} {
  const u = getFrontImageUris(card);
  if (!u) return { grid: null, large: null };
  return urisToGridLarge(u);
}

/** Una voce per ogni faccia con immagine (MDFC, ecc.). Ordine Scryfall. */
export type CardFaceImageUrls = {
  label: string;
  grid: string | null;
  large: string | null;
};

export function getCardFaceImageUrls(card: ScryfallCard): CardFaceImageUrls[] {
  const withUris = (card.card_faces ?? []).filter((f) => f.image_uris);
  if (withUris.length >= 2) {
    return withUris.map((f) => ({
      label: (f.name ?? "Faccia").trim(),
      ...urisToGridLarge(f.image_uris!),
    }));
  }
  if (card.image_uris) {
    const short =
      card.name.includes("//") ? card.name.split("//")[0]!.trim() : card.name.trim();
    return [{ label: short || "Carta", ...urisToGridLarge(card.image_uris) }];
  }
  if (withUris.length === 1 && withUris[0].image_uris) {
    return [
      {
        label: (withUris[0].name ?? "Carta").trim(),
        ...urisToGridLarge(withUris[0].image_uris),
      },
    ];
  }
  return [];
}

/**
 * Colori per filtro: `colors` + facce → pip da `mana_cost` → se ancora vuoto `color_identity`
 * (terre e casi senza costo colorato; Scryfall documenta spesso identity in quei casi).
 */
export function manaColorsFromScryfallCard(c: ScryfallCard): readonly string[] {
  const merged = new Set<string>();
  for (const col of c.colors ?? []) merged.add(col);
  for (const f of c.card_faces ?? []) {
    for (const col of f.colors ?? []) merged.add(col);
  }
  if (merged.size > 0) {
    return normalizeManaColors([...merged]);
  }
  const costs: string[] = [];
  if (c.mana_cost) costs.push(c.mana_cost);
  for (const f of c.card_faces ?? []) {
    if (f.mana_cost) costs.push(f.mana_cost);
  }
  const fromPips = new Set<string>();
  for (const cost of costs) {
    for (const col of extractWubrgFromManaCost(cost)) fromPips.add(col);
  }
  if (fromPips.size > 0) {
    return normalizeManaColors([...fromPips]);
  }
  if (c.color_identity?.length) {
    return normalizeManaColors(c.color_identity);
  }
  return [];
}

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tutte le pagine di ricerca Scryfall. */
export async function fetchAllCardsForSet(setCode: string): Promise<ScryfallCard[]> {
  const q = `set:${setCode} order:set unique:prints`;
  let url: string | null =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`;
  const out: ScryfallCard[] = [];

  while (url) {
    const res = await fetch(url);
    const json = (await res.json()) as ScryfallList | ScryfallError;

    if (!res.ok || json.object === "error") {
      const msg =
        json.object === "error"
          ? (json.details ?? "Errore Scryfall")
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    out.push(...json.data);
    if (!json.has_more) break;
    url = json.next_page ?? null;
    await sleep(RATE_MS);
  }

  return out;
}

/** Righe checklist da catalogo carte (stesso ordine di `order:set` / `unique:prints`). */
export function checklistLinesFromScryfallCards(
  cards: readonly ScryfallCard[],
): ChecklistLine[] {
  const sorted = [...cards].sort((a, b) =>
    a.collector_number.localeCompare(b.collector_number, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  return sorted.map((c) => ({
    collectorNumber: c.collector_number.trim(),
    name: c.name,
    ownedByDefault: false,
    manaColors: manaColorsFromScryfallCard(c),
  }));
}

/**
 * Set con `released_at` ≥ cutoff (ISO date). Catalogo ordinato per data decrescente;
 * interrompe la paginazione quando la pagina è interamente prima del cutoff.
 */
export async function fetchSetsReleasedSince(cutoffIsoDate: string): Promise<ScryfallSet[]> {
  const cutoff = Date.parse(cutoffIsoDate);
  if (Number.isNaN(cutoff)) {
    throw new Error("Data cutoff non valida");
  }
  let url: string | null = "https://api.scryfall.com/sets";
  const out: ScryfallSet[] = [];
  let pages = 0;
  while (url && pages < 50) {
    if (pages > 0) await sleep(RATE_MS);
    const res = await fetch(url);
    const json = (await res.json()) as ScryfallSetList | ScryfallError;

    if (!res.ok || json.object === "error") {
      const msg =
        json.object === "error"
          ? (json.details ?? "Errore Scryfall")
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    for (const s of json.data) {
      if (!s.released_at) continue;
      if (Date.parse(s.released_at) >= cutoff) {
        out.push(s);
      }
    }

    const last = json.data[json.data.length - 1];
    if (last?.released_at && Date.parse(last.released_at) < cutoff) {
      break;
    }
    if (!json.has_more) break;
    url = json.next_page ?? null;
    pages++;
  }

  return out;
}

/**
 * Ricerca set nel catalogo `/sets` (filtro lato client: nome o codice).
 * Scryfall non espone `/sets/search`; si pagina fino a un limite di risultati.
 */
export async function searchScryfallSets(query: string): Promise<ScryfallSet[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: ScryfallSet[] = [];
  let url: string | null = "https://api.scryfall.com/sets";
  let pages = 0;
  const maxPages = 40;
  const maxHits = 100;

  while (url && pages < maxPages && out.length < maxHits) {
    if (pages > 0) await sleep(RATE_MS);
    const res = await fetch(url);
    const json = (await res.json()) as ScryfallSetList | ScryfallError;

    if (!res.ok || json.object === "error") {
      const msg =
        json.object === "error"
          ? (json.details ?? "Errore Scryfall")
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    for (const s of json.data) {
      const name = s.name.toLowerCase();
      const code = s.code.toLowerCase();
      if (name.includes(q) || code.includes(q)) {
        out.push(s);
        if (out.length >= maxHits) break;
      }
    }

    if (out.length >= maxHits) break;
    if (!json.has_more) break;
    url = json.next_page ?? null;
    pages++;
  }

  return out;
}

/**
 * Risolve la carta Scryfall per una riga checklist (numero + nome).
 * Gestisce più stampe con stesso numero (es. suffissi lettera) confrontando il nome.
 */
export function resolveScryfallCard(
  cards: readonly ScryfallCard[],
  collectorNumber: string,
  checklistName: string,
): ScryfallCard | undefined {
  const wantNum = collectorNumber.trim();
  const wantName = normName(checklistName);

  const exact = cards.filter((c) => c.collector_number === wantNum);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    const byName = exact.find((c) => normName(c.name) === wantName);
    return byName ?? exact[0];
  }

  const wantParsed = parseInt(wantNum.replace(/[^\d]/g, ""), 10);
  const sameNumeric = cards.filter((c) => {
    const n = parseInt(c.collector_number.replace(/[^\d]/g, ""), 10);
    return !Number.isNaN(n) && !Number.isNaN(wantParsed) && n === wantParsed;
  });
  if (sameNumeric.length === 1) return sameNumeric[0];
  if (sameNumeric.length > 1) {
    const byName = sameNumeric.find((c) => normName(c.name) === wantName);
    return byName ?? sameNumeric[0];
  }

  return undefined;
}
