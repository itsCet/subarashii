// Concatène migrations + seed dans supabase/setup.sql, à coller en une fois
// dans le SQL Editor de Supabase. Usage : npm run db:bundle
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "supabase");
const migrations = readdirSync(join(dir, "migrations")).filter((f) => f.endsWith(".sql")).sort();

const parts = [
  ...migrations.map((f) => [`migrations/${f}`, readFileSync(join(dir, "migrations", f), "utf8")]),
  ["seed.sql", readFileSync(join(dir, "seed.sql"), "utf8")],
];

const sql = `-- Fichier généré par scripts/bundle-sql.mts — ne pas éditer à la main.
-- Installation complète sur un projet Supabase VIDE : coller tout ce fichier dans
-- SQL Editor → New query → Run. (Une seule fois : il ne se relance pas sur une base déjà installée.)

begin;

${parts.map(([name, body]) => `-- ${"=".repeat(77)}\n-- ${name}\n-- ${"=".repeat(77)}\n\n${body.trim()}\n`).join("\n")}
commit;
`;

writeFileSync(join(dir, "setup.sql"), sql);
console.log(`supabase/setup.sql généré (${parts.length} fichiers)`);
