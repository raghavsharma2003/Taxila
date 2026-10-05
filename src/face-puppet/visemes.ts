// Diya's viseme events → the HeadRig mouth contract (15 Oculus visemes + tongueTipUp / tongueCurl / tongueWide).
// Source of truth for timing: Azure Speech emits a viseme id (0-21) with its audio offset for every phone of the SAME
// synthesis that produced the audio (measured on en-IN-Diya:DragonHDLatestNeural, evals/face-puppet/lipsync-offset.mjs),
// so the mouth is timed by the voice itself, not by an estimate. Erasable TypeScript, pure, no DOM.
//
// Hindi mouth needs (docs/design/teacher/puppet2d/PLAN.md §1.3): Azure's id set is English-phone based. What it cannot
// say, the word text can:
//   - retroflex ट ठ ड ढ ण ड़ ढ़ (tongue tip curled back, the underside visible) arrive as id 19 (d/t/n) → when the
//     word that carries them is Devanagari (or a known Roman retroflex word), its id-19 visemes take tongueCurl;
//   - dental त थ द ध न (tip at the back of the upper teeth) → id 19 with tongueTipUp (Hindi dentals show the tip);
//   - ल → id 14 with tip up + wide blade;  र (tap) → id 13 with a brief tip flick;  व → id 18 at 0.6 (lighter than v);
//   - anusvara / chandrabindu: nasalisation, never a mouth change (no event is invented).

export type VisemeKey =
  | "viseme_sil" | "viseme_PP" | "viseme_FF" | "viseme_TH" | "viseme_DD" | "viseme_kk" | "viseme_CH" | "viseme_SS"
  | "viseme_nn" | "viseme_RR" | "viseme_aa" | "viseme_E" | "viseme_I" | "viseme_O" | "viseme_U";

export interface MouthTarget { v: VisemeKey; w: number; tongue?: Partial<Record<"tongueTipUp" | "tongueCurl" | "tongueWide", number>> }

/** Azure viseme id → contract viseme (+ tongue). Azure ids: learn.microsoft.com "Get facial position with viseme". */
export const AZURE_TO_CONTRACT: readonly MouthTarget[] = [
  { v: "viseme_sil", w: 1 },                                  // 0  silence
  { v: "viseme_aa", w: 0.6 },                                 // 1  æ ə ʌ (Hindi schwa अ: the smaller open)
  { v: "viseme_aa", w: 1 },                                   // 2  ɑ (आ)
  { v: "viseme_O", w: 0.85 },                                 // 3  ɔ
  { v: "viseme_E", w: 0.8 },                                  // 4  ɛ ʊ (ए/ऐ)
  { v: "viseme_RR", w: 0.7 },                                 // 5  ɝ
  { v: "viseme_I", w: 1 },                                    // 6  j i ɪ (इ/ई, य)
  { v: "viseme_U", w: 1 },                                    // 7  w u (उ/ऊ)
  { v: "viseme_O", w: 1 },                                    // 8  o (ओ)
  { v: "viseme_aa", w: 0.9 },                                 // 9  aʊ (औ onset)
  { v: "viseme_O", w: 0.9 },                                  // 10 ɔɪ
  { v: "viseme_aa", w: 0.9 },                                 // 11 aɪ (ऐ in Hinglish)
  { v: "viseme_kk", w: 0.5 },                                 // 12 h (ह: the mouth of the next vowel, half open)
  { v: "viseme_RR", w: 0.8, tongue: { tongueTipUp: 0.45 } },  // 13 ɹ / र tap (a tip flick, less rounding than English r)
  { v: "viseme_nn", w: 1, tongue: { tongueTipUp: 0.8, tongueWide: 0.6 } }, // 14 l (ल)
  { v: "viseme_SS", w: 1 },                                   // 15 s z (स)
  { v: "viseme_CH", w: 1 },                                   // 16 ʃ tʃ dʒ ʒ (श च ज झ)
  { v: "viseme_TH", w: 1 },                                   // 17 ð
  { v: "viseme_FF", w: 1 },                                   // 18 f v (फ़, व lighter: see wordFlags)
  { v: "viseme_DD", w: 1, tongue: { tongueTipUp: 0.8 } },     // 19 d t n θ (Hindi dentals: tip visible)
  { v: "viseme_kk", w: 1 },                                   // 20 k g ŋ (क ग)
  { v: "viseme_PP", w: 1 },                                   // 21 p b m (प ब म: full seal)
];

/** Mouth openness per Azure id, 0..1 (the eval's E1 estimator and the jaw drive use the same table). */
export const OPENNESS: readonly number[] = [0, 0.6, 1, 0.8, 0.6, 0.45, 0.35, 0.3, 0.7, 0.9, 0.75, 0.9, 0.4, 0.35, 0.3, 0.15, 0.2, 0.2, 0.1, 0.2, 0.35, 0];

const RETRO_DEV = /[टठडढणड़ढ़]/u;
const DENTAL_DEV = /[तथदधन]/u;
const VA_DEV = /व/u;
/** Roman Hinglish words whose t/d is retroflex (ट/ड) in common school speech. Small, honest list: a word not here keeps
 *  the dental shape, which is the commoner Hindi stop and the safe default (a curl on a dental reads wrong). */
const RETRO_ROMAN = new Set(["baanta", "baant", "baantte", "baantna", "thoda", "thodi", "thode", "dabba", "dibba", "ghanta", "ghante", "tukda", "tukde", "tukdon", "ladka", "ladki", "bada", "badi", "bade", "pedh", "ped", "kitab", "dar", "dhoondh", "dhundh", "pattern", "lattoo", "chhota", "chhoti", "chhote", "mota", "moti", "gaadi", "ganda", "anda", "danda", "jhanda", "pahad", "sadak", "ude", "ud"]);

/** Per-word hints from the word text (Devanagari or Roman): how its id-19 / id-18 visemes should be drawn. */
export function wordFlags(text: string): { retroflex: number; dental: boolean; va: boolean } {
  const w = text.normalize("NFC");
  if (/[ऀ-ॿ]/u.test(w)) {
    // count retroflex letters so only that many id-19 events of the word curl (in order of appearance)
    // only the word's retroflex letters curl; its dentals keep the tip-up (order is not tracked: a word mixing both,
    // e.g. ठंडा, curls its first N stops, an accepted approximation logged in the V4 report)
    const chars = [...w];
    return { retroflex: chars.filter((c) => RETRO_DEV.test(c)).length, dental: chars.some((c) => DENTAL_DEV.test(c)), va: VA_DEV.test(w) };
  }
  const r = w.toLowerCase().replace(/[^a-z]/g, "");
  return { retroflex: RETRO_ROMAN.has(r) ? 1 : 0, dental: true, va: /^v|[aeiou]v/.test(r) && !/ve?$/.test(r) };
}

/** One timed mouth event, ms from the part's first sample. */
export interface TimedViseme { ms: number; id: number; target: MouthTarget }

/**
 * Resolve a part's raw Azure events into timed mouth targets, applying the word-text Hindi rules. Words are matched to
 * visemes by time (a viseme belongs to the word whose [ms, ms + durMs) holds it).
 */
export function resolveVisemes(visemes: ReadonlyArray<{ ms: number; id: number }>, words: ReadonlyArray<{ ms: number; durMs: number; text: string }> = []): TimedViseme[] {
  const out: TimedViseme[] = [];
  const flags = words.map((w) => ({ ...w, f: wordFlags(w.text), curls: 0 }));
  for (const v of visemes) {
    const base = AZURE_TO_CONTRACT[v.id] ?? AZURE_TO_CONTRACT[0];
    let target: MouthTarget = base;
    const w = flags.find((x) => v.ms >= x.ms - 10 && v.ms < x.ms + x.durMs + 10);
    if (w) {
      if (v.id === 19 && w.curls < w.f.retroflex) {
        // the first N stops of a retroflex word curl; the curl replaces the tip-up (the tip is back, not at the teeth)
        target = { v: "viseme_DD", w: 1, tongue: { tongueCurl: 0.9, tongueTipUp: 0 } };
        w.curls++;
      } else if (v.id === 18 && w.f.va) target = { v: "viseme_FF", w: 0.6 };
    }
    out.push({ ms: v.ms, id: v.id, target });
  }
  return out;
}

/**
 * The mouth weights at time `ms` (from the part's first sample) for a resolved track. Coarticulation as the judged
 * runtime does it (polish r8 demo visemesAt, the clip judged 4.0-4.1): each viseme ramps in over the 50 ms before its
 * onset and out over 50 ms after its end, max-combined; tongue keys ride their viseme's envelope. No minimum hold
 * (avatar-lipsync-dead-ends #2: holds cut accuracy r 0.43 → 0.16). `out` is cleared and filled (no allocation).
 */
export function weightsAt(track: readonly TimedViseme[], ms: number, out: Record<string, number>, from = 0): number {
  for (const k in out) delete out[k];
  const RAMP = 50;
  // binary search the first event that could still be active
  let lo = from, hi = track.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (track[mid].ms < ms - 400) lo = mid + 1; else hi = mid; }
  let jaw = 0;
  for (let k = Math.max(0, lo - 1); k < track.length; k++) {
    const e = track[k];
    if (e.ms > ms + RAMP) break;
    const t1 = k + 1 < track.length ? track[k + 1].ms : e.ms + 120;
    const w = Math.max(0, Math.min(1, (ms - (e.ms - RAMP)) / RAMP, (t1 + RAMP - ms) / RAMP));
    if (w <= 0) continue;
    const tw = w * e.target.w;
    const key = e.target.v;
    if ((out[key] ?? 0) < tw) out[key] = tw;
    if (e.target.tongue) for (const [tk, tv] of Object.entries(e.target.tongue)) { const x = (tv ?? 0) * w; if ((out[tk] ?? 0) < x) out[tk] = x; }
    jaw = Math.max(jaw, (OPENNESS[e.id] ?? 0) * w);
  }
  out.jawOpen = jaw * 0.62; // the rig's jaw ceiling region: aa at full open lands ~0.62 (the judged clips' audio jaw peak)
  return lo;
}
