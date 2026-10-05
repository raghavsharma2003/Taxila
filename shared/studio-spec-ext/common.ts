// Shared helpers for the studio-spec@2 EXTENSION archetypes (VALUES-100 V3.1: every class 4-7 topic, every subject).
// Same contract as shared/studio-spec.ts (schema + reviewed default + repair + pure grader per archetype); the base
// module's private helpers are re-stated here so the base file stays untouched while Wave 2 merges.
//
// Differences from the base contract, on purpose:
//   - topics: all six class 4-7 subjects (maths, science, evs, english, hindi, sst), not maths/science/evs only;
//   - the child-safety floor is a PREDICATE here: any c7-science-ch06 (Adolescence) tag is dropped by repair and
//     rejected by the strict schema, so no generated piece can ever be tagged to that chapter;
//   - every keyed item may carry `src` (a kit item id). The catalogue pipeline cross-checks the key against the kit's
//     verified answer and a second model; the engine never needs it.
// Erasable TypeScript only (no enums/namespaces), so plain Node (type stripping) and the server can import it.
import { z } from "zod";
import type { Graded, Lang, Repaired } from "../studio-spec.ts";

export type { Graded, Lang, Repaired };
export type SubjectExt = "maths" | "science" | "evs" | "english" | "hindi" | "sst";
export type KindExt = "game" | "simulation" | "explainer";
export interface OutcomesExt { classes: number[]; subjects: SubjectExt[]; topics: string[]; misconceptions: string[] }
export interface ExtSpecDef<S> {
  archetype: string; title: string; kind: KindExt; subjects: SubjectExt[];
  /** one line: what the child's act is, in the engine (catalogue, judges and the planner read it) */
  act: string;
  outcomes: OutcomesExt;
  schema: z.ZodType<S>;
  defaultSpec: S;
  repair(raw: Record<string, unknown>, r: string[]): S | null;
  grade(spec: S, itemId: string, value: unknown): Graded;
  /** the keyed items a spec carries, for the catalogue's key cross-check: id, the key as text, and its kit source */
  keys(spec: S): { itemId: string; key: string; src?: string; prompt?: string }[];
}

export const MARKUP = /[<>{}\\`]|https?:|www\.|javascript:|data:|\bNaN\b|\bundefined\b|\bnull\b|\bInfinity\b|\[object /i;
export const TOPIC_RE_EXT = /^c[4-7]-(maths|science|evs|english|hindi|sst)-ch\d{2}-t\d{2}$/;
/** Child-safety floor (STUDIO-V2 §6.2): the Adolescence chapter gets no generated game or animation. */
export const SAFETY_EXCLUDED = /^c7-science-ch06(-|$)/;
export const isTopicOk = (s: unknown): s is string => typeof s === "string" && TOPIC_RE_EXT.test(s) && !SAFETY_EXCLUDED.test(s);
export const SRC_RE = /^c[4-7]-[a-z]+-ch\d{2}-t\d{2}-(i\d{2,3}|m-[a-z0-9-]{1,60}|m\d{1,2})$/;
export const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const clampN = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const safeStr = (max: number) => z.string().min(1).max(max).refine((s) => !MARKUP.test(s), "markup");
export const UNGRADED: Graded = { verdict: "ungraded", truth: null, detail: "unknown-item" };

export function str(v: unknown, max: number, dflt: string, key: string, r: string[]): string {
  if (typeof v === "string" && v.trim().length > 0 && v.length <= max && !MARKUP.test(v)) return v.trim();
  if (v !== undefined) r.push("string:" + key);
  return dflt;
}
/** A required string with no default: null when invalid (the caller drops the item). */
export function reqStr(v: unknown, max: number, key: string, r: string[]): string | null {
  if (typeof v === "string" && v.trim().length > 0 && v.length <= max && !MARKUP.test(v)) return v.trim();
  r.push("string:" + key); return null;
}
export function num(v: unknown, lo: number, hi: number, dflt: number, key: string, r: string[], int = false): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    let x = int ? Math.round(v) : v;
    if (x < lo || x > hi) { r.push("clamp:" + key); x = clampN(x, lo, hi); }
    return x;
  }
  if (v !== undefined) r.push("num:" + key);
  return dflt;
}
/** A required finite number: null when invalid (never clamped silently into a different key). */
export function reqNum(v: unknown, lo: number, hi: number, key: string, r: string[], int = false): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi && (!int || Number.isInteger(v))) return v;
  r.push("num:" + key); return null;
}
export function bool(v: unknown, dflt: boolean): boolean { return typeof v === "boolean" ? v : dflt; }
export function arr(v: unknown, key: string, r: string[]): unknown[] {
  if (Array.isArray(v)) return v;
  if (v !== undefined) r.push("array:" + key);
  return [];
}
export function oneOf<T extends string>(v: unknown, list: readonly T[], dflt: T, key: string, r: string[]): T {
  if (typeof v === "string" && (list as readonly string[]).includes(v)) return v as T;
  if (v !== undefined) r.push("enum:" + key);
  return dflt;
}
export function strings<T extends Record<string, string>>(raw: unknown, defaults: T, max: number, r: string[]): T {
  const out = { ...defaults };
  if (raw === undefined) return out;
  if (!isObj(raw)) { r.push("strings:not-an-object"); return out; }
  for (const k of Object.keys(defaults)) if (k in raw) (out as Record<string, string>)[k] = str(raw[k], max, defaults[k], k, r);
  return out;
}
export function stringsSchema<T extends Record<string, string>>(defaults: T, max: number) {
  return z.object(Object.fromEntries(Object.keys(defaults).map((k) => [k, safeStr(max)]))) as unknown as z.ZodType<T>;
}
export function envelope(raw: Record<string, unknown>, def: { skills: string[]; lang: Lang }, r: string[]) {
  const all = arr(raw.skills, "skills", r);
  const sk = all.filter(isTopicOk).slice(0, 6);
  if (all.some((s) => typeof s === "string" && SAFETY_EXCLUDED.test(s))) r.push("safety:excluded-topic");
  return { skills: sk.length ? sk : def.skills, lang: oneOf(raw.lang, ["en", "hi", "hinglish"] as const, def.lang, "lang", r) };
}
export const EnvelopeExt = {
  skills: z.array(z.string().regex(TOPIC_RE_EXT).refine((s) => !SAFETY_EXCLUDED.test(s), "safety")).min(1).max(6),
  lang: z.enum(["en", "hi", "hinglish"]),
};
export function src(v: unknown, r: string[]): { src?: string } {
  if (v === undefined) return {};
  if (typeof v === "string" && SRC_RE.test(v)) return { src: v };
  r.push("src"); return {};
}
export const SrcField = { src: z.string().regex(SRC_RE).optional() };
export function targets(v: unknown, r: string[]): { targets?: string } {
  if (v === undefined) return {};
  if (typeof v === "string" && /^c[4-7]-[a-z]+-ch\d{2}-t\d{2}-(m-[a-z0-9-]{1,60}|m\d{1,2})$/.test(v)) return { targets: v };
  r.push("targets"); return {};
}
export const TargetsField = { targets: z.string().regex(/^c[4-7]-[a-z]+-ch\d{2}-t\d{2}-(m-[a-z0-9-]{1,60}|m\d{1,2})$/).optional() };
export function within(v: unknown, key: number, rightTol: number, partialTol: number): Graded {
  if (typeof v !== "number" || !Number.isFinite(v)) return { verdict: "wrong", truth: key, detail: "no-value" };
  const e = Math.abs(v - key);
  return { verdict: e <= rightTol + 1e-9 ? "right" : e <= partialTol + 1e-9 ? "partial" : "wrong", truth: key, error: +e.toFixed(4) };
}
/** Normalised text compare for short keyed answers (case, spaces, punctuation, Devanagari nukta variants). */
export function normText(s: unknown): string {
  return String(s ?? "").normalize("NFC").toLowerCase().replace(/़/g, "").replace(/[\s.,;:!?'"“”‘’()\-–—।]+/g, " ").trim();
}
export const uniq = <T>(a: T[]) => [...new Set(a)];
/** Deterministic LCG for spec-derived streams (the same spec + seed gives the same run on client and server). */
export function lcg(seed: number): () => number { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function idOk(v: unknown, max = 16): v is string { return typeof v === "string" && /^[A-Za-z0-9_-]{1,16}$/.test(v) && v.length <= max; }

/** Validate-or-default shell shared by every ext archetype (mirrors base validateSpec). Never throws. */
export function validateWith<S>(d: ExtSpecDef<S>, archetype: string, raw: unknown): Repaired<S> & { archetype: string } {
  const repairs: string[] = [];
  let v: unknown = raw;
  if (typeof v === "string") { try { v = JSON.parse(v); } catch { repairs.push("spec_unparseable:json"); v = null; } }
  if (!isObj(v)) { if (v !== undefined) repairs.push("spec_unparseable:not-an-object"); return { archetype, spec: structuredClone(d.defaultSpec), repairs: [...repairs, "fallback-default"], fellBack: true }; }
  if (v.archetype !== undefined && v.archetype !== archetype) repairs.push("archetype-mismatch");
  let out: S | null = null;
  try { out = d.repair(v, repairs); } catch (e) { repairs.push("repair-threw:" + String((e as Error)?.message ?? e).slice(0, 60)); out = null; }
  if (out) {
    const p = d.schema.safeParse(out);
    if (p.success) return { archetype, spec: p.data as S, repairs, fellBack: false };
    repairs.push("schema:" + p.error.issues.slice(0, 3).map((i) => i.path.join(".")).join("|"));
  }
  return { archetype, spec: structuredClone(d.defaultSpec), repairs: [...repairs, "fallback-default"], fellBack: true };
}

// ───────────────────────────── shared truths used by several archetypes ─────────────────────────────
export function gcdN(a: number, b: number): number { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a || 1; }
export const lcmN = (a: number, b: number) => Math.abs(a * b) / gcdN(a, b);
export function isPrime(n: number): boolean { if (!Number.isInteger(n) || n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; }
export function factorsOf(n: number): number[] { const out: number[] = []; for (let k = 1; k <= n; k++) if (n % k === 0) out.push(k); return out; }
export function primeFactors(n: number): number[] { const out: number[] = []; let m = Math.abs(Math.round(n)); for (let k = 2; k * k <= m; k++) while (m % k === 0) { out.push(k); m /= k; } if (m > 1) out.push(m); return out; }
export const digitSum = (n: number) => String(Math.abs(Math.trunc(n))).split("").reduce((a, d) => a + +d, 0);
export const isPalindrome = (n: number) => { const s = String(Math.abs(Math.trunc(n))); return s === [...s].reverse().join(""); };

/**
 * Hindi मात्रा (metrical weight) of a word or line, by the classical laghu/guru rules used in NCERT class 6 (doha):
 * short vowel (अ इ उ ऋ, or a consonant with inherent a / ि / ु / ृ) = 1; long vowel (आ ई ऊ ए ऐ ओ औ and their signs) = 2;
 * anusvara (ं) or visarga (ः) makes the syllable guru (2); a syllable followed by a conjunct (halant cluster) becomes
 * guru; chandrabindu (ँ) does not change weight; a halant-final consonant adds nothing. Returns per-syllable weights.
 * Exceptions exist in real recitation (a few conjunct contexts read laghu); the catalogue cross-checks with the kit.
 */
export function matraWeights(text: string): { syl: string; w: 1 | 2 }[] {
  const LONG_SIGNS = "ाीूेैोौॠ";
  const SHORT_SIGNS = "िुृ";
  const LONG_V = "आईऊएऐओऔॠ", SHORT_V = "अइउऋ";
  const out: { syl: string; w: 1 | 2 }[] = [];
  const s = text.normalize("NFC");
  const isCons = (c: string) => c >= "क" && c <= "ह" || c === "क़" || (c >= "ख़" && c <= "य़");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (LONG_V.includes(c) || SHORT_V.includes(c)) {
      let syl = c, w: 1 | 2 = LONG_V.includes(c) ? 2 : 1; i++;
      while (i < s.length && "ंःँ".includes(s[i])) { if (s[i] !== "ँ") w = 2; syl += s[i]; i++; }
      out.push({ syl, w }); continue;
    }
    if (isCons(c)) {
      let syl = c; i++;
      if (s[i] === "़") { syl += s[i]; i++; }
      if (s[i] === "्") {                           // halant: a cluster. The consonant joins the NEXT syllable and
        syl += s[i]; i++;                                // makes the PREVIOUS one guru (if it exists in this word).
        if (out.length && i < s.length && isCons(s[i])) out[out.length - 1].w = 2;
        // carry the half consonant into the next syllable's text
        let next = syl;
        while (i < s.length && isCons(s[i])) {
          next += s[i]; i++;
          if (s[i] === "़") { next += s[i]; i++; }
          if (s[i] === "्") { next += s[i]; i++; continue; }
          break;
        }
        if (next === syl) continue;                      // halant-final: weightless
        let w: 1 | 2 = 1;
        if (i < s.length && LONG_SIGNS.includes(s[i])) { w = 2; next += s[i]; i++; }
        else if (i < s.length && SHORT_SIGNS.includes(s[i])) { next += s[i]; i++; }
        while (i < s.length && "ंःँ".includes(s[i])) { if (s[i] !== "ँ") w = 2; next += s[i]; i++; }
        out.push({ syl: next, w }); continue;
      }
      let w: 1 | 2 = 1;
      if (i < s.length && LONG_SIGNS.includes(s[i])) { w = 2; syl += s[i]; i++; }
      else if (i < s.length && SHORT_SIGNS.includes(s[i])) { syl += s[i]; i++; }
      while (i < s.length && "ंःँ".includes(s[i])) { if (s[i] !== "ँ") w = 2; syl += s[i]; i++; }
      out.push({ syl, w }); continue;
    }
    i++;                                                 // spaces, danda, punctuation, Latin: no weight
  }
  return out;
}
export const matraCount = (text: string) => matraWeights(text).reduce((a, x) => a + x.w, 0);
