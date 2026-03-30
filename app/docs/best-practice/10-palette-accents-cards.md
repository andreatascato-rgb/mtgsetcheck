# Palette, accenti e superfici (dark) — raffinamento per contesto app

Documento di **direzione visiva e coerenza**: cosa funziona oggi, cosa dicono le guide recenti, dove possiamo **raffinare** senza toccare la shell (header/sidebar) e la **gabbia dell’area contenuto** (padding, larghezze massime definite a livello layout).  
Si applica a **componenti di prodotto** dentro il workspace set: statistiche, filtri, chip, tabelle, barre di progresso, modali, toast, card e ombre “carta”.

**Fonti di verità nel codice:** `app/desktop/src/index.css` (`@theme`, utility `shadow-card*`), uso di classi in `SetWorkspace` e componenti correlati.

---

## 1. Ambito (esplicito)

| In scope | Fuori scope (per questa nota) |
|----------|-------------------------------|
| Token semantici `accent`, superfici `surface-*`, `border`, `muted`, `fg` | Struttura layout shell (`AppShell`), larghezza sidebar, altezza header |
| Accenti secondari già presenti (mana WUBRG, barra foil viola, toggle filtri) | Padding pagina `--spacing-page` e “area contenuto” come contenitore |
| Ombre card, bordi, stati hover/focus su controlli | Contenuto testuale dei set in `set/` |

Obiettivo: **decisioni di colore** allineate a accessibilità, leggibilità lunghe sessioni e identità “collezione / premium” coerente con MTG.

---

## 2. Audit sintetico — stato attuale (`index.css`)

| Token / pattern | Valore / uso | Note |
|-----------------|----------------|------|
| `surface-0` | `#0a0a0c` | Base molto scura, non nero puro — allineato a best practice “near black” |
| `surface-1` | `#111114` | Step verso “raised” |
| `surface-2` | `#18181c` | Pannelli, track barre, fondi secondari |
| `border` | bianco ~8% | Linee discrete |
| `border-strong` | bianco ~14% | Enfasi bordo |
| `fg` / `muted` | `#ececf1` / `#8b8b97` | Gerarchia testo chiara |
| `accent` / `accent-hover` | oro `#c9a227` → `#d4b03a` | UI globale; StatCard Possedute usa `--accent-card-stop-*` + shell come Foil |
| `--foil-fill-stop-*` | idem | `.bg-foil-progress-fill`, card Foil come sopra |
| `--accent-card-stop-*` | idem | `.bg-accent-progress-fill` (barra Completamento), card Possedute |
| — | — | `.app-progress-track`: track incassato condiviso dalle due barre |
| Mana | WUBRG dedicati | OK come palette di dominio gioco |
| Ombre `.shadow-card*` | solo nero, doppio strato | Neutrali, niente tinta oro nelle ombre (commento in CSS) |

**Aggiornamento:** barre **Completamento** / **Foil** condividono `.app-progress-track`; riempimenti `.bg-accent-progress-fill` e `.bg-foil-progress-fill` (stessi stop delle rispettive StatCard).

---

## 3. Principi da guide (dark UI, design system)

1. **Non invertire il tema chiaro** — palette dark dedicata; saturazione controllata per evitare “blooming” su sfondi scuri. ([Approfondimenti comuni su dark mode](https://www.highmountainstudio.com/blog/dark-mode-design-systems-web-apps), linee guida su near-black vs #000.)
2. **Superfici a livelli** — almeno 2–3 step percepibili (base → raised → overlay modale). In dark spesso si aumenta **luminosità** della superficie invece di affidarsi solo alle ombre. ([Elevation in sistemi come Atlassian](https://atlassian.design/foundations/elevation/) — principio “layer” + ombra.)
3. **Pochi accenti semantici** — un primario per azioni/progressi principali; secondari per stati (successo, warning, errore) o dominio (mana, foil). Evitare un nuovo colore per ogni schermata.
4. **Contrasto WCAG** — testo normale vs sfondo, icone su chip, stati `focus-visible` (già `ring-accent/40` in vari punti). Riferimento: [WCAG 2.2 Quick Ref](https://www.w3.org/WAI/WCAG22/quickref/).
5. **Token come contratto** — nome per **ruolo** (`accent`, `danger`), non per valore hex — vedi anche [02-design-system.md](./02-design-system.md).

---

## 4. Contesto prodotto (mtgsetcheck)

- **Sessioni lunghe** — checklist, filtri, griglia densa: priorità a **contrasto stabile** e superfici poco “luminose” che affaticano.
- **Contenuto ricco (arte carte)** — le ombre delle card restano **neutre** (già scelto); evitare bordi o glow colorati che competono con le illustrazioni.
- **Oro come accento** — legge bene “premium / collezione”; va bene mantenerlo **unico** per CTA, progress principale, link codice set.
- **Mana** — colori distinti per riconoscimento rapido; vanno **saturi** ma solo su **chip piccoli**, non come sfondo pieno di grandi sezioni.
- **Foil** — seconda metrica (barra + tabella); gradiente **ciano–lavanda–rosa** (token `--foil-fill-stop-*`) separato dall’oro, evoca foil fisico senza confondere col completamento.

---

## 5. Proposte di raffinamento (non implementate qui)

Priorità suggerita quando si passa al codice:

1. ~~**Tokenizzare il colore foil**~~ — **fatto** come `--foil-fill-stop-*` + `.bg-foil-progress-fill`. Estendere lo stesso linguaggio a badge/link foil se servono.
2. **Opzionale: `danger` / `warning` / `success`** — per toast errore, conferme eliminazione, stato “sync ok”; oggi alcuni stati potrebbero essere solo testo (`amber` su errore Scryfall). Centralizzare evita rosso/verde arbitrari.
3. **Micro-step tra surface-1 e surface-2** — verificare a **monitor reale** se serve un `--surface-1-5` o leggera **tinta** (blu freddissimo 1–2%) solo su card statistiche per staccarle dal fondo — solo se A/B visivo lo giustifica (rischio: “troppi grigi”).
4. **Chip filtro mana (stato on)** — oggi colori Tailwind (`sky-500`, `red-600`, …). Valutare **versioni leggermente desaturate** su dark per uniformità con §3 (senza perdere distinzione WUBRG).
5. **Selezione testo** — già `rgb(201 162 39 / 0.35)` legato all’accent; allineare eventuali **highlight** di ricerca futuri allo stesso token.

---

## 6. Checklist prima di merge su colori

- [ ] Contrasto testo su `surface-*` usato dal componente (non solo su `surface-0`).
- [ ] Stato focus visibile non solo colore (ring già presente — mantenere).
- [ ] Nuovo colore = **nuovo token** in `@theme`, non solo classe arbitraria.
- [ ] `prefers-reduced-motion` già globale; animazioni che cambiano colore restano brevi.

---

## 7. Storico

| Data | Nota |
|------|------|
| 2026-03-30 | Prima stesura: audit `index.css`, principi dark/semantic, contesto MTG, proposte token foil e semantica; ambito escluso shell e area contenuto. |
| 2026-03-30 | Barra Foil: gradiente olografico soft (`--foil-fill-stop-*`, `.bg-foil-progress-fill`). |

---

## 8. Bibliografia (selezione)

- [W3C — WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) — contrasto e non solo colore.
- [Atlassian Design — Elevation](https://atlassian.design/foundations/elevation/) — principi di profondità e superfici.
- Articoli su **dark mode** e palette dedicata (es. [High Mountain Studio — Dark mode design systems](https://www.highmountainstudio.com/blog/dark-mode-design-systems-web-apps)) — non inversione meccanica, saturazione sui dark.

---

*Prossimo passo consigliato:* decidere insieme (1) se introdurre subito `--color-accent-foil` e spostare la barra/tab su quel token, (2) se formalizzare `danger` per toast/errori, (3) se toccare i chip mana o lasciarli dopo test su dispositivi reali.
