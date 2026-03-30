# Dati: set, collezione, immagini

## Decisioni

1. **Set di riferimento nel repo**: cartella **`set/spm/`** (checklist completa + lista mancanti), come sorgente iniziale per un set. Altri set andranno in **`set/<codice>/`** allo stesso modo.
2. **Formato attuale**: file testo (`spm_all_variants_checklist.txt`, `spm_missing_all.txt`) con convenzione `[x]` / `[ ]` e numero collezione; l’app importerà o convertrà in un formato interno **in una fase successiva** (non definito in questo file).
3. **Metadati e immagini carte**: **API Scryfall** come fonte esterna per nomi allineati al gioco e **URI immagini** (preferenza **PNG alta risoluzione** quando disponibile). Rispetto di policy e rate limit Scryfall.
4. **Cache immagini**: salvataggio locale (percorso sotto cartella dati app / profilo utente) per evitare ridownload e accelerare avvii successivi.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: `set/spm`, testo checklist, Scryfall + cache locale. |
