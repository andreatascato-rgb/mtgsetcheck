# Tipografia scelta per MTG Set Check (2026)

Scelta operativa per l’app desktop: **font variabili self-hosted** (Fontsource), nessuna dipendenza da Google Fonts a runtime, adatta a Tauri offline.

## Triade

| Ruolo | Font | Perché |
|--------|------|--------|
| **UI / corpo** | [Plus Jakarta Sans](https://fontsource.org/fonts/plus-jakarta-sans) (variable) | Sans geometrica moderna, molto usata in prodotti 2024–2026; eccellente a **13–15 px** in sidebar e liste. |
| **Display / titolo app** | [Fraunces](https://fontsource.org/fonts/fraunces) (variable) | Serif morbida con personalità controllata: richiama **manuale / fantasy** senza diventare illeggibile; usata in header per il nome app. |
| **Codici / numeri** | [JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono) (variable) | Monospazio chiaro per **codice set**, **collector number**, valori allineati in tabelle. |

## Implementazione

- NPM: `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/fraunces`, `@fontsource-variable/jetbrains-mono`
- Token in `app/desktop/src/index.css` → `@theme`: `--font-sans`, `--font-display`, `--font-mono`
- Utility Tailwind: `font-sans` (default `body`), `font-display` (titolo in header), `font-mono` (codici)

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Triade Jakarta + Fraunces + JetBrains Mono, self-hosted. |
| 2026-03-25 | Breve passaggio a IBM Plex; ripristino Jakarta + Fraunces + JetBrains su richiesta. |
