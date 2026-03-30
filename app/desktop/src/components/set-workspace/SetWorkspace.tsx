import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  FileDown,
  FileJson,
  FileText,
  Layers,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { CARD_DIMMED_OVERLAY_OPACITY } from "../../constants/cardUi";
import type { ChecklistLine } from "../../data/checklistTypes";
import { useToast } from "../../contexts/ToastContext";
import { useCollectionState } from "../../hooks/useCollectionState";
import { useContainerWidth } from "../../hooks/useContainerWidth";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useScryfallSetImages } from "../../hooks/useScryfallSetImages";
import { VirtualizedChecklistGrid } from "./VirtualizedChecklistGrid";
import { VirtualizedChecklistList } from "./VirtualizedChecklistList";

type FilterMode = "all" | "owned" | "missing";
type ViewMode = "grid" | "list";

export type SetWorkspaceProps = {
  setId: string;
  label: string;
  code: string;
  /** Codice set Scryfall (es. `spm`) per caricare illustrazioni; `null` se non disponibile. */
  scryfallSetCode: string | null;
  lines: readonly ChecklistLine[];
  /** Solo set creati da Scryfall: rigenera checklist da API e aggiorna persistenza. */
  onRefreshChecklistFromScryfall?: () => Promise<void>;
  /** Errore salvataggio collezione (localStorage). */
  onStorageError?: (message: string) => void;
};

export function SetWorkspace({
  setId,
  label,
  code,
  scryfallSetCode,
  lines,
  onRefreshChecklistFromScryfall,
  onStorageError,
}: SetWorkspaceProps) {
  const {
    ownedByNumber,
    setOwned,
    counts,
    exportJson,
    importFromJson,
    exportChecklistText,
    importFromChecklistText,
  } = useCollectionState(setId, lines, { onPersistError: onStorageError });
  const { loading: scryfallLoading, error: scryfallError, getImages } =
    useScryfallSetImages(scryfallSetCode, lines);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hoverPreview, setHoverPreview] = useState<{
    line: ChecklistLine;
    x: number;
    y: number;
  } | null>(null);
  const [detailLine, setDetailLine] = useState<ChecklistLine | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const { showToast } = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);
  const importChecklistTxtRef = useRef<HTMLInputElement>(null);
  const importExportWrapRef = useRef<HTMLDivElement>(null);
  const checklistScrollRef = useRef<HTMLDivElement>(null);
  const checklistWidth = useContainerWidth(checklistScrollRef);
  const [importExportMenuOpen, setImportExportMenuOpen] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!importExportMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (importExportWrapRef.current?.contains(e.target as Node)) return;
      setImportExportMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [importExportMenuOpen]);

  useEffect(() => {
    if (!importExportMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImportExportMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [importExportMenuOpen]);

  const onExportCollection = useCallback(() => {
    const blob = new Blob([exportJson()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mtgsetcheck-${setId}-collection.json`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
    showToast({ kind: "ok", message: "File collezione scaricato." });
  }, [exportJson, setId, showToast]);

  const onRefreshChecklist = useCallback(async () => {
    if (!onRefreshChecklistFromScryfall || refreshBusy) return;
    setRefreshBusy(true);
    try {
      await onRefreshChecklistFromScryfall();
      showToast({ kind: "ok", message: "Checklist aggiornata da Scryfall." });
    } catch (e: unknown) {
      showToast({
        kind: "err",
        message: e instanceof Error ? e.message : "Aggiornamento checklist fallito.",
      });
    } finally {
      setRefreshBusy(false);
    }
  }, [onRefreshChecklistFromScryfall, refreshBusy, showToast]);

  const onImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const r = importFromJson(text);
        if (r.ok) {
          showToast({ kind: "ok", message: "Collezione importata." });
        } else {
          showToast({ kind: "err", message: r.error });
        }
      };
      reader.onerror = () => {
        showToast({ kind: "err", message: "Lettura file non riuscita." });
      };
      reader.readAsText(file);
    },
    [importFromJson, showToast],
  );

  const onExportChecklistTxt = useCallback(() => {
    const blob = new Blob([exportChecklistText()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mtgsetcheck-${setId}-checklist.txt`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
    showToast({ kind: "ok", message: "File checklist (.txt) scaricato." });
  }, [exportChecklistText, setId, showToast]);

  const onImportChecklistTxt = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const r = importFromChecklistText(text);
        if (r.ok) {
          showToast({ kind: "ok", message: "Checklist testo importata." });
        } else {
          showToast({ kind: "err", message: r.error });
        }
      };
      reader.onerror = () => {
        showToast({ kind: "err", message: "Lettura file non riuscita." });
      };
      reader.readAsText(file);
    },
    [importFromChecklistText, showToast],
  );

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.filter((l) => {
      const owned = ownedByNumber[l.collectorNumber] ?? false;
      if (filter === "owned" && !owned) return false;
      if (filter === "missing" && owned) return false;
      if (q) {
        const hit =
          l.name.toLowerCase().includes(q) || String(l.collectorNumber).includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [lines, ownedByNumber, filter, query]);

  const updateHover = useCallback((line: ChecklistLine, e: React.PointerEvent) => {
    setHoverPreview({ line, x: e.clientX, y: e.clientY });
  }, []);

  const clearHover = useCallback(() => setHoverPreview(null), []);

  if (lines.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-1/40 px-page py-12 text-center">
        <Layers className="mb-4 h-14 w-14 text-accent/25" aria-hidden />
        <p className="font-display text-base font-semibold text-fg">Nessun dato checklist</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          La checklist per questo set non è ancora collegata. Aggiungi i file in{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg/85">
            set/{code.toLowerCase()}/
          </code>{" "}
          e configura l’import.
        </p>
      </div>
    );
  }

  const pct =
    counts.total === 0 ? 0 : Math.round((counts.owned / counts.total) * 100);

  const detailOwned = detailLine
    ? (ownedByNumber[detailLine.collectorNumber] ?? false)
    : false;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-section overflow-hidden">
      <header className="flex shrink-0 flex-col gap-stack">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-fg sm:text-2xl">
              {label}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">
              Codice set <span className="font-medium text-accent/90">{code}</span>
              {scryfallSetCode ? (
                <span className="text-muted/80">
                  {" "}
                  · illustrazioni{" "}
                  <a
                    href="https://scryfall.com/docs/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent/90 underline decoration-accent/30 underline-offset-2 hover:text-accent-hover"
                  >
                    Scryfall
                  </a>
                </span>
              ) : null}
            </p>
            {scryfallLoading ? (
              <p className="mt-1 text-xs text-muted">Caricamento illustrazioni…</p>
            ) : null}
            {scryfallError ? (
              <p className="mt-1 text-xs text-amber-200/90" role="alert">
                {scryfallError}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="grid gap-3 sm:grid-cols-3"
          role="group"
          aria-label="Riepilogo collezione"
        >
          <StatCard label="Varianti" value={counts.total} />
          <StatCard label="Possedute" value={counts.owned} accent />
          <StatCard label="Mancanti" value={counts.missing} />
        </div>

        <div className="max-w-xl">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
            <span>Completamento</span>
            <span className="font-mono tabular-nums text-fg/90">
              {pct}% ({counts.owned}/{counts.total})
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Completamento collezione ${pct} percento`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <section
        aria-label="Checklist"
        className="flex min-h-0 flex-1 flex-col gap-stack"
      >
        <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-1/60 p-1"
              role="group"
              aria-label="Filtra per stato"
            >
              <FilterBtn
                pressed={filter === "all"}
                onClick={() => setFilter("all")}
                label="Tutte"
              />
              <FilterBtn
                pressed={filter === "owned"}
                onClick={() => setFilter("owned")}
                label="Possedute"
              />
              <FilterBtn
                pressed={filter === "missing"}
                onClick={() => setFilter("missing")}
                label="Mancanti"
              />
            </div>

            <div
              className="flex gap-1 rounded-lg border border-border bg-surface-1/60 p-1"
              role="group"
              aria-label="Vista checklist"
            >
              <FilterBtn
                pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                label="Griglia"
                icon={<LayoutGrid className="h-3.5 w-3.5 opacity-90" aria-hidden />}
              />
              <FilterBtn
                pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                label="Lista"
                icon={<ListIcon className="h-3.5 w-3.5 opacity-90" aria-hidden />}
              />
            </div>

            <span
              className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/70 sm:block"
              aria-hidden
            />
            {onRefreshChecklistFromScryfall ? (
              <button
                type="button"
                disabled={refreshBusy}
                onClick={() => void onRefreshChecklist()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface-1/50 px-2.5 py-1.5 text-xs font-medium text-fg/90 transition-colors hover:bg-white/[0.06] hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw
                  className={[
                    "h-3.5 w-3.5 shrink-0",
                    refreshBusy ? "animate-spin motion-reduce:animate-none" : "",
                  ].join(" ")}
                  aria-hidden
                />
                {refreshBusy ? "Aggiornamento…" : "Aggiorna da Scryfall"}
              </button>
            ) : null}
            <div className="relative" ref={importExportWrapRef}>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                onChange={onImportFile}
                aria-hidden
              />
              <input
                ref={importChecklistTxtRef}
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                tabIndex={-1}
                onChange={onImportChecklistTxt}
                aria-hidden
              />
              <button
                type="button"
                aria-expanded={importExportMenuOpen}
                aria-haspopup="menu"
                onClick={() => setImportExportMenuOpen((o) => !o)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-[background-color,border-color,box-shadow,color] duration-200 ease-[var(--ease-out-expo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                  importExportMenuOpen
                    ? "border-accent/35 bg-accent/[0.09] text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255_/0.06)]"
                    : "border-border/80 bg-surface-1/50 text-fg/90 hover:border-border-strong hover:bg-white/[0.05] hover:text-fg",
                ].join(" ")}
              >
                <FileDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                Import / Esporta
                <ChevronDown
                  className={[
                    "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ease-[var(--ease-out-expo)]",
                    importExportMenuOpen ? "-rotate-180 text-accent/90" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>
              {importExportMenuOpen ? (
                <ul
                  role="menu"
                  aria-label="Import ed esporta collezione"
                  className="absolute right-0 z-[100] mt-1.5 min-w-[15.5rem] overflow-hidden rounded-xl border border-border bg-surface-1/95 py-2 shadow-[0_16px_48px_rgb(0_0_0/0.55),inset_0_1px_0_0_rgb(255_255_255_/0.04)] ring-1 ring-white/[0.04] backdrop-blur-md motion-reduce:transition-none"
                >
                  <li
                    className="px-3 pb-1 pt-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    role="presentation"
                  >
                    Esporta
                  </li>
                  <li role="none" className="px-1">
                    <button
                      type="button"
                      role="menuitem"
                      title="Backup JSON per questo set (stesso setId)"
                      className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-fg/95 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/35"
                      onClick={() => {
                        onExportCollection();
                        setImportExportMenuOpen(false);
                      }}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/80 bg-surface-2/80 text-accent/90">
                        <FileJson className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        File collezione
                        <span className="mt-0.5 block text-[11px] font-normal text-muted">
                          Backup tecnico
                        </span>
                      </span>
                    </button>
                  </li>
                  <li role="none" className="px-1">
                    <button
                      type="button"
                      role="menuitem"
                      title="Una riga per carta: [x] posseduta, [ ] mancante"
                      className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-fg/95 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/35"
                      onClick={() => {
                        onExportChecklistTxt();
                        setImportExportMenuOpen(false);
                      }}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/80 bg-surface-2/80 text-accent/90">
                        <FileText className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        Checklist testo
                        <span className="mt-0.5 block text-[11px] font-normal text-muted">
                          Modificabile a mano
                        </span>
                      </span>
                    </button>
                  </li>
                  <li className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" role="separator" aria-hidden />
                  <li
                    className="px-3 pb-1 pt-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    role="presentation"
                  >
                    Importa
                  </li>
                  <li role="none" className="px-1">
                    <button
                      type="button"
                      role="menuitem"
                      title="Ripristina da backup JSON"
                      className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-fg/95 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/35"
                      onClick={() => {
                        setImportExportMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/80 bg-surface-2/80 text-accent/90">
                        <FileJson className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        File collezione
                        <span className="mt-0.5 block text-[11px] font-normal text-muted">
                          Stesso setId del backup
                        </span>
                      </span>
                    </button>
                  </li>
                  <li role="none" className="px-1">
                    <button
                      type="button"
                      role="menuitem"
                      title="Aggiorna possedute da checklist testo"
                      className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-fg/95 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/35"
                      onClick={() => {
                        setImportExportMenuOpen(false);
                        importChecklistTxtRef.current?.click();
                      }}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/80 bg-surface-2/80 text-accent/90">
                        <FileText className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        Checklist testo
                        <span className="mt-0.5 block text-[11px] font-normal text-muted">
                          Abbina numero e nome
                        </span>
                      </span>
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>

          <label className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-sm">
            <span className="sr-only">Cerca per nome o numero</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca nome o numero…"
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg outline-none ring-accent/0 transition-[box-shadow,border-color] placeholder:text-muted/80 focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
            />
          </label>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-1/35">
          <div
            ref={checklistScrollRef}
            className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3"
          >
            {viewMode === "grid" ? (
              <VirtualizedChecklistGrid
                scrollRef={checklistScrollRef}
                containerWidth={checklistWidth}
                items={visibleRows}
              >
                {(line) => {
                  const imgs = getImages(line);
                  const owned = ownedByNumber[line.collectorNumber] ?? false;
                  return (
                    <CardTile
                      line={line}
                      imageUrl={imgs.grid}
                      owned={owned}
                      onHoverMove={(e) => updateHover(line, e)}
                      onHoverEnd={clearHover}
                      onOpen={() => {
                        clearHover();
                        setDetailLine(line);
                      }}
                    />
                  );
                }}
              </VirtualizedChecklistGrid>
            ) : (
              <div className="w-full text-left text-sm">
                <div className="sticky top-0 z-[1] grid grid-cols-[3.5rem_4.5rem_minmax(0,1fr)_7rem] border-b border-border/80 bg-surface-0/95 px-3 py-2.5 shadow-[inset_0_-1px_0_rgb(255_255_255_/0.08)] backdrop-blur-sm">
                  <div
                    className="font-mono text-xs font-semibold uppercase tracking-wide text-muted"
                    aria-label="Anteprima carta"
                  />
                  <div className="font-mono text-xs font-semibold uppercase tracking-wide text-muted">
                    N°
                  </div>
                  <div className="min-w-0 font-mono text-xs font-semibold uppercase tracking-wide text-muted">
                    Nome
                  </div>
                  <div className="text-right font-mono text-xs font-semibold uppercase tracking-wide text-muted">
                    Stato
                  </div>
                </div>
                <VirtualizedChecklistList scrollRef={checklistScrollRef} items={visibleRows}>
                  {(line) => {
                    const owned = ownedByNumber[line.collectorNumber] ?? false;
                    const thumbUrl = getImages(line).grid;
                    return (
                      <div
                        className="grid h-full min-h-[60px] grid-cols-[3.5rem_4.5rem_minmax(0,1fr)_7rem] items-center px-3 py-2 transition-colors hover:bg-white/[0.03]"
                        role="row"
                      >
                        <div className="align-middle">
                          <ListRowThumb imageUrl={thumbUrl} owned={owned} />
                        </div>
                        <div className="whitespace-nowrap font-mono tabular-nums text-muted">
                          {line.collectorNumber}
                        </div>
                        <div className="min-w-0 text-fg/95">{line.name}</div>
                        <div className="text-right">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <span className="sr-only">
                              Posseduta: {line.name} ({line.collectorNumber})
                            </span>
                            <input
                              type="checkbox"
                              checked={owned}
                              onChange={(e) =>
                                setOwned(line.collectorNumber, e.target.checked)
                              }
                              className="h-4 w-4 rounded border border-border-strong bg-surface-2 outline-none ring-0 accent-accent focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
                            />
                            <span className="hidden font-mono text-xs text-muted sm:inline">
                              {owned ? "Sì" : "No"}
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  }}
                </VirtualizedChecklistList>
              </div>
            )}
          </div>
          {visibleRows.length === 0 ? (
            <p className="border-t border-border px-4 py-6 text-center text-sm text-muted">
              Nessuna riga con i filtri attuali.
            </p>
          ) : null}
        </div>
      </section>

      {!reduceMotion && hoverPreview ? (
        <CardHoverPreview
          line={hoverPreview.line}
          clientX={hoverPreview.x}
          clientY={hoverPreview.y}
          imageUrl={getImages(hoverPreview.line).large}
          dimmed={
            !(ownedByNumber[hoverPreview.line.collectorNumber] ?? false)
          }
        />
      ) : null}

      {detailLine ? (
        <CardDetailModal
          line={detailLine}
          imageUrl={getImages(detailLine).large}
          owned={detailOwned}
          dimmed={!detailOwned}
          onClose={() => setDetailLine(null)}
          onToggleOwned={(next) => {
            setOwned(detailLine.collectorNumber, next);
          }}
        />
      ) : null}
    </div>
  );
}

/** Miniatura lista: stesso scurimento delle mancanti della griglia. */
function ListRowThumb({
  imageUrl,
  owned,
}: {
  imageUrl: string | null;
  owned: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [imageUrl]);

  const showArt = Boolean(imageUrl && !broken);

  return (
    <div
      className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded border border-border/60 bg-[linear-gradient(160deg,rgb(22_26_36)_0%,rgb(12_14_22)_100%)]"
      aria-hidden
    >
      {showArt ? (
        <img
          src={imageUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(-14deg,rgb(255_255_255)_0_1px,transparent_1px_12px)]" />
      )}
      {!owned ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: `rgb(0 0 0 / ${CARD_DIMMED_OVERLAY_OPACITY})`,
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-3",
        accent
          ? "border-accent/25 bg-accent/[0.06]"
          : "border-border bg-surface-1/50",
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={[
          "mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight",
          accent ? "text-accent" : "text-fg",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function FilterBtn({
  pressed,
  onClick,
  label,
  icon,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        pressed
          ? "bg-accent/20 text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255_/0.06)]"
          : "text-fg/75 hover:bg-white/[0.06] hover:text-fg",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

/** Faccia carta: illustrazione Scryfall se disponibile, altrimenti placeholder Arena-like. */
function CardFace({
  line,
  compact,
  imageUrl,
  dimmed,
  className,
}: {
  line: ChecklistLine;
  compact?: boolean;
  imageUrl: string | null;
  /** Stile Arena: carta non in collezione più scura. */
  dimmed?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [imageUrl]);

  const showArt = Boolean(imageUrl && !broken);

  return (
    <div
      className={[
        "relative h-full w-full overflow-hidden bg-[linear-gradient(160deg,rgb(22_26_36)_0%,rgb(12_14_22)_45%,rgb(18_22_32)_100%)]",
        className,
      ].join(" ")}
    >
      {showArt ? (
        <img
          src={imageUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(-14deg,rgb(255_255_255)_0_1px,transparent_1px_12px)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(255_255_255/0.06),transparent_55%)]" />
        </>
      )}
      {dimmed ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundColor: `rgb(0 0 0 / ${CARD_DIMMED_OVERLAY_OPACITY})`,
          }}
          aria-hidden
        />
      ) : null}
      <span
        className={[
          "absolute rounded font-mono font-semibold tabular-nums text-fg/95 ring-1 ring-black/40",
          dimmed ? "z-[2]" : "z-[1]",
          showArt
            ? "left-1 top-1 bg-black/55 px-1 py-0 text-[9px]"
            : compact
              ? "left-1 top-1 px-1 py-0 text-[9px] text-muted ring-white/10"
              : "left-2 top-2 px-1.5 py-0.5 text-[11px] text-muted ring-white/10",
        ].join(" ")}
      >
        {line.collectorNumber}
      </span>
      {!showArt ? (
        <p
          className={[
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgb(6_8_14)] via-[rgb(6_8_14)/0.88] to-transparent text-center font-medium leading-snug text-fg/92",
            dimmed ? "z-[2]" : "z-[1]",
            dimmed ? "opacity-[0.85]" : "",
            compact ? "px-1 pb-1 pt-5 text-[9px] line-clamp-2" : "px-2 pb-2 pt-8 text-xs line-clamp-3",
          ].join(" ")}
        >
          {line.name}
        </p>
      ) : null}
    </div>
  );
}

function CardHoverPreview({
  line,
  clientX,
  clientY,
  imageUrl,
  dimmed,
}: {
  line: ChecklistLine;
  clientX: number;
  clientY: number;
  imageUrl: string | null;
  dimmed?: boolean;
}) {
  const w = 260;
  const h = (w * 88) / 63;
  const pad = 12;
  const left = Math.max(
    pad,
    Math.min(clientX + pad, typeof window !== "undefined" ? window.innerWidth - w - pad : clientX),
  );
  const top = Math.max(
    pad,
    Math.min(clientY + pad, typeof window !== "undefined" ? window.innerHeight - h - pad - 40 : clientY),
  );

  return createPortal(
    <div
      className="pointer-events-none fixed z-[200]"
      style={{ left, top, width: w }}
      role="presentation"
      aria-hidden
    >
      <div className="shadow-card-float aspect-[63/88] w-full overflow-hidden rounded-[3.5%]">
        <CardFace line={line} imageUrl={imageUrl} dimmed={dimmed} className="h-full" />
      </div>
      <p className="mt-2 px-1 text-center text-xs leading-snug text-fg/85">
        {line.name}
      </p>
    </div>,
    document.body,
  );
}

function CardDetailModal({
  line,
  imageUrl,
  owned,
  dimmed,
  onClose,
  onToggleOwned,
}: {
  line: ChecklistLine;
  imageUrl: string | null;
  owned: boolean;
  dimmed?: boolean;
  onClose: () => void;
  onToggleOwned: (owned: boolean) => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, trapRef);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex animate-modal-backdrop items-center justify-center bg-[rgb(0_0_0/0.78)] p-4 backdrop-blur-[2px] motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-detail-title"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="animate-modal-panel relative w-full max-w-[min(100%,20rem)] motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-10 inline-flex items-center gap-1 rounded-md border border-white/10 bg-surface-2/90 px-2.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Chiudi
        </button>
        <div className="overflow-visible bg-transparent">
          <div className="shadow-card-float aspect-[63/88] w-full overflow-hidden rounded-[3.5%]">
            <CardFace line={line} imageUrl={imageUrl} dimmed={dimmed} className="h-full" />
          </div>
          <div className="mt-4 rounded-lg bg-[rgb(6_8_14)] px-3 py-3">
            <h2
              id="card-detail-title"
              className="font-display text-base font-semibold leading-snug text-fg"
            >
              {line.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted">
              #{line.collectorNumber}
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={owned}
                onChange={(e) => onToggleOwned(e.target.checked)}
                className="h-4 w-4 rounded border border-border-strong bg-surface-2 outline-none ring-0 accent-accent focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(6_8_14)]"
              />
              <span className="text-sm text-fg/90">In collezione</span>
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CardTile({
  line,
  imageUrl,
  owned,
  onHoverMove,
  onHoverEnd,
  onOpen,
}: {
  line: ChecklistLine;
  imageUrl: string | null;
  owned: boolean;
  onHoverMove: (e: React.PointerEvent) => void;
  onHoverEnd: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="min-w-0" role="listitem">
      <article
        className="relative"
        onPointerEnter={(e) => onHoverMove(e)}
        onPointerMove={(e) => onHoverMove(e)}
        onPointerLeave={onHoverEnd}
      >
        <button
          type="button"
          className="relative block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
          onClick={onOpen}
          aria-label={`Apri ${line.name} (n. ${line.collectorNumber})${owned ? ", in collezione" : ", mancante"}`}
        >
          <div className="shadow-card aspect-[63/88] w-full overflow-hidden rounded-[3.5%] transition-shadow duration-200 ease-out hover:shadow-card-hover">
            <CardFace line={line} compact imageUrl={imageUrl} dimmed={!owned} className="h-full" />
          </div>
        </button>
      </article>
    </div>
  );
}
