// Seeded spec mutator for the bad-spec fuzz (STUDIO-V2 §14 M5 classes): dropped keys, junk types, out-of-range and
// non-finite numbers, holes in arrays, unequal pairs, markup and over-long strings, unknown verbs/predicates,
// truncated JSON, {} and [] and null. Pure: used by the node fuzz, the browser fuzz and the gallery's "bad spec" button.
import { rng } from "./math.ts";

const JUNK: unknown[] = [null, -1, 0, 1e9, -1e9, "", "<b>x</b>", "{{x}}", "javascript:alert(1)", "x".repeat(400), [], {}, true, "NaN", [null, null], { a: { b: { c: 1 } } }, "1/0", "0/0", "13/7", "-3/4", "99 99/99", "∞"];
function pick<T>(r: () => number, a: T[]): T { return a[Math.floor(r() * a.length)]; }
function paths(v: unknown, prefix: (string | number)[] = [], out: (string | number)[][] = []): (string | number)[][] {
  if (out.length > 400) return out;
  if (Array.isArray(v)) v.forEach((x, i) => { out.push([...prefix, i]); paths(x, [...prefix, i], out); });
  else if (v && typeof v === "object") for (const k of Object.keys(v)) { out.push([...prefix, k]); paths((v as Record<string, unknown>)[k], [...prefix, k], out); }
  return out;
}
function getParent(root: unknown, path: (string | number)[]): [Record<string | number, unknown>, string | number] | null {
  let cur = root as Record<string | number, unknown>;
  for (let i = 0; i < path.length - 1; i++) { cur = cur?.[path[i]] as Record<string | number, unknown>; if (!cur || typeof cur !== "object") return null; }
  return [cur, path[path.length - 1]];
}
export type Mutated = { kind: string; spec: unknown };
/** One mutated spec (or raw string for truncated JSON). Deterministic for a (spec, seed) pair. */
export function mutateSpec(base: unknown, seed: number): Mutated {
  const r = rng(seed * 2654435761 + 7);
  const roll = r();
  if (roll < 0.04) return { kind: "empty-object", spec: {} };
  if (roll < 0.07) return { kind: "array", spec: [] };
  if (roll < 0.09) return { kind: "null", spec: null };
  if (roll < 0.14) { const s = JSON.stringify(base); return { kind: "truncated-json", spec: s.slice(0, Math.floor(s.length * (0.2 + r() * 0.7))) }; }
  const spec = structuredClone(base) as Record<string, unknown>;
  const n = 1 + Math.floor(r() * 5);
  const kinds: string[] = [];
  for (let i = 0; i < n; i++) {
    const all = paths(spec);
    if (!all.length) break;
    const p = pick(r, all), pp = getParent(spec, p);
    if (!pp) continue;
    const [parent, key] = pp, cur = parent[key], m = r();
    if (m < 0.2) { if (Array.isArray(parent)) parent.splice(key as number, 1); else delete parent[key]; kinds.push("drop"); }
    else if (m < 0.42) { parent[key] = pick(r, JUNK); kinds.push("junk"); }
    else if (m < 0.58 && typeof cur === "number") { parent[key] = pick(r, [cur * 1000, -cur, cur + 0.5, Number.MAX_SAFE_INTEGER, -0.0001, 1e-12]); kinds.push("range"); }
    else if (m < 0.68 && Array.isArray(cur)) { (cur as unknown[]).push(null, pick(r, JUNK)); if (cur.length) cur[0] = undefined; kinds.push("holes"); }
    else if (m < 0.78 && typeof cur === "string") { parent[key] = pick(r, ["<script>x</script>", cur + "{x}", cur.repeat(30), "3/0", "unknownVerb", "wire-wire", "9,9-9,9", "http://x.y"]); kinds.push("string"); }
    else if (m < 0.86 && cur && typeof cur === "object" && !Array.isArray(cur)) { (cur as Record<string, unknown>)[pick(r, ["do", "check", "kind", "goal", "mode", "line", "put"])] = pick(r, ["explode", "teleport", { nope: 1 }, 42, null]); kinds.push("verb"); }
    else if (Array.isArray(cur)) { parent[key] = Array.from({ length: 60 }, () => structuredClone(cur[0] ?? null)); kinds.push("flood"); }
    else { parent[key] = pick(r, JUNK); kinds.push("junk"); }
  }
  return { kind: kinds.join("+") || "noop", spec };
}
