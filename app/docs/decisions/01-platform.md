# Piattaforma e shell desktop

## Decisioni

1. **Target**: solo **Windows** (prima versione). Nessun requisito macOS/Linux finché non viene rivalutato esplicitamente.
2. **Shell**: **Tauri 2** come contenitore desktop (finestre, file system, aggiornamenti futuri, integrazione OS).
3. **Motivazione**: bundle più leggero rispetto a Electron, uso di **WebView2** già presente su Windows moderni, adatto a UI ricca senza incollare un intero Chromium nell’installer.

## Non decisioni (ancora)

- Firma codice, installer (WiX/MSIX), canale di distribuzione: da definire quando esiste un MVP installabile.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: Windows-only + Tauri 2. |
