/**
 * Da public/favilogo.png crea un PNG quadrato (padding trasparente), poi `tauri icon` e `cargo clean`.
 * Usa sharp solo per il canvas quadrato (alpha corretta); niente alterazione dei pixel del logo.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, "..");
const inputPath = path.join(desktopDir, "public", "favilogo.png");

if (!fs.existsSync(inputPath)) {
  console.error(`Esegui prima: npm run icons:prepare (${inputPath} mancante)`);
  process.exit(1);
}

const meta = await sharp(inputPath).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
const s = Math.max(w, h);
const left = Math.floor((s - w) / 2);
const top = Math.floor((s - h) / 2);

const logoPng = await sharp(inputPath).ensureAlpha().png().toBuffer();

const squareBuf = await sharp({
  create: {
    width: s,
    height: s,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: logoPng, left, top }])
  .png()
  .toBuffer();

const tmpPath = path.join(os.tmpdir(), `setcheck-tauri-icon-square-${Date.now()}.png`);
fs.writeFileSync(tmpPath, squareBuf);
console.log(`PNG quadrato ${s}x${s} (trasparente) -> ${tmpPath}`);

try {
  const r1 = spawnSync("npx", ["--yes", "tauri", "icon", tmpPath], {
    cwd: desktopDir,
    stdio: "inherit",
  });
  if (r1.status !== 0) process.exit(r1.status ?? 1);

  const tauriDir = path.join(desktopDir, "src-tauri");
  const r2 = spawnSync("cargo", ["clean"], { cwd: tauriDir, stdio: "inherit" });
  if (r2.status !== 0) {
    console.warn("cargo clean non riuscito: chiudi tauri dev e riesegui da src-tauri: cargo clean");
  } else {
    console.log("cargo clean OK.");
  }
} finally {
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    /* ignore */
  }
}

console.log("Fatto. Riavvia: npm run tauri dev");
