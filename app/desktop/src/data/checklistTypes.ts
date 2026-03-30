/** Una riga checklist: una variante/stampa distinta (numero collezione). */
export type ChecklistLine = {
  /** Numero collezione (stringa per suffissi Scryfall tipo `1a`, `S1`). */
  collectorNumber: string;
  name: string;
  /** Stato iniziale dal file sorgente ([x] / [ ]). */
  ownedByDefault: boolean;
  /**
   * Colori per filtro UI, derivati da Scryfall (`manaColorsFromScryfallCard`).
   * `[]` = incolore noto; assente = riga solo da testo / mai sincronizzata — il filtro colore la esclude.
   * Policy: `app/docs/decisions/04-data.md`.
   */
  manaColors?: readonly string[];
};
