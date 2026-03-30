/**
 * Copia references/logos/prumqfwu4j3c1.png in public/favilogo.png senza modificare pixel
 * (mantiene trasparenza e colori così come nel file sorgente).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, "..");
const srcPath = path.join(desktopDir, "..", "..", "references", "logos", "prumqfwu4j3c1.png");
const outPath = path.join(desktopDir, "public", "favilogo.png");

if (!fs.existsSync(srcPath)) {
  console.error(`Manca: ${srcPath}`);
  process.exit(1);
}
fs.copyFileSync(srcPath, outPath);
console.log(`OK: copiato in ${outPath} (identico al sorgente)`);
