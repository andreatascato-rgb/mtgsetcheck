# Workflow Git e GitHub (best practice)

Linee guida per lavorare sul repo con **CI su Windows** (`.github/workflows/`) e storia Git leggibile. Non sostituiscono policy del team se ne avete di più strette.

## Branch e merge

- **Branch principale**: `main` o `master` (allineato a quanto configurato in `ci.yml` per i trigger).
- **Modifiche**: preferire **branch di feature** o `fix/` e integrazione tramite **pull request** quando si collabora; commit diretti su `main` accettabili solo per repo personali e micro-fix consapevoli.

## Messaggio di commit (obbligatorio in questo repo)

- **Ogni commit** deve includere la **versione corrente** del progetto (`MAJOR.MINOR.PATCH` come in `app/desktop/package.json`) nel messaggio — vedi [`../decisions/06-versioning-and-releases.md`](../decisions/06-versioning-and-releases.md) punto 6.
- Esempi di prima riga: `0.1.0: fix grid scroll`, `[0.1.0] chore: lint`, `v0.1.0: add parser test`.
- **Setup hook** (una volta per clone, dalla root del repo):

  `git config core.hooksPath .githooks`

  Senza questo, Git non esegue il controllo locale; la policy resta valida per PR e review.

## Prima di aprire una PR o fare push su main

1. Da `app/desktop/`: `npm run check` (lint + test + build frontend).
2. Se hai toccato Rust in `src-tauri/`: `cargo clippy` come in CI (`-D warnings`).
3. **Bump di versione** (SemVer): solo quando rilasci una nuova versione — commit dedicato che aggiorna i tre manifest + `CHANGELOG.md`; i commit successivi useranno il **nuovo** numero nel messaggio fino al prossimo bump.

## Pull request

- **Descrizione**: cosa cambia e perché; link a issue se esiste.
- **Ambito**: PR piccole e rivedibili battono mega-PR che mescolano refactors e feature.
- **CI verde**: non mergeare ignorando fallimenti senza motivo documentato (flaky test da sistemare, ecc.).

## GitHub Actions

- Workflow attuale: checkout, Node **22**, `npm ci`, `npm run check`, toolchain Rust stabile, `cargo clippy` su `src-tauri`.
- **Non committare** segreti: token, `.env` con chiavi — usare **GitHub Secrets** se in futuro servono azioni che pubblicano o firmano.

## Tag e release

- Allineare tag `v*.*.*` alle versioni in `package.json` / `tauri.conf.json` / `Cargo.toml` quando si tagga una versione (vedi [`../decisions/06-versioning-and-releases.md`](../decisions/06-versioning-and-releases.md)).

## Conventional Commits (opzionale)

- Dopo il prefisso versione si possono usare prefissi tipo `feat:`, `fix:`, `chore:` (es. `0.1.0: feat: filtri set`). Utile per changelog automatici in futuro.
