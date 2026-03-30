# Changelog

Tutte le modifiche rilevanti per gli utenti di questa versione dell’app saranno documentate qui.

Il formato è ispirato a [Keep a Changelog](https://keepachangelog.com/it-IT/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

### Added

- Documentazione su versionamento (`app/docs/decisions/06-versioning-and-releases.md`) e workflow GitHub (`app/docs/best-practice/08-github-workflow.md`).
- Policy: ogni commit include la versione corrente nel messaggio; hook Git `.githooks/commit-msg` (attivare con `git config core.hooksPath .githooks`).

### Changed

- README principale per GitHub: badge CI, stack, avvio rapido e link alla documentazione.
