# Changelog

Tutte le modifiche rilevanti per gli utenti di questa versione dell’app saranno documentate qui.

Il formato è ispirato a [Keep a Changelog](https://keepachangelog.com/it-IT/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

### Added

- Dialog carta: scorciatoie tastiera **C** (in collezione), **F** (foil), **T** (altra faccia se la carta è multi-faccia); **Esc** chiude il dialog.
- Documentazione su versionamento (`app/docs/decisions/06-versioning-and-releases.md`) e workflow GitHub (`app/docs/best-practice/08-github-workflow.md`).
- Policy: ogni commit include la versione corrente nel messaggio; hook Git `.githooks/commit-msg` (attivare con `git config core.hooksPath .githooks`).
- Checklist set: vista **tabella** (toggle con griglia), colonne anteprima, numero collezione, nome, foil, possesso; checkbox **Foil** nel dialog carta; conteggi e percentuale foil nel riepilogo header; persistenza foil in `localStorage` e campo `foil` nell’export/import JSON collezione.

### Changed

- Documentazione in `app/docs/decisions/` e `app/docs/best-practice/09-data-tables.md` (§27) allineata al comportamento attuale della checklist.
- Riepilogo set: etichetta **Carte**; ordine card mancanti / possedute; StatCard Possedute e Foil con bordo–gradiente (oro / foil); barre Completamento e Foil con riempimento a gradiente e track `.app-progress-track` (`index.css`). Guida palette in `app/docs/best-practice/10-palette-accents-cards.md`.
- README principale per GitHub: badge CI, stack, avvio rapido e link alla documentazione.
