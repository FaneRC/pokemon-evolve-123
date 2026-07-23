import fs from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const source = path.resolve(webRoot, "../api/src/data/pokemon.csv");
const targetDir = path.resolve(webRoot, "public");
const target = path.resolve(targetDir, "pokemon.csv");

if (!fs.existsSync(source)) {
  console.log("[syncDataset] Source dataset not found, skipping sync.");
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log("[syncDataset] Copied dataset to web/public/pokemon.csv");
