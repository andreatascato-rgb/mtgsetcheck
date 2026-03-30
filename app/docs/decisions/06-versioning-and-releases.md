# Versionamento e release

## Decisioni

1. **Schema**: **Semantic Versioning 2.0** (`MAJOR.MINOR.PATCH`) — vedi [semver.org](https://semver.org/lang/it/).
   - **MAJOR**: cambi incompatibili per utente/installer (es. formato dati locale, API IPC breaking).
   - **MINOR**: funzionalità retrocompatibili.
   - **PATCH**: correzioni retrocompatibili.

2. **Fonte unica della versione applicazione**: i tre file sotto `app/desktop/` devono **coincidere** per ogni release pubblicata o taggata:
   - `package.json` → campo `"version"`
   - `src-tauri/tauri.conf.json` → `"version"`
   - `src-tauri/Cargo.toml` → `[package] version`

   In caso di divergenza, l’installer e i metadati possono risultare incoerenti; il bump va fatto **in un solo commit** che aggiorna tutti e tre.

3. **Changelog**: file [`CHANGELOG.md`](../../../CHANGELOG.md) alla **root del repository**, stile [Keep a Changelog](https://keepachangelog.com/it-IT/1.0.0/) (sezioni *Added* / *Changed* / *Fixed* / *Removed* dove serve). Ogni bump di versione utile agli utenti include almeno una voce sotto la versione corrispondente.

4. **Git / GitHub**: tag opzionali `vMAJOR.MINOR.PATCH` allineati alla versione in quei file; **GitHub Releases** (note + asset installer) quando si distribuisce fuori dal team — da dettagliare quando esiste pipeline di release automatica.

5. **CI**: la pipeline in `.github/workflows/` non sostituisce il versionamento; verifica build e lint. La versione in codice è responsabilità del maintainer al momento del bump.

6. **Messaggio di commit obbligatorio**: **ogni commit** deve contenere nel testo del messaggio la **versione corrente** dell’app (`MAJOR.MINOR.PATCH`), identica a quella in `package.json` / `tauri.conf.json` / `Cargo.toml`. Non si richiede di **incrementare** la versione a ogni commit — solo di **citare** quella vigente così la storia Git è sempre associata a un numero di versione noto.
   - **Formato consigliato** (prima riga): `0.1.0: descrizione breve` oppure `[0.1.0] descrizione breve` oppure `v0.1.0: descrizione breve`.
   - **Enforcement**: hook Git [`.githooks/commit-msg`](../../../.githooks/commit-msg); attivazione con `git config core.hooksPath .githooks` (una volta per clone). I commit di merge automatici (`Merge branch …`) sono esentati dal controllo.

## Non decisioni (ancora)

- Automazione bump (script, `release-it`, action che aggiorna i tre file): da introdurre se il ritmo di release lo giustifica.

## Storico

| Data | Nota |
|------|------|
| 2026-03-30 | Prima stesura: SemVer, allineamento npm/Tauri/Cargo, CHANGELOG in root. |
| 2026-03-30 | Ogni commit deve includere la versione corrente nel messaggio; hook `.githooks/commit-msg`. |
