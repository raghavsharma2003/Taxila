// Self-repair (LIVE-STUDIO §3.7, D6): bounded (≤ 2 rounds per builder) and fed by the GATE, never by a judge. The
// prompt is the original task + the failing check ids with their details (truncated) + the stream guard's removals +
// the previous file + the archetype's negative memory, PLACED LAST (position is mechanism). The output is the full
// corrected file (v1; diff patches only when files outgrow ~8 KB and a dry-run applier exists).
//
// A build that fails a safety-shaped family (G1 boot/errors/CSP/network, G3 words, G8 hints) twice is dropped, not
// repaired again.
import { readFileSync, existsSync } from "node:fs";
import { hintLines } from "./stream-guard.js";

export const MAX_REPAIRS = 2;
const SAFETY_FAMILIES = new Set(["G1", "G3", "G8"]);
const MEM_DIR = new URL("./memory/", import.meta.url);
const memCache = new Map();

/**
 * The archetype's negative memory: validated failure SHAPES (never code), each recurring ≥ 3 times across builds and
 * written by a human or the main loop (§3.7). → string[]
 */
export function memoryFor(archetypeId) {
  if (memCache.has(archetypeId)) return memCache.get(archetypeId);
  const url = new URL(`${archetypeId}.json`, MEM_DIR);
  let list = [];
  try { if (existsSync(url)) list = (JSON.parse(readFileSync(url, "utf8")).patterns ?? []).filter((p) => p && p.shape && (p.seen ?? 0) >= 3).map((p) => p.shape); }
  catch { list = []; }
  memCache.set(archetypeId, list);
  return list;
}

/** Families of the failing checks ("G4.targets_min" → "G4"). */
export const failingFamilies = (gate) => [...new Set((gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id.split(".")[0]))];

/** Drop instead of repairing: a safety-shaped family failed in this round AND in an earlier one. */
export function shouldDrop(history) {
  const seen = new Map();
  for (const g of history) for (const f of failingFamilies(g)) if (SAFETY_FAMILIES.has(f)) seen.set(f, (seen.get(f) ?? 0) + 1);
  return [...seen.values()].some((n) => n >= 2);
}

/**
 * The repair turn for a failed build.
 * @param {{ system: string, user: string }} base the original prompt
 * @param {{ html: string, gate: any, hints?: object[], archetypeId: string, scriptError?: string | null }} last
 * @returns {{ system: string, user: string }}
 */
export function repairPrompt(base, { html, gate, hints = [], archetypeId, scriptError }) {
  const fails = (gate?.checks ?? []).filter((c) => !c.pass).map((c) => `- ${c.id}: ${JSON.stringify(c.detail ?? "").slice(0, 240)}`);
  if (scriptError) fails.push(`- G0.parses: ${String(scriptError).slice(0, 200)}`);
  const guard = hintLines(hints).map((l) => `- ${l}`);
  const memory = memoryFor(archetypeId);
  const user = [
    base.user,
    "YOUR PREVIOUS FRAGMENT FAILED THE AUTOMATED GATE (it plays the fragment in a browser against the host's truth). Failing checks (id: detail):",
    ...fails,
    ...(guard.length ? ["Removed from your stream by the sandbox guard (do not use these):", ...guard] : []),
    "PREVIOUS FRAGMENT:",
    String(html ?? "").slice(0, 60_000),
    ...(memory.length ? ["KNOWN FAILURE PATTERNS FOR THIS KIND OF PIECE (avoid every one):", ...memory.map((m) => `- ${m}`)] : []),
    "Return the complete corrected fragment (same output rules).",
  ].join("\n");
  return { system: base.system, user };
}
