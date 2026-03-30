import { Library, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChecklistLine } from "../../data/checklistTypes";
import { SET_ALREADY_IN_LIST_IT } from "../../constants/storageMessages";
import {
  checklistLinesFromScryfallCards,
  fetchAllCardsForSet,
} from "../../data/scryfallApi";
import { invalidateScryfallSetCache } from "../../hooks/useScryfallSetImages";
import { useUserSets, type UserSetEntry } from "../../hooks/useUserSets";
import { SetWorkspace } from "../set-workspace/SetWorkspace";
import { NewSetModal } from "./NewSetModal";

/** Voce set (sidebar). */
type AppSet = {
  id: string;
  label: string;
  code: string;
  scryfallCode?: string;
};

const EMPTY_CHECKLIST: readonly ChecklistLine[] = [];

export type AppShellProps = {
  onStorageError?: (message: string) => void;
};

export function AppShell({ onStorageError }: AppShellProps) {
  const { userSets, addUserSet, updateUserSetLines, removeUserSet } = useUserSets({
    onPersistError: onStorageError,
  });
  const [activeSetId, setActiveSetId] = useState("");
  const [newSetOpen, setNewSetOpen] = useState(false);

  const sidebarSets = useMemo((): AppSet[] => {
    return userSets.map((u) => ({
      id: u.id,
      label: u.name,
      code: u.code,
      scryfallCode: u.scryfallCode,
    }));
  }, [userSets]);

  useEffect(() => {
    if (sidebarSets.length === 0) {
      setActiveSetId("");
      return;
    }
    if (!activeSetId || !sidebarSets.some((s) => s.id === activeSetId)) {
      setActiveSetId(sidebarSets[0].id);
    }
  }, [sidebarSets, activeSetId]);

  const activeLines = useMemo((): readonly ChecklistLine[] => {
    const u = userSets.find((s) => s.id === activeSetId);
    return u?.lines ?? EMPTY_CHECKLIST;
  }, [activeSetId, userSets]);

  const activeSet = useMemo(() => {
    return sidebarSets.find((s) => s.id === activeSetId) ?? null;
  }, [sidebarSets, activeSetId]);

  const existingScryfallCodes = useMemo(() => {
    const s = new Set<string>();
    for (const u of userSets) {
      s.add(u.scryfallCode.toLowerCase());
    }
    return s;
  }, [userSets]);

  const onUserSetCreated = useCallback(
    (entry: UserSetEntry) => {
      const ok = addUserSet(entry);
      if (ok) {
        setActiveSetId(entry.id);
      } else {
        onStorageError?.(SET_ALREADY_IN_LIST_IT);
      }
    },
    [addUserSet, onStorageError],
  );

  const activeIsUserSet = useMemo(
    () => userSets.some((u) => u.id === activeSetId),
    [userSets, activeSetId],
  );

  const refreshChecklistFromScryfall = useCallback(async () => {
    const id = activeSetId;
    const u = userSets.find((x) => x.id === id);
    if (!u) return;
    invalidateScryfallSetCache(u.scryfallCode);
    const cards = await fetchAllCardsForSet(u.scryfallCode);
    const lines = checklistLinesFromScryfallCards(cards);
    updateUserSetLines(id, lines);
  }, [activeSetId, userSets, updateUserSetLines]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-0 text-fg">
      <header className="flex h-app-header shrink-0 items-center gap-cluster border-b border-border px-layout-x">
        <img
          src="/logos/mtg.png"
          alt=""
          className="h-6 w-auto max-w-[6.5rem] shrink-0 object-contain object-left sm:h-7 sm:max-w-[7.5rem]"
          aria-hidden
        />
        <div className="flex min-w-0 items-baseline gap-cluster">
          <span className="font-display text-base font-semibold tracking-tight text-fg">
            SetCheck
          </span>
          <span className="text-sm text-muted">collezione</span>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <aside
          className="flex min-h-0 w-sidebar shrink-0 flex-col border-r border-border bg-[linear-gradient(180deg,rgb(17_17_20)_0%,rgb(13_13_15)_100%)] shadow-[inset_-1px_0_0_rgb(255_255_255_/0.04)]"
          aria-label="Navigazione set"
        >
          <div className="shrink-0 border-b border-white/[0.06] px-sidebar pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Set
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/[0.08] bg-surface-2/80 px-1.5 font-mono text-[11px] font-medium tabular-nums leading-none text-muted"
                  aria-label={`${sidebarSets.length} set`}
                >
                  {sidebarSets.length}
                </span>
                <button
                  type="button"
                  onClick={() => setNewSetOpen(true)}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/[0.12] p-0 text-accent hover:bg-accent/[0.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(13_13_15)]"
                  title="Nuovo set da Scryfall"
                  aria-label="Aggiungi nuovo set da Scryfall"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-sidebar pb-sidebar pt-3">
            <nav aria-label="Elenco set">
              {sidebarSets.length === 0 ? (
                <p className="px-1 text-xs leading-relaxed text-muted">
                  Nessun set. Usa + per aggiungerne uno da Scryfall.
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {sidebarSets.map((s) => {
                    const active = s.id === activeSetId;
                    return (
                      <li key={s.id} className="group flex items-center gap-1">
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() => setActiveSetId(s.id)}
                          className={[
                            "flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border-l-[3px] py-3 pl-[calc(0.75rem-1px)] pr-3 text-left outline-none transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
                            active
                              ? "border-l-accent bg-gradient-to-r from-accent/[0.09] to-transparent text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255_/0.05)]"
                              : "border-l-transparent text-fg/88 hover:border-l-white/[0.08] hover:bg-white/[0.04] hover:text-fg",
                            "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(13_13_15)]",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "min-w-0 truncate text-sm leading-snug tracking-tight",
                              active ? "font-semibold text-fg" : "font-medium text-fg/95",
                            ].join(" ")}
                          >
                            {s.label}
                          </span>
                          <span
                            className={[
                              "font-mono text-xs tabular-nums tracking-wide",
                              active
                                ? "font-medium text-accent/85"
                                : "text-muted group-hover:text-muted/90",
                            ].join(" ")}
                          >
                            {s.code}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Rimuovere “${s.label}” dall’elenco? I dati della collezione per questo set verranno eliminati da questo dispositivo.`,
                              )
                            ) {
                              removeUserSet(s.id);
                              if (activeSetId === s.id) {
                                setActiveSetId("");
                              }
                            }
                          }}
                          className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-surface-2/80 px-2 py-1.5 text-muted opacity-100 transition-[opacity,background-color,color,border-color] hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          aria-label={`Rimuovi set ${s.label}`}
                          title="Rimuovi set"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </div>
        </aside>

        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-0 p-page"
          aria-label="Contenuto"
        >
          {activeSet ? (
            <SetWorkspace
              setId={activeSet.id}
              label={activeSet.label}
              code={activeSet.code}
              scryfallSetCode={activeSet.scryfallCode ?? null}
              lines={activeLines}
              onRefreshChecklistFromScryfall={
                activeIsUserSet ? refreshChecklistFromScryfall : undefined
              }
              onStorageError={onStorageError}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-1/35 px-6 py-16 text-center">
              <Library className="mb-4 h-16 w-16 text-accent/20" aria-hidden />
              <p className="font-display text-lg font-semibold text-fg">Nessun set in elenco</p>
              <p className="mt-2 max-w-md text-sm text-muted">
                Aggiungi Marvel&apos;s Spider-Man (o qualsiasi set) scegliendolo dal catalogo Scryfall:
                stesso flusso per tutti.
              </p>
              <button
                type="button"
                onClick={() => setNewSetOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/15 px-4 py-2.5 text-sm font-semibold text-fg hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Aggiungi set da Scryfall
              </button>
            </div>
          )}
        </main>
      </div>

      <NewSetModal
        open={newSetOpen}
        onClose={() => setNewSetOpen(false)}
        onCreated={onUserSetCreated}
        existingScryfallCodes={existingScryfallCodes}
      />
    </div>
  );
}
