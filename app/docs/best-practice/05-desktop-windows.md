# Desktop e Windows

## Perché una sezione dedicata

L’app gira in **Tauri + WebView2**: l’utente confronta l’esperienza con **WinUI / Fluent** e altre app Win32 moderne. Allinearsi *dove ha senso* aumenta la fiducia.

## Pratiche ricorrenti

1. **Interazioni native dove contano**  
   Menu finestra, comportamento maximize/snap, DPI scaling: meglio non “rompere” attese (finestre troppo custom senza motivo, bordi strani).

2. **Tastiera e produttività**  
   Scorciatoie (cerca, navigazione elenco), acceleratori ovunque sia opportuno; su desktop la tastiera è centrale.

3. **Notifiche**  
   Contenuti sensibili nelle notifiche: da evitare; errori spesso meglio **in-app** che toast invasivi.

4. **Icone e asset**  
   Per bundle multi-piattaforma futuro, dimensioni icone per OS variano; oggi **solo Windows**, ma tenere presente se si espande.

## Riferimento ufficiale Microsoft

- [Design and UI Windows apps](https://learn.microsoft.com/en-us/windows/apps/design/) — Fluent, pattern, terminologia utile anche se non usiamo WinUI direttamente.

## Letture da ecosistema desktop / cross-platform

- [Designing desktop apps for cross-platform UX](https://www.todesktop.com/blog/posts/designing-desktop-apps-cross-platform-ux) (ToDesktop): convenzioni e trappole comuni tra OS.
