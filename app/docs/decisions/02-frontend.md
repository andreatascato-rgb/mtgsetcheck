# Frontend (tecnologie UI)

## Decisioni

1. **Linguaggio**: **TypeScript** obbligatorio per il codice UI.
2. **Build**: **Vite** come bundler/dev server.
3. **Framework UI**: **React** (versione corrente stabile al momento dello scaffold).
4. **Stile**: **Tailwind CSS** per layout e design token (spacing, colori, tipografia).
5. **Componenti accessibili**: libreria **headless** tipo **Radix UI** (o equivalente con stessi principi), non componenti “skin” opachi difficili da personalizzare.
6. **Tipografia**: **Plus Jakarta Sans** (UI), **Fraunces** (titolo app in header), **JetBrains Mono** (codici/numeri), via Fontsource — vedi [`../best-practice/07-typography-stack.md`](../best-practice/07-typography-stack.md).

## Motivazione

Massimo controllo sul look “app 2026” con componenti componibili, focus e keyboard navigabili, senza tema preconfezionato datato.

## Storico

| Data | Nota |
|------|------|
| 2026-03-25 | Prima stesura: Vite + React + TS + Tailwind + Radix. |
| 2026-03-25 | Tailwind v4 (`@tailwindcss/vite`) + Radix ScrollArea/Separator in `app/desktop`. |
| 2026-03-25 | Tipografia: Plus Jakarta Sans + Fraunces + JetBrains Mono (Fontsource). |
| 2026-03-25 | Impaginazione: token layout (`spacing-*`, `width-sidebar`, `max-width-*`) in `@theme` + shell allineata. |
