# Dati: set, collezione, immagini

## Decisioni

1. **Set di riferimento nel repo**: cartella **`set/spm/`** (checklist completa + lista mancanti), come sorgente iniziale per un set. Altri set andranno in **`set/<codice>/`** allo stesso modo.
2. **Formato attuale**: file testo (`spm_all_variants_checklist.txt`, `spm_missing_all.txt`) con convenzione `[x]` / `[ ]` e numero collezione; l’app importerà o convertrà in un formato interno **in una fase successiva** (non definito in questo file).
3. **Metadati e immagini carte**: **API Scryfall** come fonte esterna per nomi allineati al gioco e **URI immagini** (preferenza **PNG alta risoluzione** quando disponibile). Rispetto di policy e rate limit Scryfall.
4. **Cache immagini**: salvataggio locale (percorso sotto cartella dati app / profilo utente) per evitare ridownload e accelerare avvii successivi.
5. **Filtro colori mana (checklist)** — una sola pipeline di derivazione, persistita in `ChecklistLine.manaColors` (array W/U/B/R/G o `[]` incolore; `undefined` = mai calcolato da Scryfall per quella riga):
   - Ordine: unione `colors` (root + `card_faces`), poi simboli colorati estratti da `mana_cost` (root + facce), infine — solo se ancora vuoto — `color_identity` (terre / casi senza pip nel costo; vedi [Colors](https://scryfall.com/docs/api/colors)).
   - Filtro UI: OR sui toggle; righe senza `manaColors` non partecipano al filtro finché non si rigenera la checklist da Scryfall (**Aggiorna da Scryfall**).
6. **Collezione utente (possesso e foil)** — stato per **numero collezione** in `localStorage`, non nel file testo del set:
   - **Possesso**: chiave `mtgsetcheck.v1.collection.<setId>` — oggetto `{ [collectorNumber]: boolean }`, allineato alle righe checklist (merge con default da `[x]`/`[ ]` nel file).
   - **Foil** (inteso come “segnato foil in collezione”): chiave separata `mtgsetcheck.v1.collection.foil.<setId>` — stesso schema booleano; default `false` se assente.
   - **Export JSON** (`v: 1`): include `owned` e `foil`; import senza campo `foil` tratta tutte le righe come non-foil finché l’utente non aggiorna.
   - Vista **tabella** e **statistiche** header: la colonna Foil e i conteggi foil si basano solo su questo stato locale, non sul campo `foil` della carta Scryfall.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: `set/spm`, testo checklist, Scryfall + cache locale. |
| 2026-03-30 | Policy unica `manaColors` + filtro; documentazione allineata. |
| 2026-03-30 | Possesso + foil persistiti (`useCollectionState`), export/import JSON con `foil`. |
