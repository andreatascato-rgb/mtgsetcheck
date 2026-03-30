import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  checklistLinesFromScryfallCards,
  fetchAllCardsForSet,
  fetchSetsReleasedSince,
  searchScryfallSets,
  type ScryfallSet,
} from "../../data/scryfallApi";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import type { UserSetEntry } from "../../hooks/useUserSets";

export type NewSetModalProps = {
  open: boolean;
  onClose: () => void;
  /** true se il set è stato aggiunto. */
  onCreated: (entry: UserSetEntry) => void;
  existingScryfallCodes: ReadonlySet<string>;
};

export function NewSetModal({
  open,
  onClose,
  onCreated,
  existingScryfallCodes,
}: NewSetModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);
  const [recent, setRecent] = useState<ScryfallSet[]>([]);
  const [loadRecent, setLoadRecent] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<ScryfallSet[]>([]);
  const [loadSearch, setLoadSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScryfallSet | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  const qTrim = query.trim();
  const useSearch = qTrim.length >= 2;

  const visibleList = useMemo(() => {
    const raw = useSearch ? searchHits : recent;
    return raw.filter((s) => !existingScryfallCodes.has(s.code.toLowerCase()));
  }, [useSearch, searchHits, recent, existingScryfallCodes]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecent([]);
      setRecentError(null);
      setSearchHits([]);
      setSearchError(null);
      setSelected(null);
      setConfirmError(null);
      setConfirmBusy(false);
      return;
    }

    let cancelled = false;
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    const cutoff = d.toISOString().slice(0, 10);

    setLoadRecent(true);
    setRecentError(null);
    fetchSetsReleasedSince(cutoff)
      .then((sets) => {
        if (!cancelled) setRecent(sets);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRecentError(e instanceof Error ? e.message : "Caricamento set fallito");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadRecent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !useSearch) {
      if (!useSearch) {
        setSearchHits([]);
        setSearchError(null);
        setLoadSearch(false);
      }
      return;
    }

    setLoadSearch(true);
    setSearchError(null);
    const seq = ++searchSeq.current;

    const t = window.setTimeout(() => {
      searchScryfallSets(qTrim)
        .then((hits) => {
          if (seq !== searchSeq.current) return;
          setSearchHits(hits);
        })
        .catch((e: unknown) => {
          if (seq !== searchSeq.current) return;
          setSearchError(e instanceof Error ? e.message : "Ricerca fallita");
          setSearchHits([]);
        })
        .finally(() => {
          if (seq !== searchSeq.current) return;
          setLoadSearch(false);
        });
    }, 320);

    return () => {
      window.clearTimeout(t);
    };
  }, [open, useSearch, qTrim]);

  const onConfirm = useCallback(async () => {
    if (!selected || confirmBusy) return;
    setConfirmError(null);
    setConfirmBusy(true);
    try {
      const code = selected.code.toLowerCase();
      const cards = await fetchAllCardsForSet(code);
      if (cards.length === 0) {
        setConfirmError("Nessuna carta trovata per questo set su Scryfall.");
        return;
      }
      const lines = checklistLinesFromScryfallCards(cards);
      const entry: UserSetEntry = {
        id: crypto.randomUUID(),
        scryfallCode: code,
        name: selected.name,
        code: selected.code.toUpperCase(),
        lines,
        createdAt: new Date().toISOString(),
      };
      onCreated(entry);
      onClose();
    } catch (e: unknown) {
      setConfirmError(e instanceof Error ? e.message : "Impossibile creare il set.");
    } finally {
      setConfirmBusy(false);
    }
  }, [selected, confirmBusy, onCreated, onClose]);

  if (!open) return null;

  const listBusy = useSearch ? loadSearch : loadRecent;
  const listErr = useSearch ? searchError : recentError;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex animate-modal-backdrop items-center justify-center bg-[rgb(0_0_0/0.82)] p-4 backdrop-blur-[2px] motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-set-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="flex max-h-[min(90vh,40rem)] w-full max-w-lg animate-modal-panel flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_24px_80px_rgb(0_0_0/0.55)] motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="new-set-title" className="font-display text-base font-semibold text-fg">
              Nuovo set da Scryfall
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Ultimi due anni in elenco; cerca per nome o codice (min. 2 caratteri). Scegli un set
              dall’elenco per collegare automaticamente le carte.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-surface-2/90 px-2.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Chiudi
          </button>
        </div>

        <div className="shrink-0 border-b border-border/80 px-4 py-3">
          <label className="block text-xs font-medium text-muted">
            Cerca set
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome o codice (es. dsk, foundations)…"
              autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-fg outline-none ring-accent/0 placeholder:text-muted/70 focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {listBusy ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              {useSearch ? "Ricerca su Scryfall…" : "Caricamento set recenti…"}
            </p>
          ) : listErr ? (
            <p className="px-2 py-4 text-center text-sm text-amber-200/95" role="alert">
              {listErr}
            </p>
          ) : visibleList.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              {existingScryfallCodes.size > 0 && recent.length > 0
                ? "Nessun set disponibile: potrebbero essere già tutti in elenco, oppure prova un’altra ricerca."
                : "Nessun set da mostrare."}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Set Scryfall">
              {visibleList.map((s) => {
                const active = selected?.id === s.id;
                return (
                  <li key={s.id} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelected(s)}
                      className={[
                        "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        active
                          ? "border-accent/40 bg-accent/[0.08] text-fg"
                          : "border-transparent bg-transparent text-fg/90 hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <span className="font-medium leading-snug">{s.name}</span>
                      <span className="font-mono text-xs text-muted">
                        {s.code.toUpperCase()}
                        {s.released_at ? (
                          <span className="text-muted/80"> · {s.released_at}</span>
                        ) : null}
                        <span className="text-muted/70"> · {s.set_type}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3">
          {confirmError ? (
            <p className="mb-2 text-sm text-amber-200/95" role="alert">
              {confirmError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface-2/80 px-3 py-2 text-sm font-medium text-fg/90 hover:bg-surface-2"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={!selected || confirmBusy}
              onClick={() => void onConfirm()}
              className="rounded-lg border border-accent/35 bg-accent/20 px-3 py-2 text-sm font-semibold text-fg hover:bg-accent/28 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {confirmBusy ? "Creazione…" : "Aggiungi set"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
