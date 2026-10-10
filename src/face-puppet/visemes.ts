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

// NFC keeps ड़ / ढ़ decomposed (ड / ढ + nukta U+093C): the base letter is matched, the nukta is never a stop
const RETRO_DEV = /[टठडढण]/u;
const DENTAL_DEV = /[तथदधन]/u;
const VA_DEV = /व/u;
/** Roman Hinglish words with a retroflex (ट/ड) stop in common school speech, and WHICH of their t/d/n stops it is
 *  ("R" retroflex, "D" dental, one letter per stop in reading order; th/dh and geminates are one stop, n before k/g is
 *  not a stop). Small, honest list: a word not here keeps the dental shape, the commoner Hindi stop and the safe default. */
const RETRO_ROMAN: Record<string, string> = {
  // Review v4 (2026-10-05): a nasal before a retroflex stop is the retroflex ण (homorganic: ghanta, anda, danda, jhanda
  // are "RR"/"RRR", not "DR"); ढूंढ (dhoondh) starts and ends with ढ ("RDR" was "DR", which curled the nasal); गंदा
  // (ganda, "dirty") is dental द ("DD", was "DR").
  baanta: "DR", baant: "DR", baantte: "DR", baantna: "DRD", thoda: "DR", thodi: "DR", thode: "DR", dabba: "R", dibba: "R",
  ghanta: "RR", ghante: "RR", tukda: "RR", tukde: "RR", tukdon: "RRD", ladka: "R", ladki: "R", bada: "R", badi: "R", bade: "R",
  ped: "R", pedh: "R", dar: "R", dhoondh: "RDR", dhundh: "RDR", pattern: "RD", chhota: "R", chhoti: "R", chhote: "R", mota: "R",
  moti: "R", gaadi: "R", ganda: "DD", anda: "RR", danda: "RRR", jhanda: "RR", pahad: "R", sadak: "R", ude: "R", ud: "R", tota: "DD",
};

/** The t/d/n stops of one Roman word in reading order, with their retroflex flags (lexicon, else all dental). */
function romanStops(w: string): boolean[] {
  const pat = RETRO_ROMAN[w];
  const out: boolean[] = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1] ?? "";
    if (c !== "t" && c !== "d" && c !== "n") continue;
    if (c === "n" && (n === "k" || n === "g")) continue;      // ŋ: a velar, Azure id 20
    if (n === c || n === "h") i++;                              // a geminate, th, dh: one stop
    out.push(pat ? pat[out.length] === "R" : false);
  }
  return out;
}

/** The t/d/n stops of one Devanagari word in reading order (anusvara before a dental is an n stop). */
function devStops(w: string): boolean[] {
  const ch = [...w], out: boolean[] = [];
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    if (RETRO_DEV.test(c)) out.push(true);
    else if (DENTAL_DEV.test(c)) out.push(false);
    else if (c === "ं" && DENTAL_DEV.test(ch[i + 1] ?? "")) out.push(false);
    else if (c === "ं" && RETRO_DEV.test(ch[i + 1] ?? "")) out.push(true); // homorganic ण before ट/ड (ठंडा), Review v4
  }
  return out;
}

/** Per-word hints from the word text: its stops' retroflex pattern in order, and whether a v is the light व. */
export function wordFlags(text: string): { stops: boolean[]; retroflex: number; va: boolean } {
  const w = text.normalize("NFC");
  const dev = /[ऀ-ॿ]/u.test(w);
  const r = dev ? w : w.toLowerCase().replace(/[^a-z]/g, "");
  const stops = dev ? devStops(w) : romanStops(r);
  return { stops, retroflex: stops.filter(Boolean).length, va: dev ? VA_DEV.test(w) : /^v|[aeiou]v/.test(r) && !/ve?$/.test(r) };
}

/**
 * The tongue flag of every alveolar/dental/retroflex stop the TEXT predicts, in reading order (true = retroflex curl).
 * Used when a part came without word boundaries: Azure's word events cost a median +378 ms of first audio together with visemes (bimodal, n = 8, eval proxy)
 * (evals/face-puppet/out/ttfb-warm.json), so the first part of a reply asks for visemes only; the list is applied only
 * when its length equals Azure's id-19 count (resolveVisemes). Accuracy: evals/face-puppet/retro-align.mjs.
 */
export function stopFlagsFromText(text: string): boolean[] {
  const out: boolean[] = [];
  for (const raw of text.normalize("NFC").split(/[\s,.;:!?।"'()\-]+/u)) if (raw) out.push(...wordFlags(raw).stops);
  return out;
}

/** One timed mouth event, ms from the part's first sample. */
export interface TimedViseme { ms: number; id: number; target: MouthTarget }

// Round 4 (Asha lamp1): bilabial seals from the word text. Measured on Diya DragonHD reading a romanised Hinglish line
// (docs/design/round4/asha/evidence/stageC-log-412.json, 2026-10-10): of 9 words with a b / m / p sound, Azure's viseme
// track held a viseme 21 (p b m) for 5 and none for 4 (baarah, pencil, dabbon, batao), so the mouth never sealed on them,
// although the rig seals on every 21 it is given (lip gap 0.00 px at each). Only where Azure gave a word NO 21 at all:
//   - a word-initial b / bh / p / m (Roman) or प ब भ म (Devanagari): one 21 at the word start - 20 ms (Azure's own seals
//     on that line sit 30 ms before to 10 ms after the word start);
//   - else a word-internal bb / pp / mm / mb / mp (Roman): one 21 at that letter's share of the word's duration.
// "ph" is left to Azure (Hinglish "phir" is [pʰ], English "phone" is [f]). With the rule: 9 / 9 sealed on that line.
// One line, n = 9 words: the timing rule is a measured heuristic, not a forced alignment (open: the 24-line battery).
const BILABIAL_ONSET_ROMAN = /^(?:bh|b|p(?!h)|m)/;
const BILABIAL_ONSET_DEV = /^[पबभम]/u;
const BILABIAL_INNER_ROMAN = /(?:bb|pp|mm|mb|mp)/;
export function addBilabials(visemes: ReadonlyArray<{ ms: number; id: number }>, words: ReadonlyArray<{ ms: number; durMs: number; text: string }>): { ms: number; id: number }[] {
  const out = visemes.map((v) => ({ ms: v.ms, id: v.id }));
  if (!words.length) return out;
  const has21 = (a: number, b: number) => visemes.some((v) => v.id === 21 && v.ms >= a && v.ms <= b);
  for (const w of words) {
    const raw = String(w.text || "").normalize("NFC");
    const dev = /[ऀ-ॿ]/u.test(raw);
    const r = dev ? raw : raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!r || has21(w.ms - 60, w.ms + w.durMs)) continue;
    let at: number | null = null;
    if (dev ? BILABIAL_ONSET_DEV.test(r) : BILABIAL_ONSET_ROMAN.test(r)) at = w.ms - 20;
    else if (!dev) { const m = BILABIAL_INNER_ROMAN.exec(r); if (m) at = Math.round(w.ms + w.durMs * ((m.index + 1) / r.length)); }
    if (at == null) continue;
    // never on top of another event: 15 ms clear of the one before
    const prev = out.filter((v) => v.ms <= at!).reduce((a, v) => Math.max(a, v.ms), -Infinity);
    if (at - prev < 15) at = prev + 15;
    out.push({ ms: at, id: 21 });
  }
  out.sort((a, b) => a.ms - b.ms);
  return out;
}

// The EXTENDED rule (round 4 rig2, lamp2 only: dc-r4a-lamp2-owner-cohort): after addBilabials, a word that still holds no
// 21 gets one per single b / m / p letter, inside or at the end of the word (tum, Ab, about, carbon, dhoop, lagbhag, खुशबू,
// Shabash, vaashpikaran): at the letter's share of the word's duration, or 45 ms before the word's end for a final
// letter. "ph" stays Azure's. Measured (evals/face-puppet/lipsync-looks.mjs, 24 Diya lines, 132 bilabial words): lamp2
// 123 -> 132 sealed, r8 122 -> 132, offset unchanged on both. r8 keeps the base rule until the main session judges r8's
// contact sheet (docs/design/round4/build/asha/bilabial-sheet/).
const BILABIAL_DEV_LETTER = /[पबभम]/u;
export function addBilabialsExtended(visemes: ReadonlyArray<{ ms: number; id: number }>, words: ReadonlyArray<{ ms: number; durMs: number; text: string }>): { ms: number; id: number }[] {
  const base = addBilabials(visemes, words);
  if (!words.length) return base;
  const out = base.slice();
  const has21 = (a: number, b: number) => base.some((v) => v.id === 21 && v.ms >= a && v.ms <= b);
  for (const w of words) {
    const raw = String(w.text || "").normalize("NFC");
    if (has21(w.ms - 60, w.ms + w.durMs)) continue;
    const dev = /[ऀ-ॿ]/u.test(raw);
    const letters = dev ? [...raw].filter((c) => /[ऀ-ॿ]/u.test(c)) : [...raw.toLowerCase().replace(/[^a-z]/g, "")];
    const n = letters.length;
    for (let i = 0; i < n; i++) {
      const c = letters[i];
      const bil = dev ? BILABIAL_DEV_LETTER.test(c) : c === "b" || c === "m" || (c === "p" && letters[i + 1] !== "h");
      if (!bil) continue;
      let at = i === n - 1 ? w.ms + w.durMs - 45 : Math.round(w.ms + w.durMs * ((i + 0.5) / n));
      const prev = out.filter((v) => v.ms <= at).reduce((a, v) => Math.max(a, v.ms), -Infinity);
      if (at - prev < 15) at = prev + 15;
      out.push({ ms: at, id: 21 });
    }
  }
  out.sort((a, b) => a.ms - b.ms);
  return out;
}

/**
 * Resolve a part's raw Azure events into timed mouth targets, applying the word-text Hindi rules. Words are matched to
 * visemes by time (a viseme belongs to the word whose [ms, ms + durMs) holds it).
 */
export function resolveVisemes(visemes0: ReadonlyArray<{ ms: number; id: number }>, words: ReadonlyArray<{ ms: number; durMs: number; text: string }> = [], text?: string, opts: { extendedBilabials?: boolean } = {}): TimedViseme[] {
  // round 4: the seals Azure's track leaves out (above); the extended rule only where the look asks for it (lamp2)
  const visemes = opts.extendedBilabials ? addBilabialsExtended(visemes0, words) : addBilabials(visemes0, words);
  const out: TimedViseme[] = [];
  const flags = words.map((w) => ({ ...w, f: wordFlags(w.text), k: 0, n19: 0 }));
  const wordOf = (ms: number) => flags.find((x) => ms >= x.ms - 10 && ms < x.ms + x.durMs + 10);
  // Review v4 (2026-10-05): a word's k-th stop letter is put on its k-th id-19 event ONLY when the word holds exactly as
  // many id-19 events as the text has stops. Measured on the 24-line battery (evals/face-puppet/retro-words.mjs): Azure's
  // Hinglish ids put extra id-19 events in words (Roman "ch"/"chh" onsets, a geminate read as two, a word-start event
  // that belongs to the previous phone), and the ungated mapping drew 4 of its 10 curls on the wrong sound (bada, dhoondh,
  // chhoti, chhota). A refused word draws every stop as the dental tip-up, the same default as a refused viseme-only part.
  for (const v of visemes) if (v.id === 19) { const w = wordOf(v.ms); if (w) w.n19++; }
  // no word events: the text's stop list, consumed in order by the id-19 events, ONLY when its length equals Azure's id-19
  // count (else the order cannot be trusted: on the battery a blind mapping put 7 curls on dentals for 4 right ones,
  // evals/face-puppet/out/retro-align.json). A refused mapping draws every stop as the dental tip-up (the commoner stop).
  let seq = !words.length && text ? stopFlagsFromText(text) : null;
  if (seq && seq.length !== visemes.filter((v) => v.id === 19).length) seq = null;
  let k19 = 0;
  for (const v of visemes) {
    if (seq && v.id === 19) {
      const curl = seq[k19++] === true;
      out.push({ ms: v.ms, id: v.id, target: curl ? { v: "viseme_DD", w: 1, tongue: { tongueCurl: 0.9, tongueTipUp: 0 } } : AZURE_TO_CONTRACT[19] });
      continue;
    }
    const base = AZURE_TO_CONTRACT[v.id] ?? AZURE_TO_CONTRACT[0];
    let target: MouthTarget = base;
    const w = wordOf(v.ms);
    if (w) {
      if (v.id === 19) {
        // the word's k-th stop takes the k-th letter's place: retroflex curls (the tip is back, not at the teeth)
        if (w.f.stops[w.k++] === true && w.n19 === w.f.stops.length) target = { v: "viseme_DD", w: 1, tongue: { tongueCurl: 0.9, tongueTipUp: 0 } };
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
