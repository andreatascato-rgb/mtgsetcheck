# Desktop — MTG set check (Tauri)

App Windows (Tauri 2 + React + TypeScript + Vite). Le decisioni di progetto sono in `../docs/decisions/`; linee guida UI in `../docs/best-practice/`.

## Prerequisiti

- Node.js + npm  
- Rust toolchain (`rustc`, `cargo`) per `tauri dev` / `tauri build`

## Sviluppo

```bash
cd app/desktop
npm install
npm run tauri dev
```

## Solo anteprima web (senza shell nativa)

```bash
npm run dev
```

## Build / installer

```bash
npm run tauri build
```

Output tipico: MSI e installer NSIS sotto `src-tauri/target/release/bundle/`.
