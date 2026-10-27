// Handoff (2026-10-27): writes .env.local from the process environment, for every key the project uses
// (scripts/handoff/keys.json, names only). Values never leave the machine and are never printed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const keys = JSON.parse(readFileSync(new URL("./keys.json", import.meta.url), "utf8"));
const out = new URL("../../.env.local", import.meta.url);
if (existsSync(out) && !process.argv.includes("--force")) { console.error(".env.local exists; pass --force to overwrite"); process.exit(1); }
const missing = keys.filter((k) => process.env[k] == null || process.env[k] === "");
const lines = keys.filter((k) => !missing.includes(k)).map((k) => `${k}=${process.env[k]}`);
writeFileSync(out, lines.join("\n") + "\n", { mode: 0o600 });
console.log(`.env.local written: ${lines.length}/${keys.length} keys`);
if (missing.length) console.log(`missing (add them to the environment settings): ${missing.join(", ")}`);
