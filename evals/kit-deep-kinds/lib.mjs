import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
export const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
/** The work dir (items.json, results.jsonl, per-item.json, summary.json). Not committed: the record is docs/research/kits. */
export function workDir() { const d = arg("dir"); if (!d) throw new Error("--dir <work dir> is required"); const p = resolve(d); mkdirSync(p, { recursive: true }); return p; }
export const KITS = new URL("../../data/kits/", import.meta.url);
