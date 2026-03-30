# mtgsetcheck

Desktop (Tauri) + dati testuali per controllare **set Magic** (varianti / collezione).

## Struttura

| Percorso | Contenuto |
|----------|-----------|
| [app/docs/](app/docs/) | Indice documentazione: decisioni, best practice UI e workflow Git |
| [app/desktop/](app/desktop/) | Applicazione Windows (Tauri 2, React, Vite) |
| [set/spm/](set/spm/) | Esempio: checklist e mancanti set *Marvel’s Spider-Man* (SPM) |
| [CHANGELOG.md](CHANGELOG.md) | Note di release (SemVer, Keep a Changelog) |

## Avvio rapido app

Vedi [app/desktop/README.md](app/desktop/README.md) (`npm run tauri dev` da `app/desktop/`).

## Git (clone locale)

Per applicare l’hook che richiede la **versione nel messaggio di commit** (vedi `app/docs/decisions/06-versioning-and-releases.md`):

`git config core.hooksPath .githooks`
