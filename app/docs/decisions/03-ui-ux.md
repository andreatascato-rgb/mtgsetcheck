# UI / UX — principi (non implementazione)

## Decisioni di prodotto

1. **Look**: interfaccia **dark-first** (leggibilità lunghe sessioni, coerenza con galleria carte); tema chiaro eventualmente in seconda fase.
2. **Struttura**: navigazione tipo **app** (sidebar / elenco set → griglia carte → dettaglio), non pagina web “a tutta larghezza senza gerarchia”.
3. **Performance percepita**: griglia con molte carte deve usare **virtualizzazione** (solo ciò che è in vista); immagini con **lazy load** e **cache su disco**.
4. **Feedback**: stati di caricamento ed errore chiari; micro-animazioni **brevi** e coerenti (niente effetti invadenti).
5. **Densità**: bilanciare “bella” e “uso pratico”; preferenza per **leggibilità** e target click/touch generosi dove serve.
6. **Checklist per set**: stessi filtri e ricerca per **Griglia** (virtualizzata) e **Tabella**; in tabella elenco compatto con header sticky, colonne allineate (`checklistLayout.ts`), possesso e foil modificabili da riga o da dialog carta; nel **dialog carta** anche scorciatoie **C** / **F** / **T** (rispettivamente collezione, foil, altra faccia se presente) e **Esc** per chiudere; riepilogo in header (**Carte**, mancanti, possedute, foil; barre Completamento / Foil con token dedicati in `index.css`, vedi `best-practice/10-palette-accents-cards.md`).

## Fuori scope per ora

- Onboarding animato, tutorial in-app, account cloud.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: principi dark-first, virtualizzazione, cache immagini. |
| 2026-03-30 | Checklist set: **griglia** e **tabella** virtualizzate (toggle); tabella in `VirtualizedChecklistTable`, linee guida in `app/docs/best-practice/09-data-tables.md`. |
| 2026-03-30 | Rimossa l’implementazione della tabella (`VirtualizedChecklistTable`) per rifarla da zero; linee guida in `09-data-tables.md`. |
| 2026-03-30 | Ripristinato il toggle **Griglia / Tabella**; in vista tabella messaggio placeholder finché non c’è il nuovo componente. |
| 2026-03-30 | Vista tabella implementata in `SetWorkspace.tsx` (scroll condiviso con la griglia, ARIA `role="table"`), costanti in `checklistLayout.ts`; foil/possesso da collezione locale; statistiche foil in header. Vedi punto 6 nelle decisioni sopra. |
| 2026-03-30 | Dialog carta (`CardDetailModal` in `SetWorkspace.tsx`): scorciatoie **C** / **F** / **T** e **Esc**; integrato nel punto 6. |
