# Design system (2025+)

## Cosa ripetono le guide aggiornate

1. **Design token come contratto**  
   Colore, spaziatura, radius, tipografia, elevazione e motion definiti come **token** (nomi stabili) e riusati ovunque. Aggiornare un token aggiorna tutta l’app in modo coerente.

2. **Da “libreria di componenti” a ecosistema**  
   Il sistema non è solo una lista di widget: include governance (chi può introdurre varianti), versioning e documentazione che vivono col codice.

3. **Accessibilità nel DNA dei componenti**  
   Contrasto, target size, stati focus non sono patch a fine corsa: sono requisiti dei pattern base (tab, dialog, combobox, ecc.).

4. **AI come acceleratore, non sostituto del giudizio**  
   Dove citato: automazione su doc, suggerimenti su token, changelog; la direzione visiva resta umana.

## Applicazione pratica (noi)

- Tailwind: **theme extension** mappata su token semantici (`surface`, `accent`, `danger`, …), non solo colori raw sparsi.
- Radix: primitive con comportamento serio; lo **stile** resta nostro ma i **comportamenti** seguono il system.
