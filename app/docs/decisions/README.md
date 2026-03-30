# Decisioni — app desktop collezione MTG

Questa cartella raccoglie **solo** le scelte architetturali e di prodotto, in file piccoli e separati.  
Obiettivo: costruire l’app **a incrementi**, senza fondere tutto in un unico documento o in un’unica “mega PR”.

## Come usarla

- Ogni file ha un ambito chiaro (piattaforma, UI, dati, …).
- Quando cambia una decisione, si aggiorna **quel** file e si aggiunge una riga in *Storico* in coda allo stesso file (data + sintesi).
- Non duplicare qui il codice: solo motivazioni e vincoli.

## Indice

| File | Contenuto |
|------|-----------|
| [01-platform.md](./01-platform.md) | Solo Windows, shell desktop, runtime |
| [02-frontend.md](./02-frontend.md) | UI tecnica: React, build, librerie |
| [03-ui-ux.md](./03-ui-ux.md) | Principi esperienza utente e qualità percepita |
| [04-data.md](./04-data.md) | Origine dati set/collezione, immagini, percorsi repo |
| [05-repository-layout.md](./05-repository-layout.md) | Dove sta il codice desktop vs cartelle `set/` |
| [06-versioning-and-releases.md](./06-versioning-and-releases.md) | SemVer, allineamento versione npm/Tauri/Cargo, CHANGELOG, tag |

Linee guida di settore (non vincolanti): [`../best-practice/`](../best-practice/).

## Stato

- **Fase**: **Tailwind CSS v4** + **Radix** (`ScrollArea`, `Separator`) e **shell dark** (header + sidebar set + area principale) in [`../desktop/`](../desktop/). Prossimo passo tipico: import dati da `set/spm/` o primi componenti griglia carta.
