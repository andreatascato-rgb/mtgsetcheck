/** Una riga checklist: una variante/stampa distinta (numero collezione). */
export type ChecklistLine = {
  /** Numero collezione (stringa per suffissi Scryfall tipo `1a`, `S1`). */
  collectorNumber: string;
  name: string;
  /** Stato iniziale dal file sorgente ([x] / [ ]). */
  ownedByDefault: boolean;
  /**
   * `color_identity` Scryfall (solo W,U,B,R,G). `[]` = incolore.
   * Assente se la riga viene solo da import testo senza refresh Scryfall.
   */
  colorIdentity?: readonly string[];
};
