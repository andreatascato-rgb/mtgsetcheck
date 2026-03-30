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
  FlipHorizontal,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  List as ListIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { CARD_DIMMED_OVERLAY_OPACITY } from "../../constants/cardUi";
import {
  MANA_FILTER_ORDER,
  matchesManaColorFilter,
  type ManaFilterKey,
} from "../../data/manaColorFilter";
import type { ChecklistLine } from "../../data/checklistTypes";
import type { CardFaceImageUrls } from "../../data/scryfallApi";
import { useToast } from "../../contexts/ToastContext";
import { useCollectionState } from "../../hooks/useCollectionState";
import { useContainerWidth } from "../../hooks/useContainerWidth";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useScryfallSetImages } from "../../hooks/useScryfallSetImages";
import {
  CHECKLIST_TABLE_ART_COL_CLASS,
  CHECKLIST_TABLE_ART_THUMB_WRAP_CLASS,
  CHECKLIST_TABLE_FOIL_COL_CLASS,
  CHECKLIST_TABLE_NAME_COL_CLASS,
  CHECKLIST_TABLE_NUM_COL_CLASS,
  CHECKLIST_TABLE_OWNED_COL_CLASS,
  CHECKLIST_TABLE_ROW_EDGE_INSET,
} from "./checklistLayout";
import { VirtualizedChecklistGrid } from "./VirtualizedChecklistGrid";

type FilterMode = "all" | "owned" | "missing";
type ViewMode = "grid" | "table";

const MANA_FILTER_TITLE: Record<ManaFilterKey, string> = {
  W: "Filtra bianco",
  U: "Filtra blu",
  B: "Filtra nero",
  R: "Filtra rosso",
  G: "Filtra verde",
  C: "Filtra incolore",
};

const MANA_FILTER_TOGGLE_CLASS: Record<
  ManaFilterKey,
  { on: string; off: string }
> = {
  W: {
    on: "border-zinc-300/50 bg-zinc-100 text-zinc-900 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
  U: {
    on: "border-sky-400/60 bg-sky-500 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
  B: {
    on: "border-violet-400/50 bg-violet-600 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.15)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
  R: {
    on: "border-red-400/50 bg-red-600 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.15)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
  G: {
    on: "border-emerald-400/50 bg-emerald-600 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.15)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
  C: {
    on: "border-zinc-500/60 bg-zinc-600 text-zinc-100 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)]",
    off: "border-border/60 bg-surface-2/70 text-muted hover:bg-white/[0.06] hover:text-fg/90",
  },
};

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

function ChecklistTableArtThumb({
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
      className="relative aspect-[63/88] w-full overflow-hidden rounded border border-border/60 bg-[linear-gradient(160deg,rgb(22_26_36)_0%,rgb(12_14_22)_100%)]"
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
    foilByNumber,
    setFoil,
    counts,
    exportJson,
    importFromJson,
    exportChecklistText,
    importFromChecklistText,
  } = useCollectionState(setId, lines, { onPersistError: onStorageError });
  const {
    loading: scryfallLoading,
    error: scryfallError,
    getImages,
    getFaceImages,
  } = useScryfallSetImages(scryfallSetCode, lines);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<Set<ManaFilterKey>>(
    () => new Set(),
  );
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
      if (!matchesManaColorFilter(l, colorFilter)) return false;
      if (q) {
        const hit =
          l.name.toLowerCase().includes(q) || String(l.collectorNumber).includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [lines, ownedByNumber, filter, query, colorFilter]);

  const colorFilterActive = colorFilter.size > 0;
  const linesWithoutManaColorCount = useMemo(
    () => lines.filter((l) => l.manaColors === undefined).length,
    [lines],
  );
  const showManaColorFilterHint =
    colorFilterActive && linesWithoutManaColorCount > 0;

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
  const foilPct =
    counts.total === 0 ? 0 : Math.round((counts.foil / counts.total) * 100);

  const detailOwned = detailLine
    ? (ownedByNumber[detailLine.collectorNumber] ?? false)
    : false;
  const detailFoil = detailLine
    ? (foilByNumber[detailLine.collectorNumber] ?? false)
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
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="group"
          aria-label="Riepilogo collezione"
        >
          <StatCard label="Carte" value={counts.total} />
          <StatCard label="Mancanti" value={counts.missing} />
          <StatCard label="Possedute" value={counts.owned} accent />
          <StatCard label="Foil" value={counts.foil} foil />
        </div>

        <div
          className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:gap-6"
          role="group"
          aria-label="Completamento e foil"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
              <span>Completamento</span>
              <span className="font-mono tabular-nums text-fg/90">
                {pct}% ({counts.owned}/{counts.total})
              </span>
            </div>
            <div
              className="app-progress-track h-1.5 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Completamento collezione ${pct} percento`}
            >
              <div
                className="bg-accent-progress-fill h-full min-w-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
              <span>Foil</span>
              <span className="font-mono tabular-nums text-fg/90">
                {foilPct}% ({counts.foil}/{counts.total})
              </span>
            </div>
            <div
              className="app-progress-track h-1.5 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={foilPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Foil ${foilPct} percento`}
            >
              <div
                className="bg-foil-progress-fill h-full min-w-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${foilPct}%` }}
              />
            </div>
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
                pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
                label="Tabella"
                icon={<ListIcon className="h-3.5 w-3.5 opacity-90" aria-hidden />}
              />
            </div>

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
            <span
              className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/70 sm:block"
              aria-hidden
            />
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
            <span
              className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/70 sm:block"
              aria-hidden
            />
            <div
              className="flex flex-wrap items-center gap-1"
              role="group"
              aria-label="Filtra per colori mana"
            >
              {MANA_FILTER_ORDER.map((k) => {
                const pressed = colorFilter.has(k);
                const st = MANA_FILTER_TOGGLE_CLASS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={pressed}
                    title={MANA_FILTER_TITLE[k]}
                    onClick={() => {
                      setColorFilter((prev) => {
                        const next = new Set(prev);
                        if (next.has(k)) next.delete(k);
                        else next.add(k);
                        return next;
                      });
                    }}
                    className={[
                      "flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border px-1.5 font-mono text-[11px] font-bold tabular-nums transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                      pressed ? st.on : st.off,
                    ].join(" ")}
                  >
                    {k}
                  </button>
                );
              })}
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

        {showManaColorFilterHint ? (
          <p
            className="text-xs leading-relaxed text-amber-200/90"
            role="status"
            aria-live="polite"
          >
            {onRefreshChecklistFromScryfall ? (
              <>
                Filtro colore attivo:{" "}
                <span className="font-mono tabular-nums">{linesWithoutManaColorCount}</span>{" "}
                varianti senza metadati colore (checklist testo o dati non aggiornati). Usa{" "}
                <span className="font-medium text-fg/90">Aggiorna da Scryfall</span> per
                allineare.
              </>
            ) : (
              <>
                Filtro colore attivo:{" "}
                <span className="font-mono tabular-nums">{linesWithoutManaColorCount}</span>{" "}
                varianti senza dati colore — questo set non è collegato a Scryfall per il
                refresh checklist.
              </>
            )}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-1/35">
          <div
            ref={checklistScrollRef}
            className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 pt-0 sm:px-3 sm:pb-3"
          >
            <div className="pt-2 sm:pt-3">
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
              ) : visibleRows.length === 0 ? null : (
                <div
                  role="table"
                  aria-label="Checklist tabellare"
                  aria-colcount={5}
                  aria-rowcount={visibleRows.length + 1}
                  className="w-full min-w-0 text-left text-sm"
                >
                  <div
                    role="rowgroup"
                    className="sticky top-0 z-10 border-b border-border bg-surface-2/95 shadow-[0_1px_0_0_rgb(0_0_0/0.2)]"
                  >
                    <div
                      role="row"
                      aria-rowindex={1}
                      className={[
                        "flex items-stretch gap-3 py-2.5 sm:py-3",
                        CHECKLIST_TABLE_ROW_EDGE_INSET,
                      ].join(" ")}
                    >
                      <div
                        role="columnheader"
                        className={[
                          "flex min-h-0 items-center justify-center",
                          CHECKLIST_TABLE_ART_COL_CLASS,
                        ].join(" ")}
                      >
                        <span className="sr-only">Anteprima carta</span>
                        <ImageIcon
                          className="h-[1.125rem] w-[1.125rem] text-muted"
                          aria-hidden
                          strokeWidth={2}
                        />
                      </div>
                      <div
                        role="columnheader"
                        className={[
                          "flex min-h-0 items-center justify-center text-xs font-semibold tabular-nums tracking-wide text-muted",
                          CHECKLIST_TABLE_NUM_COL_CLASS,
                        ].join(" ")}
                      >
                        N°
                      </div>
                      <div
                        role="columnheader"
                        className={[
                          "flex min-h-0 items-center justify-start text-left text-xs font-semibold text-muted",
                          CHECKLIST_TABLE_NAME_COL_CLASS,
                        ].join(" ")}
                      >
                        Nome
                      </div>
                      <div
                        role="columnheader"
                        className={[
                          "flex min-h-0 items-center justify-center text-xs font-semibold text-muted",
                          CHECKLIST_TABLE_FOIL_COL_CLASS,
                        ].join(" ")}
                      >
                        Foil
                      </div>
                      <div
                        role="columnheader"
                        className={[
                          "flex min-h-0 items-center justify-center text-xs font-semibold text-muted",
                          CHECKLIST_TABLE_OWNED_COL_CLASS,
                        ].join(" ")}
                      >
                        Posseduta
                      </div>
                    </div>
                  </div>
                  <div role="rowgroup">
                    {visibleRows.map((line, rowIndex) => {
                      const owned = ownedByNumber[line.collectorNumber] ?? false;
                      const thumbUrl = getImages(line).grid;
                      const foilLabel = foilByNumber[line.collectorNumber]
                        ? "Sì"
                        : "No";
                      const dataRowIndex = rowIndex + 2;
                      return (
                        <div
                          key={`${line.collectorNumber}::${line.name}`}
                          role="row"
                          aria-rowindex={dataRowIndex}
                          className={[
                            "flex items-stretch gap-3 border-b border-border/80 py-2.5 sm:py-3",
                            CHECKLIST_TABLE_ROW_EDGE_INSET,
                            "cursor-pointer hover:bg-surface-2/55",
                          ].join(" ")}
                          onClick={(e) => {
                            const t = e.target as HTMLElement;
                            if (t.closest("input, label, button, a")) return;
                            clearHover();
                            setDetailLine(line);
                          }}
                        >
                          <div
                            role="cell"
                            className={[
                              "flex min-h-0 items-center justify-center",
                              CHECKLIST_TABLE_ART_COL_CLASS,
                            ].join(" ")}
                          >
                            <div className={CHECKLIST_TABLE_ART_THUMB_WRAP_CLASS}>
                              <ChecklistTableArtThumb imageUrl={thumbUrl} owned={owned} />
                            </div>
                          </div>
                          <div
                            role="cell"
                            className={[
                              "flex min-h-0 items-center justify-center text-xs font-medium tabular-nums text-fg/85",
                              CHECKLIST_TABLE_NUM_COL_CLASS,
                            ].join(" ")}
                          >
                            {line.collectorNumber}
                          </div>
                          <div
                            role="cell"
                            className={[
                              "flex min-h-0 min-w-0 items-center justify-start text-left text-sm leading-snug text-fg/90",
                              CHECKLIST_TABLE_NAME_COL_CLASS,
                            ].join(" ")}
                          >
                            <span className="block min-w-0 truncate" title={line.name}>
                              {line.name}
                            </span>
                          </div>
                          <div
                            role="cell"
                            className={[
                              "flex min-h-0 items-center justify-center text-xs tabular-nums text-fg/85",
                              CHECKLIST_TABLE_FOIL_COL_CLASS,
                            ].join(" ")}
                          >
                            {foilLabel}
                          </div>
                          <div
                            role="cell"
                            className={[
                              "flex min-h-0 items-center justify-center",
                              CHECKLIST_TABLE_OWNED_COL_CLASS,
                            ].join(" ")}
                          >
                            <label
                              className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 hover:bg-white/[0.06]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">
                                Posseduta: {line.name} ({line.collectorNumber})
                              </span>
                              <input
                                type="checkbox"
                                checked={owned}
                                onChange={(e) =>
                                  setOwned(line.collectorNumber, e.target.checked)
                                }
                                className="h-4 w-4 rounded border border-border-strong bg-surface-2 outline-none ring-0 accent-accent focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
          faceImages={getFaceImages(detailLine)}
          owned={detailOwned}
          foil={detailFoil}
          dimmed={!detailOwned}
          onClose={() => setDetailLine(null)}
          onToggleOwned={(next) => {
            setOwned(detailLine.collectorNumber, next);
          }}
          onToggleFoil={(next) => {
            setFoil(detailLine.collectorNumber, next);
          }}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  foil,
}: {
  label: string;
  value: number;
  accent?: boolean;
  foil?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={[
          "mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight",
          foil
            ? "text-gradient-foil"
            : accent
              ? "text-gradient-accent-card"
              : "text-fg",
        ].join(" ")}
      >
        {value}
      </p>
    </>
  );

  if (foil) {
    return (
      <div className="bg-foil-card-shell">
        <div className="rounded-[calc(0.75rem-1px)] bg-surface-1/95 px-4 py-3">
          {body}
        </div>
      </div>
    );
  }

  if (accent) {
    return (
      <div className="bg-accent-card-shell">
        <div className="rounded-[calc(0.75rem-1px)] bg-surface-1/95 px-4 py-3">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1/50 px-4 py-3">{body}</div>
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
  faceImages,
  owned,
  foil,
  dimmed,
  onClose,
  onToggleOwned,
  onToggleFoil,
}: {
  line: ChecklistLine;
  imageUrl: string | null;
  faceImages: CardFaceImageUrls[];
  owned: boolean;
  foil: boolean;
  dimmed?: boolean;
  onClose: () => void;
  onToggleOwned: (owned: boolean) => void;
  onToggleFoil: (foil: boolean) => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const trapRef = useRef<HTMLDivElement>(null);
  const [faceIndex, setFaceIndex] = useState(0);
  useFocusTrap(true, trapRef);

  const faces =
    faceImages.length > 0
      ? faceImages
      : imageUrl
        ? [{ label: line.name, grid: null as string | null, large: imageUrl }]
        : [];
  const displayUrl = faces[faceIndex]?.large ?? imageUrl;
  const multifaced = faces.length > 1;

  useEffect(() => {
    setFaceIndex(0);
  }, [line.collectorNumber, line.name]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const rawTarget = e.target;
      if (rawTarget instanceof HTMLTextAreaElement) return;
      if (rawTarget instanceof HTMLInputElement) {
        const textLike = new Set([
          "text",
          "search",
          "url",
          "email",
          "password",
          "number",
          "tel",
        ]);
        if (textLike.has(rawTarget.type)) return;
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === "c") {
        e.preventDefault();
        onToggleOwned(!owned);
        return;
      }
      if (key === "f") {
        e.preventDefault();
        onToggleFoil(!foil);
        return;
      }
      if (key === "t" && multifaced && faces.length > 1) {
        e.preventDefault();
        setFaceIndex((i) => (i + 1) % faces.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    faces.length,
    foil,
    multifaced,
    onClose,
    onToggleFoil,
    onToggleOwned,
    owned,
  ]);

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
        <div className="absolute -right-1 -top-10 flex items-center gap-1.5">
          {multifaced ? (
            <button
              type="button"
              onClick={() => setFaceIndex((i) => (i + 1) % faces.length)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-surface-2/90 px-2.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
              aria-label={`Altra faccia: ${faces[(faceIndex + 1) % faces.length]?.label ?? ""}`}
              title="Altra faccia"
            >
              <FlipHorizontal className="h-3.5 w-3.5" aria-hidden />
              Altra faccia
            </button>
          ) : null}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-surface-2/90 px-2.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Chiudi
          </button>
        </div>
        <div className="overflow-visible bg-transparent">
          <div className="shadow-card-float aspect-[63/88] w-full overflow-hidden rounded-[3.5%]">
            <CardFace line={line} imageUrl={displayUrl} dimmed={dimmed} className="h-full" />
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
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={foil}
                onChange={(e) => onToggleFoil(e.target.checked)}
                className="h-4 w-4 rounded border border-border-strong bg-surface-2 outline-none ring-0 accent-accent focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(6_8_14)]"
              />
              <span className="text-sm text-fg/90">Foil</span>
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
