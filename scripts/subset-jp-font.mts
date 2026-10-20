// Régénère app/fonts/dela-gothic-one-400-jp-subset.woff2 avec tous les caractères
// japonais présents dans le code (Google Fonts sait livrer un sous-ensemble via `text=`).
// Usage : npm run fonts:jp
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const JP = /[぀-ヿ一-鿿]/u;

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx?|css)$/.test(name)) yield path;
  }
}

const chars = new Set<string>();
for (const dir of ["app", "components", "lib"]) {
  for (const file of files(join(ROOT, dir))) {
    for (const c of readFileSync(file, "utf8")) if (JP.test(c)) chars.add(c);
  }
}
const text = [...chars].sort().join("");

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Dela+Gothic+One&text=${encodeURIComponent(text)}`, { headers: { "User-Agent": ua } })).text();
const url = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!url) throw new Error("URL de police introuvable dans la réponse Google Fonts");

const font = Buffer.from(await (await fetch(url)).arrayBuffer());
writeFileSync(join(ROOT, "app/fonts/dela-gothic-one-400-jp-subset.woff2"), font);
console.log(`Sous-ensemble japonais régénéré (${chars.size} caractères) : ${text}`);
