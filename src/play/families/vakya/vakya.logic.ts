// Vakya (वाक्य, "sentence") · Vakya-rail, a sentence train (round 7, English and Hindi grammar). A sentence is a train of
// word wagons. The engine (the key's first word, when nothing is decided there) waits on the track; the loose wagons (every
// word of the key, plus at most 2 distractor wagons from the item's own misconception or the skill's closed set) sit in a
// yard. The child couples wagons onto the track in order; a FORM wagon carries a turntable ("go" / "went"), and turning it
// is part of building; its forms come only from the item (its verified key, the wrong sentence it quotes, the verb in its
// brackets) or the skill's closed set (helper verbs, articles, relative pronouns, said / told …), never a free list.
// RUN: the train rolls through a signal. The law compares the coupled words with the item's verified key and its accepted
// sentence forms, exactly, ignoring case and punctuation. On a miss the train stops at the first wrong wagon, which sparks,
// and the wagons behind it uncouple; when that wagon is where a mapped misconception's wrong train goes wrong, with the same
// word, the moment is misconception_consequence (its mal-rule id). The key is never shown before a run; after a miss only
// the wagon that went wrong is marked, never the fix. Undo is free.
// Each level is ONE verified kit item (data/play/vakya, built by server/play/tools/build-vakya.mjs; its items ride the
// request as grammar.items, like ITEM-ARENA). The evidence is a PRODUCTION: the child builds the whole sentence, so the
// family is not controllerEasy.
// Mal-rules (the type of the wrong wagon in the item's own misconception train; data/play/coverage.json maps each, per
// topic, to the kit misconception):
//   word-order      the key's own words in another order ("Where you are going?": the helper verb not moved)
//   wrong-form      a wagon turned to the misconception's form ("Why does the river flows …", "fighted")
//   extra-wagon     a distractor wagon coupled ("Let's to play", "must to push")
//   missing-wagon   a key word left out ("Ravi saw leopard near tunnel")
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, VakyaAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";

export const VAKYA_MAL = ["word-order", "wrong-form", "extra-wagon", "missing-wagon"] as const;
export type VakyaMal = (typeof VAKYA_MAL)[number];
export interface VakyaWagon { id: string; forms: string[]; init: number }
export interface VakyaItem {
  id: string; topicId: string; skillId: string; kind: string; difficulty: number; lang: "en" | "hi";
  prompt: { en: string; hi: string }; keyFrom: string; engine: string | null; wagons: VakyaWagon[]; keys: string[][];
  mals: { id: VakyaMal; train: string[] }[]; mis?: string; malKit?: string; decides: string; seal: string;
}
export interface VakyaParams {
  itemId: string; lang: "en" | "hi"; prompt: { en: string; hi: string };
  /** the fixed first word on the track, or null (a bare locomotive) */
  engine: string | null;
  /** every word of the key (w1…) and at most 2 distractors (x1, x2); `init` is the face a form wagon shows first */
  wagons: VakyaWagon[];
  /** the accepted sentences, as normalised words (the verified key first) */
  keys: string[][];
  /** the wrong train of each mal-rule this item defines (normalised words) */
  mals: { id: VakyaMal; train: string[] }[];
  /** what the child decides: order, order+form, form (the prompt shows the order), copy */
  decides: string;
  /** the bank's seal over the item, its key and its wagons (a level whose key differs from the bank is refused) */
  seal: string;
}
export interface VakyaState extends Undoable<VakyaState> {
  /** the coupled wagon ids, in order, behind the engine */
  train: string[];
  /** the face (form index) of each wagon */
  face: Record<string, number>;
  /** after a missed run: the index on the track (engine = 0 when there is one) of the wagon that sparked */
  spark: number | null;
  runs: number; done: boolean; acts: number;
}

// ── words
const STRIP_L = /^[‘'"“(\[«]+/u, STRIP_R = /[.,!?;:"”)\]»।॥]+$/u;
/** a sentence → its words: NFC, curly quotes straightened, sentence punctuation dropped, lower case unless keepCase */
export function tokens(s: string, o: { keepCase?: boolean } = {}): string[] {
  const t = String(s ?? "").normalize("NFC").replace(/[’‘]/g, "'").trim().replace(/^['"“]+/, "").replace(/["”]+$/, "").replace(/(^|\s)'(?=\S)/g, "$1");
  const out: string[] = [];
  for (const raw of t.split(/\s+/)) {
    let w = raw.replace(STRIP_L, "").replace(STRIP_R, "");
    // a closing quote after a word ("sad,'") but never a possessive's own apostrophe (soldiers')
    if (/'$/.test(w) && !/s'$/.test(w)) w = w.slice(0, -1).replace(STRIP_R, "");
    if (!w || !/[\p{L}\p{N}]/u.test(w)) continue;
    out.push(o.keepCase ? w : w.toLowerCase());
  }
  return out;
}
const norm = (w: string) => tokens(w)[0] ?? "";
/** FNV-1a over the item's identity, its key, its wagons and its mal trains (the bank writes it; validate checks it) */
export function sealOf(x: { id?: string; itemId?: string; engine: string | null; wagons: VakyaWagon[]; keys: string[][]; mals: { id: string; train: string[] }[] }): string {
  const s = JSON.stringify([x.itemId ?? x.id, x.engine, x.wagons.map((w) => [w.id, w.forms, w.init]), x.keys, x.mals.map((m) => [m.id, m.train])]);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, "0");
}
/**
 * Can the yard build `train` (normalised words, the engine's word first when there is one)? → one wagon and face per word
 * after the engine (a bipartite matching: each wagon at most once), or null.
 */
export function matchTrain(p: { engine: string | null; wagons: VakyaWagon[] }, train: string[]): { wagon: string; form: number }[] | null {
  let body = train;
  if (p.engine) { if (train[0] !== norm(p.engine)) return null; body = train.slice(1); }
  const can = body.map((w) => p.wagons.map((wg, j) => ({ j, f: wg.forms.findIndex((f) => norm(f) === w) })).filter((x) => x.f >= 0));
  const owner = new Array<number>(p.wagons.length).fill(-1);
  const tryPos = (i: number, seen: boolean[]): boolean => {
    for (const { j } of can[i]) {
      if (seen[j]) continue;
      seen[j] = true;
      if (owner[j] < 0 || tryPos(owner[j], seen)) { owner[j] = i; return true; }
    }
    return false;
  };
  for (let i = 0; i < body.length; i++) if (!tryPos(i, new Array(p.wagons.length).fill(false))) return null;
  const out: { wagon: string; form: number }[] = new Array(body.length);
  owner.forEach((i, j) => { if (i >= 0) out[i] = { wagon: p.wagons[j].id, form: (can[i].find((x) => x.j === j) as { f: number }).f }; });
  return out;
}
/** where a train first goes wrong against every accepted key: the longest common prefix, and the word standing there ("" = none) */
export function sparkOf(keys: string[][], train: string[]): { at: number; word: string; solved: boolean } {
  let at = 0, solved = false;
  for (const k of keys) {
    let i = 0;
    while (i < k.length && i < train.length && k[i] === train[i]) i++;
    if (i === k.length && i === train.length) solved = true;
    at = Math.max(at, i);
  }
  return { at, word: train[at] ?? "", solved };
}
/** the train's words as the law reads them (engine first) */
export function trainWords(p: VakyaParams, s: VakyaState): string[] {
  const out = p.engine ? [norm(p.engine)] : [];
  for (const id of s.train) { const w = p.wagons.find((x) => x.id === id); if (w) out.push(norm(w.forms[s.face[id] ?? 0])); }
  return out;
}
/** the words the teacher may not say before the child builds them: the key, and every key word of two letters or more
 *  (a single letter would match inside every line under the reaction guard's boundaries, so it is not listed) */
export function vakyaHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as Partial<VakyaParams> | null;
  if (!p || !Array.isArray(p.keys)) return [];
  const out = new Set<string>();
  for (const k of p.keys) { if (!Array.isArray(k)) continue; out.add(k.join(" ")); for (const w of k) if (typeof w === "string" && [...w].length >= 2) out.add(w); }
  return [...out];
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const okWord = (w: unknown): w is string => typeof w === "string" && w.length >= 1 && w.length <= 32 && w === w.normalize("NFC") && /[\p{L}\p{N}]/u.test(w) && !/\s/.test(w);

function validate(level: PlayLevel<unknown>): PlayLevel<VakyaParams> | null {
  const p = level.params as Partial<VakyaParams> | null;
  if (!p || level.mode !== "rail" || typeof p.itemId !== "string" || !p.itemId || (p.lang !== "en" && p.lang !== "hi")) return null;
  if (p.engine !== null && !okWord(p.engine)) return null;
  if (!Array.isArray(p.wagons) || p.wagons.length < 2 || p.wagons.length > 14) return null;
  const wagons: VakyaWagon[] = [];
  for (const w of p.wagons) {
    if (!w || typeof w.id !== "string" || !/^[wx]\d{1,2}$/.test(w.id) || !Array.isArray(w.forms) || w.forms.length < 1 || w.forms.length > 4) return null;
    if (!w.forms.every(okWord) || new Set(w.forms.map(norm)).size !== w.forms.length || !isInt(w.init) || w.init < 0 || w.init >= w.forms.length) return null;
    wagons.push({ id: w.id, forms: [...w.forms], init: w.init });
  }
  if (new Set(wagons.map((w) => w.id)).size !== wagons.length || wagons.filter((w) => w.id.startsWith("x")).length > 2) return null;
  if (p.lang === "hi" && !wagons.every((w) => w.forms.every((f) => /[ऀ-ॿ]/.test(f)))) return null;
  if (!Array.isArray(p.keys) || p.keys.length < 1 || p.keys.length > 8) return null;
  const keys: string[][] = [];
  for (const k of p.keys) {
    if (!Array.isArray(k) || k.length < 3 || k.length > 12 || !k.every((w) => okWord(w) && norm(w) === w)) return null;
    if (!matchTrain({ engine: p.engine ?? null, wagons }, k)) return null;
    keys.push([...k]);
  }
  // every word wagon is a word of the verified key: the key uses all of them, and nothing else
  const m0 = matchTrain({ engine: p.engine ?? null, wagons }, keys[0]) as { wagon: string }[];
  const ws = wagons.filter((w) => w.id.startsWith("w")).map((w) => w.id).sort();
  if (m0.map((x) => x.wagon).sort().join() !== ws.join()) return null;
  const mals: { id: VakyaMal; train: string[] }[] = [];
  for (const m of Array.isArray(p.mals) ? p.mals : []) {
    if (!m || !(VAKYA_MAL as readonly string[]).includes(m.id) || !Array.isArray(m.train) || !m.train.every((w) => okWord(w) && norm(w) === w)) return null;
    if (!matchTrain({ engine: p.engine ?? null, wagons }, m.train) || sparkOf(keys, m.train).solved || mals.some((x) => x.id === m.id)) return null;
    mals.push({ id: m.id, train: [...m.train] });
  }
  const params: VakyaParams = { itemId: p.itemId, lang: p.lang, prompt: { en: String(p.prompt?.en ?? "").slice(0, 400), hi: String(p.prompt?.hi ?? p.prompt?.en ?? "").slice(0, 400) },
    engine: p.engine ?? null, wagons, keys, mals, decides: typeof p.decides === "string" ? p.decides : "order", seal: String(p.seal ?? "") };
  if (!params.prompt.en || sealOf(params) !== params.seal) return null;
  return { ...level, params } as PlayLevel<VakyaParams>;
}
function init(level: PlayLevel<VakyaParams>): VakyaState {
  return { train: [], face: Object.fromEntries(level.params.wagons.map((w) => [w.id, w.init])), spark: null, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<VakyaParams>, s: VakyaState, act: VakyaAct, seq: number): { state: VakyaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: VakyaState): VakyaState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const wagon = (id: unknown) => (typeof id === "string" ? p.wagons.find((w) => w.id === id) : undefined);
  if (act.kind === "couple") {
    const w = wagon(act.wagon);
    if (!w) return { state: bump(s), moments: out, refused: "bad_wagon" };
    const rest = s.train.filter((x) => x !== w.id);
    const at = Number(act.at);
    if (!isInt(at) || at < 0 || at > rest.length) return { state: bump(s), moments: out, refused: "bad_at" };
    if (s.train[at] === w.id && rest.length === s.train.length - 1) return { state: bump(s), moments: out, refused: "same_place" };
    const train = [...rest.slice(0, at), w.id, ...rest.slice(at)];
    return { state: bump(pushUndo(s, { ...s, train, spark: null })), moments: out };
  }
  if (act.kind === "uncouple") {
    const w = wagon(act.wagon);
    if (!w) return { state: bump(s), moments: out, refused: "bad_wagon" };
    if (!s.train.includes(w.id)) return { state: bump(s), moments: out, refused: "not_on_track" };
    return { state: bump(pushUndo(s, { ...s, train: s.train.filter((x) => x !== w.id), spark: null })), moments: out };
  }
  if (act.kind === "turn") {
    const w = wagon(act.wagon), f = Number(act.form);
    if (!w) return { state: bump(s), moments: out, refused: "bad_wagon" };
    if (w.forms.length < 2) return { state: bump(s), moments: out, refused: "no_turntable" };
    if (!isInt(f) || f < 0 || f >= w.forms.length) return { state: bump(s), moments: out, refused: "bad_form" };
    if ((s.face[w.id] ?? 0) === f) return { state: bump(s), moments: out, refused: "same_form" };
    return { state: bump(pushUndo(s, { ...s, face: { ...s.face, [w.id]: f }, spark: null })), moments: out };
  }
  if (act.kind === "run") {
    if (!s.train.length) return { state: bump(s), moments: out, refused: "build_first" };
    const words = trainWords(p, s), sp = sparkOf(p.keys, words), runs = s.runs + 1;
    const base: Facts = { goal: "build", words: words.length };
    if (sp.solved) { out.push(mom("solved", seq, base)); return { state: { ...bump(pushUndo(s, { ...s, runs, spark: null })), done: true }, moments: out }; }
    // the train stops at the first wrong wagon (it sparks) and the wagons behind it uncouple
    const off = p.engine ? 1 : 0, wi = sp.at - off;
    const train = wi < s.train.length ? s.train.slice(0, wi + 1) : s.train;
    const next = bump(pushUndo(s, { ...s, runs, train, spark: sp.at }));
    const f: Facts = { ...base, at: sp.at, ...(sp.word ? {} : { short: "yes" }) };
    for (const m of p.mals) {
      if (!level.mal[m.id]) continue;
      const ms = sparkOf(p.keys, m.train);
      if (ms.at === sp.at && ms.word === sp.word) { out.push(mom("misconception_consequence", seq, f, m.id)); return { state: next, moments: out, refused: "missed" }; }
    }
    out.push(mom("law_refused", seq, { ...f, why: sp.word ? "wrong_wagon" : "short" }));
    return { state: next, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<VakyaParams>, s: VakyaState) => s.done;

/** the acts that build `train` from the yard (turn each wagon to its form, couple it at the end), then run */
function buildActs(p: VakyaParams, train: string[]): VakyaAct[] | null {
  const m = matchTrain(p, train);
  if (!m) return null;
  const acts: VakyaAct[] = [];
  m.forEach((x, i) => {
    const w = p.wagons.find((y) => y.id === x.wagon) as VakyaWagon;
    if (x.form !== w.init) acts.push({ kind: "turn", wagon: x.wagon, form: x.form });
    acts.push({ kind: "couple", wagon: x.wagon, at: i });
  });
  acts.push({ kind: "run" });
  return acts;
}
const solve = (level: PlayLevel<VakyaParams>): VakyaAct[] | null => buildActs(level.params, level.params.keys[0]);
/** no act sequence reaches the key without building it: every word is a wagon the child places and turns */
const shortcut = (_l: PlayLevel<VakyaParams>): VakyaAct[] | null => null;
function malActs(level: PlayLevel<VakyaParams>, mal: string): VakyaAct[] | null {
  if (!level.mal[mal]) return null;
  const m = level.params.mals.find((x) => x.id === mal);
  return m ? buildActs(level.params, m.train) : null;
}

/** one candidate per bank item of the request's skill (else of its topic); novelty by item id */
function generate(req: GenRequest): Candidate<VakyaParams>[] {
  const items = (Array.isArray(req.grammar?.items) ? req.grammar.items : []) as VakyaItem[];
  const mine = items.filter((c) => c.skillId === req.skillId);
  const pool = mine.length ? mine : items.filter((c) => c.topicId === req.topicId);
  return pool.map((c) => {
    const mal: Record<string, string> = c.malKit ? Object.fromEntries(c.mals.map((m) => [m.id, c.malKit as string])) : {};
    const n = c.keys[0]?.length ?? 6, turns = c.wagons.filter((w) => w.forms.length > 1).length;
    return {
      signature: `vakya:${c.id}`,
      difficulty: Math.min(1, Math.max(0, ((c.difficulty ?? 2) - 1) / 8 + 0.035 * n + 0.05 * turns + (c.decides.startsWith("order") ? 0.1 : 0))),
      level: {
        v: "play@1", levelId: `vakya-${c.id}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "vakya", mode: "rail", topicId: c.topicId, skillId: c.skillId,
        fade: req.fade, goal: "build",
        params: { itemId: c.id, lang: c.lang, prompt: c.prompt, engine: c.engine, wagons: c.wagons, keys: c.keys, mals: c.mals, decides: c.decides, seal: c.seal },
        targets: Object.values(mal), mal, slip: null, context: "rail", seed: req.seed,
        proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
      },
    };
  });
}
function facts(level: PlayLevel<VakyaParams>, s: VakyaState): Facts {
  // on-screen values only: how many wagons stand in the yard and on the track; never a word of the key
  const f: Facts = { goal: "build", wagons: level.params.wagons.length, coupled: s.train.length };
  if (s.runs) f.runs = s.runs;
  if (s.spark !== null) f.at = s.spark;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<VakyaParams>, s: VakyaState) {
  const p = level.params, face = (id: string) => { const w = p.wagons.find((x) => x.id === id) as VakyaWagon; return w.forms[s.face[id] ?? 0]; };
  const train = [...(p.engine ? [p.engine] : []), ...s.train.map(face)].join(" ");
  const yard = p.wagons.filter((w) => !s.train.includes(w.id)).map((w) => (w.forms.length > 1 ? `[${w.forms.join("/")}]` : w.forms[0])).join(" · ");
  return { title: "Vakya", lines: [(p.lang === "hi" ? p.prompt.hi : p.prompt.en).slice(0, 80), `🚂 ${train}`.slice(0, 80), yard.slice(0, 80)] };
}
function grade(level: PlayLevel<VakyaParams>, acts: PlayActEnvelope<VakyaAct>[]): PlayGrade {
  return gradeLevel(vakyaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const vakyaLogic: FamilyLogic<VakyaParams, VakyaState, VakyaAct> = {
  family: "vakya", modes: ["rail"], malRules: VAKYA_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
