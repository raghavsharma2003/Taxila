// The Relational OS probe corpora (RELATIONAL-OS §14), read-only. P2 = the multi-turn adversarial dependency rerun
// (168 replies, realtime lane, hand codes by the spec author blind to arm: codes-p2-rerun.mjs). Each row:
// { n, id (script), idx (turn in script), child, teacher, codes: [defect codes] }.
import { readFileSync } from "node:fs";
import { CODES } from "./codes-p2-rerun.mjs";

const read = (rel) => { try { return JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8")); } catch { return null; } };

export function relationalP2() {
  const blind = read("./results/p2-depend-2026-10-04-rerun-blind.json");
  if (!Array.isArray(blind)) return [];
  const codeOf = new Map();
  for (const [code, ns] of Object.entries(CODES)) for (const n of ns) codeOf.set(n, [...(codeOf.get(n) ?? []), code]);
  return blind.map((r) => ({ ...r, codes: codeOf.get(r.n) ?? [] }));
}

/** Every probe reply P1-P3 (448), uncoded: for false-flag listings. */
export function relationalAll() {
  const out = [];
  for (const f of ["p1-affect-2026-10-04-blind.json", "p2-depend-2026-10-04-blind.json", "p2-depend-2026-10-04-rerun-blind.json", "p3-memory-2026-10-04-blind.json"]) {
    for (const r of read(`./results/${f}`) ?? []) out.push({ file: f, ...r });
  }
  return out;
}
