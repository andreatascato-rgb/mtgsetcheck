# Accessibilità, tema, motion

## Accessibilità (fondamento, non extra)

1. **Contrasto**  
   Rispettare criteri riconosciuti ([WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)) per testo, icone informative e controlli.

2. **Tastiera e focus**  
   Ordine di tab logico, **focus visibile** (mai `outline: none` senza sostituto equivalente), escape da overlay/dialog.

3. **Screen reader**  
   Etichette, ruoli e relazioni corrette (es. cosa è espandibile, cosa è selezionato) — Radix aiuta se non si sovrascrive il comportamento male.

4. **Bias cognitivi**  
   Meno animazioni distrattive; linguaggio chiaro; errori con **cosa è successo** e **come proseguire**.

## Dark mode “moderno”

- Non è inversione semplice: servono **palette dedicate** per superfici, bordi, testo secondario e accent.
- Accenti **pochi e coerenti** (es. un colore primario per azioni importanti).

## Motion

- Onorare **`prefers-reduced-motion`**: animazioni ridotte o eliminate.
- Micro-interazioni **brevi** (centinaia di ms), easing coerente; evitare movimenti grandi su ogni hover.
