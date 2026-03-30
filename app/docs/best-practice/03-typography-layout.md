# Tipografia, spaziatura, layout

## Linee guida diffuse nel 2025

1. **Corpo del testo più generoso**  
   Molte fonti consigliano **16–18 px** (o equivalente) come minimo per testo corrente su schermi desktop/webview, rispetto agli standard più bassi del passato.

2. **Scala tipografica matematica**  
   Usare una scala (es. rapporto ~1.25 / 1.33) per titoli e sottotitoli evita “dimensioni a caso” e migliora la gerarchia.

3. **Interlinea e misura**  
   Interlinea circa **1.4–1.7** a seconda della lunghezza della riga; limitare troppo la larghezza del testo lungo migliora la leggibilità.

4. **Spaziatura su griglia, non a occhio**  
   Basandosi su unità ripetute (es. multipli di 4 / 8 px, o sistemi tipo “baseline” 24 px) riduce il disordine e allinea elementi tra loro.

5. **Densità bilanciata**  
   Desktop permette più informazione che mobile, ma **affollare** la griglia carte riduce piacere e chiarezza; servono respiri e raggruppamenti logici.

## Impaginazione app (`app/desktop/src/index.css`)

Token in `@theme` (scala **4 px**, nomi semantici). Usare queste utility nelle nuove viste invece di `p-5` / `p-7` arbitrari.

| Token | Utilità tipiche | Valore | Uso |
|--------|-----------------|--------|-----|
| `layout-x` | `px-layout-x` | 16px | Header, bordo interno allineato |
| `page` | `p-page` | 24px | Padding area principale |
| `surface` | `px-surface`, `py-surface` | 12px | Blocchi riquadri generici |
| `sidebar` | `p-sidebar`, `px-sidebar`, `py-sidebar` | 16px | Colonna set (lista + header) |
| `scroll` | `p-scroll` | 8px | Inset compatto per liste dense |
| `list` | `space-y-list` | 2px | Righe lista compatta |
| `cluster` | `gap-cluster`, `mt-cluster` | 8px | Elementi affini (titolo+meta, chip) |
| `stack` | `mt-stack` | 16px | Tra paragrafi / note |
| `section` | `mt-section` | 32px | Tra sezioni (intro → griglia) |
| `set-x` / `set-y` | `px-set-x`, `py-set-y` | 10px / 8px | Celle / bottoni set |
| `dense` | `gap-dense`, `py-dense` | 2px | Due righe nello stesso controllo |
| `scrollbar` | `p-scrollbar` | 2px | Padding area scrollbar |
| `w-sidebar` | `w-sidebar` | 14rem | Larghezza sidebar |
| `h-app-header` | `h-app-header` | 44px | Altezza barra titolo app |
| `max-w-column` | `max-w-column` | 48rem | Colonna centrata contenuto |
| `max-w-reading` | `max-w-reading` | 36rem | Larghezza testo lungo leggibile |

**Centratura / colonna:** contenuto nella zona principale = `mx-auto w-full max-w-column` quando serve un blocco centrato (griglia, dettaglio, ecc.).

## Dark-first (vedi anche `04-accessibility-theme.md`)

- Testo e superfici a strati (**layered neutrals**) invece di grigio uniforme piattone.
- Evitare nero puro `#000` ovunque se si punta a comfort prolungato; molte guide usano quasi-nero o grigi caldi.
