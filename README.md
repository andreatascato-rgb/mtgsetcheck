# SetCheck (mtgsetcheck)

[![CI](https://github.com/andreatascato-rgb/mtgsetcheck/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/andreatascato-rgb/mtgsetcheck/actions/workflows/ci.yml)

Applicazione desktop **Windows** per controllare **set Magic: The Gathering**: varianti, checklist e avanzamento collezione, con dati da **[Scryfall](https://scryfall.com/docs/api)**.

## Stack

| Area | Tecnologie |
|------|------------|
| UI | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Desktop | Tauri 2 |
| Qualità | ESLint, Vitest |

La CI su GitHub Actions (Windows) esegue `npm run check` (lint, test, build frontend) e `cargo clippy` sul backend Rust.

## Requisiti

- **Node.js** 22.x (allineato alla [CI](.github/workflows/ci.yml)) e npm  
- **Rust** stabile (`rustc`, `cargo`) per sviluppo e build Tauri

## Avvio rapido

```bash
git clone https://github.com/andreatascato-rgb/mtgsetcheck.git
cd mtgsetcheck
git config core.hooksPath .githooks
```

Sviluppo app desktop:

```bash
cd app/desktop
npm install
npm run tauri dev
```

Anteprima solo web (senza shell nativa): `npm run dev`.  
Build / installer: `npm run tauri build` — dettagli in [app/desktop/README.md](app/desktop/README.md).

## Struttura del repository

| Percorso | Contenuto |
|----------|-----------|
| [app/desktop/](app/desktop/) | Applicazione Tauri + React |
| [app/docs/](app/docs/) | Decisioni architetturali e best practice |
| [set/](set/) | Dati testuali di esempio (es. checklist per set) |
| [references/](references/) | Materiale di riferimento (loghi, asset non inclusi nel bundle) |
| [CHANGELOG.md](CHANGELOG.md) | Note di release (SemVer, Keep a Changelog) |

## Documentazione

- Indice: [app/docs/README.md](app/docs/README.md)  
- Workflow Git e GitHub: [app/docs/best-practice/08-github-workflow.md](app/docs/best-practice/08-github-workflow.md)  
- Versionamento: [app/docs/decisions/06-versioning-and-releases.md](app/docs/decisions/06-versioning-and-releases.md)

## Contributi e commit

I messaggi di commit devono includere la **versione corrente** dell’app (come in `app/desktop/package.json`), es. `0.1.0: descrizione`. Dopo il clone, attiva l’hook: `git config core.hooksPath .githooks`.

Prima di una PR o di un push su `main`, da `app/desktop/`: `npm run check`; se modifichi Rust in `src-tauri/`, anche `cargo clippy` come in CI.
