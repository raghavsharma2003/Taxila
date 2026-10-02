// Transcript-derived voice features: word count, Hinglish fillers, repetitions, self-corrections, and reading
// fluency (words correct per minute) by token alignment against a read-aloud target. Pure; runs in Node tests.
//
// Measurement caveat (docs/research/voice/asr-kids-hinglish.md): Azure gpt-4o-transcribe has no verbatim switch
// and tends to clean fillers and false starts out, so these counts UNDER-read real disfluency. They are only
// ever used as per-child z-scores, which absorbs a constant per-child bias, and acoustic proxies
// (pauses, flatVoicedRuns) carry the ASR-independent half of the signal.

export interface Token {
  /** Normalised word (lowercase, letters/marks/digits only). */
  w: string;
  /** Punctuation (comma, ellipsis, dash, full stop) directly followed this word in the transcript. */
  punctAfter: boolean;
  /** The word was cut off ("th-", "fi—"): a part-word false start. */
  fragment: boolean;
}

/** Fillers that are never content. Elongations ("ummmm", "hmmm") are matched by pattern. */
const PURE_FILLER = /^(u+m+|u+h+m*|h+m+|m+|e+r+m*|e+h+|a+h+|a{2,}|उ+म+्?म*|हम्म+|अ+ं*|आ+)$/u;
/**
 * Discourse fillers that are ALSO real words ("woh" = that, "haan" = yes, "matlab" = meaning). Counted only
 * where they behave like fillers: next to another filler, before punctuation (the ASR heard a pause), or
 * opening a longer utterance. "haan" alone is an answer, never a filler.
 */
const DISCOURSE_FILLER = new Set([
  "matlab", "woh", "wo", "voh", "haan", "han", "toh", "achha", "acha", "accha", "yaani", "yani",
  "like", "basically", "actually", "so",
  "मतलब", "वो", "वह", "हाँ", "हां", "तो", "अच्छा", "यानी",
]);
/** Hindi/English reduplication is grammar, not disfluency ("jaldi jaldi", "kya kya", "alag alag"). */
const REDUPLICATIVE = new Set([
  "jaldi", "dheere", "dhire", "kya", "alag", "thoda", "bahut", "saath", "ghar", "kabhi", "kahin", "kuch",
  "baar", "chhote", "bade", "garam", "very", "bye", "ha", "haha", "no", "nahi", "nahin", "hello",
  "जल्दी", "धीरे", "क्या", "अलग", "थोड़ा", "बहुत", "कभी", "कुछ", "नहीं",
]);
/** Words that, standing alone between punctuation mid-utterance, retract what came before ("five, nahi, six"). */
const RETRACT = new Set(["nahi", "nahin", "nai", "no", "sorry", "wait", "galat", "नहीं", "सॉरी"]);
const CORRECTION_PHRASES: string[][] = [
  ["i", "mean"], ["no", "wait"], ["nahi", "nahi"], ["nahin", "nahin"], ["नहीं", "नहीं"], ["matlab", "nahi"],
  ["sorry", "sorry"], ["oh", "no"], ["galti", "se"], ["ek", "minute"],
];

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const re = /([\p{L}\p{M}\p{N}']+)(-(?=\s|$)|—)?([\s]*[,.…!?;:—-]+)?/gu;
  for (const m of String(text || "").normalize("NFC").toLowerCase().matchAll(re)) {
    const w = m[1].replace(/'/g, "");
    if (!w) continue;
    out.push({ w, fragment: !!m[2], punctAfter: !!m[3] || !!m[2] });
  }
  return out;
}

export const isPureFiller = (w: string): boolean => PURE_FILLER.test(w);

export interface TranscriptStats {
  /** Content words: tokens minus fillers. */
  words: number;
  fillerCount: number;
  repetitionCount: number;
  selfCorrectionCount: number;
  /** (fillers + repetitions + self-corrections) per 100 content words. */
  disfluencyPer100Words: number;
}

export function transcriptStats(text: string): TranscriptStats {
  const t = tokenize(text);
  const filler = new Array<boolean>(t.length).fill(false);
  t.forEach((tok, i) => { if (isPureFiller(tok.w)) filler[i] = true; });
  // Discourse fillers: two passes so a run "umm matlab woh" counts every member.
  for (let pass = 0; pass < 2; pass++) {
    t.forEach((tok, i) => {
      if (filler[i] || !DISCOURSE_FILLER.has(tok.w) || t.length < 2) return;
      const nearFiller = filler[i - 1] || filler[i + 1];
      const opensLong = i === 0 && t.length >= 4 && tok.punctAfter;
      if (nearFiller || (tok.punctAfter && i < t.length - 1) || opensLong) filler[i] = true;
    });
  }
  const content = t.filter((_, i) => !filler[i]);

  let selfCorrectionCount = 0;
  const usedInCorrection = new Set<number>();
  for (let i = 0; i < content.length; i++) {
    const ph = CORRECTION_PHRASES.find((p) => p.every((w, k) => content[i + k]?.w === w));
    if (ph) {
      selfCorrectionCount++;
      for (let k = 0; k < ph.length; k++) usedInCorrection.add(i + k);
      i += ph.length - 1;
      continue;
    }
    const tok = content[i];
    // "five, nahi, six": a retraction word set off by punctuation, mid-utterance.
    if (RETRACT.has(tok.w) && i > 0 && i < content.length - 1 && (content[i - 1].punctAfter || tok.punctAfter)) {
      selfCorrectionCount++;
      usedInCorrection.add(i);
      continue;
    }
    // A cut-off word followed by a different word: "thr- four".
    if (tok.fragment && content[i + 1] && !content[i + 1].w.startsWith(tok.w)) {
      selfCorrectionCount++;
      usedInCorrection.add(i);
    }
  }

  let repetitionCount = 0;
  for (let i = 1; i < content.length; i++) {
    if (usedInCorrection.has(i) || usedInCorrection.has(i - 1)) continue;
    const prev = content[i - 1], cur = content[i];
    // Part-word repetition: "th- three".
    if (prev.fragment && cur.w.startsWith(prev.w)) { repetitionCount++; continue; }
    if (cur.w === prev.w && !REDUPLICATIVE.has(cur.w) && !/^\d+$/.test(cur.w)) { repetitionCount++; continue; }
    // Two-word repetition: "is the is the".
    if (i >= 3 && cur.w === content[i - 2].w && prev.w === content[i - 3].w && cur.w !== prev.w) repetitionCount++;
  }
  const fillerCount = filler.filter(Boolean).length;
  const words = content.length;
  return {
    words,
    fillerCount,
    repetitionCount,
    selfCorrectionCount,
    disfluencyPer100Words: words ? (100 * (fillerCount + repetitionCount + selfCorrectionCount)) / words : 0,
  };
}

// ───────────── reading fluency ─────────────

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16",
  seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20",
  ek: "1", teen: "3", char: "4", chaar: "4", paanch: "5", panch: "5", chhe: "6", che: "6", saat: "7", aath: "8",
  nau: "9", das: "10", एक: "1", दो: "2", तीन: "3", चार: "4", पांच: "5", पाँच: "5", छह: "6", सात: "7", आठ: "8", नौ: "9", दस: "10",
};
const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Token form used for read-aloud matching: digits unified, number words mapped to digits. */
export function readingForm(w: string): string {
  const d = w.replace(/[०-९]/g, (c) => String(DEVANAGARI_DIGITS.indexOf(c)));
  return NUMBER_WORDS[d] ?? d;
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/** Same word, allowing one-letter romanisation drift on longer words ("nahin"/"nahi", "colour"/"color"). */
export function wordsMatch(target: string, spoken: string): boolean {
  if (target === spoken) return true;
  return Math.min(target.length, spoken.length) >= 4 && editDistance(target, spoken) <= 1;
}

export interface ReadingAlignment {
  targetWords: number;
  /** Target words read correctly (substitutions and omissions are errors; insertions are not penalised). */
  wordsCorrect: number;
  /** Target words up to the last one the child reached (a child who stopped early is not charged the rest). */
  attempted: number;
  /** Aligned pairs, target index → spoken index (−1 = omitted). */
  pairs: Array<[number, number]>;
}

/**
 * Levenshtein alignment of spoken tokens to target tokens (the WER alignment): substitution, insertion and
 * deletion cost 1, a match costs 0. Fillers are dropped from the spoken side first. Standard WCPM scoring:
 * a self-corrected word counts as correct (the transcript keeps the final reading), insertions are free.
 */
export function alignReading(target: string, spoken: string): ReadingAlignment {
  const T = tokenize(target).map((t) => readingForm(t.w));
  const S = tokenize(spoken).filter((t) => !isPureFiller(t.w)).map((t) => readingForm(t.w));
  const n = T.length, m = S.length;
  const D: number[][] = Array.from({ length: n + 1 }, (_, i) => {
    const row = new Array<number>(m + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= m; j++) D[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = D[i - 1][j - 1] + (wordsMatch(T[i - 1], S[j - 1]) ? 0 : 1);
      D[i][j] = Math.min(sub, D[i - 1][j] + 1, D[i][j - 1] + 1);
    }
  }
  const pairs: Array<[number, number]> = [];
  let i = n, j = m, wordsCorrect = 0, last = -1;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (wordsMatch(T[i - 1], S[j - 1]) ? 0 : 1)) {
      const ok = wordsMatch(T[i - 1], S[j - 1]);
      if (ok) { wordsCorrect++; last = Math.max(last, i - 1); }
      pairs.push([i - 1, ok ? j - 1 : -1]);
      i--; j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) {
      pairs.push([i - 1, -1]);
      i--;
    } else {
      j--;
    }
  }
  pairs.reverse();
  return { targetWords: n, wordsCorrect, attempted: last + 1, pairs };
}

export interface ReadingFluency {
  targetWords: number;
  wordsCorrect: number;
  /** Words correct per minute over the child's reading time (first to last speech frame). */
  wcpm?: number;
  /** wordsCorrect / attempted. */
  readAccuracy?: number;
}

/** WCPM needs at least a second of reading; shorter is a word, not a reading. */
export const MIN_READING_MS = 1000;

export function readingFluency(target: string, spoken: string, readingMs: number): ReadingFluency {
  const a = alignReading(target, spoken);
  const out: ReadingFluency = { targetWords: a.targetWords, wordsCorrect: a.wordsCorrect };
  if (readingMs >= MIN_READING_MS) out.wcpm = a.wordsCorrect / (readingMs / 60_000);
  if (a.attempted > 0) out.readAccuracy = a.wordsCorrect / a.attempted;
  return out;
}
