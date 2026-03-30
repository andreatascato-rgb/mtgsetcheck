/**
 * Estrae i simboli mana colorati (W/U/B/R/G) dalla stringa costo Scryfall (`{...}`),
 * inclusi ibridi tipo {W/U} e {2/W}. Non usa color_identity né testo delle regole.
 * Rif.: https://scryfall.com/docs/api/colors
 */

const WUBRG = new Set(["W", "U", "B", "R", "G"]);

/**
 * Per ogni gruppo `{...}` nel costo, spezza su `/` e tiene solo segmenti W/U/B/R/G
 * (es. `{W/U}` → W,U; `{2/W}` → W; `{W/P}` → W).
 */
export function extractWubrgFromManaCost(cost: string): readonly string[] {
  const out = new Set<string>();
  for (const m of cost.matchAll(/\{([^}]*)\}/g)) {
    const inner = m[1];
    for (const part of inner.split("/")) {
      if (WUBRG.has(part)) out.add(part);
    }
  }
  return [...out];
}
