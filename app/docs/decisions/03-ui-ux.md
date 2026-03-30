# UI / UX — principi (non implementazione)

## Decisioni di prodotto

1. **Look**: interfaccia **dark-first** (leggibilità lunghe sessioni, coerenza con galleria carte); tema chiaro eventualmente in seconda fase.
2. **Struttura**: navigazione tipo **app** (sidebar / elenco set → griglia carte → dettaglio), non pagina web “a tutta larghezza senza gerarchia”.
3. **Performance percepita**: griglia con molte carte deve usare **virtualizzazione** (solo ciò che è in vista); immagini con **lazy load** e **cache su disco**.
4. **Feedback**: stati di caricamento ed errore chiari; micro-animazioni **brevi** e coerenti (niente effetti invadenti).
5. **Densità**: bilanciare “bella” e “uso pratico”; preferenza per **leggibilità** e target click/touch generosi dove serve.

## Fuori scope per ora

- Onboarding animato, tutorial in-app, account cloud.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: principi dark-first, virtualizzazione, cache immagini. |
