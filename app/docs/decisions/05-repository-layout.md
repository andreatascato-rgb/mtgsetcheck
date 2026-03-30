# Layout repository (app vs dati set)

## Decisioni

1. **Decisioni di prodotto / architettura**: `app/docs/decisions/` (file `.md`). Best practice di riferimento: `app/docs/best-practice/`.
2. **Codice desktop (Tauri + React)**: `app/desktop/` (progetto creato con `create-tauri-app`, non versionare `node_modules/` né `src-tauri/target/`).
3. **Dati statici dei set** (checklist testuali, ecc.): `set/<codice-set>/` (es. `set/spm/`).

## Comandi utili (da `app/desktop/`)

- Sviluppo: `npm run tauri dev`
- Solo frontend web: `npm run dev`
- Build installer (dopo setup toolchain): `npm run tauri build`

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: `app/desktop` + comandi base. |
| 2026-03-25 | Decisioni sotto `app/docs/decisions/`; aggiunta `app/docs/best-practice/`. |
