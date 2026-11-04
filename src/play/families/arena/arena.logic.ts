// ITEM-ARENA (round 4 G1): the broad-net game family. Each level is ONE verified kit item (data/arena, built by
// server/play/tools/build-arena.mjs from items with verified.agrees === true); the options fly as targets, the child aims
// and fires, and the law grades the shot against the verified key, in code. A model never grades and never writes a
// challenge. A wrong shot shows the kit's hint rung (never the key) and that target goes dark; the first shot is the
// evidence (gradeLevel: the first decisive moment), later shots only finish the level. Evidence is a recognition among a
// few targets, so it enters the ledger at a lower weight than a law family (server/play/evidence.js: controllerEasy,
// form "recognise" → game 0.5 × 0.5 = 0.25).
// The challenges ride the GenRequest (`grammar.items`, attached by the play server from data/arena); the client never
// loads the bank.
import type { ArenaAct, Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";

export interface ArenaOption { id: string; text: string; word?: "yes" | "no" }
export interface ArenaChallenge {
  id: string; topicId: string; skillId: string; difficulty: number; form: "numeric" | "yesno" | "choice";
  prompt: { en: string; hi: string }; options: ArenaOption[]; keyText: string; hint: string | null; mis?: string;
}
export interface ArenaParams {
  itemId: string; form: ArenaChallenge["form"]; prompt: { en: string; hi: string }; options: ArenaOption[];
  /** the option id of the verified key */
  key: string; hint: string | null;
}
export interface ArenaState extends Undoable<ArenaState> { aim: string | null; out: string[]; shots: number; done: boolean; acts: number }

const mom = (kind: Moment["kind"], seq: number, facts: Facts): Moment => ({ kind, seq, facts });

function validate(level: PlayLevel<unknown>): PlayLevel<ArenaParams> | null {
  const p = level.params as Partial<ArenaParams> | null;
  if (!p || typeof p.itemId !== "string" || !Array.isArray(p.options) || typeof p.key !== "string") return null;
  if (p.form !== "numeric" && p.form !== "yesno" && p.form !== "choice") return null;
  const options = p.options.filter((o) => o && typeof o.id === "string" && typeof o.text === "string" && o.text.length <= 120).slice(0, 4);
  if (options.length < 2 || options.length !== p.options.length) return null;
  if (new Set(options.map((o) => o.id)).size !== options.length || !options.some((o) => o.id === p.key)) return null;
  const prompt = { en: String(p.prompt?.en ?? "").slice(0, 400), hi: String(p.prompt?.hi ?? p.prompt?.en ?? "").slice(0, 400) };
  if (!prompt.en) return null;
  return { ...level, params: { itemId: p.itemId, form: p.form, prompt, options, key: p.key, hint: typeof p.hint === "string" ? p.hint.slice(0, 200) : null } } as PlayLevel<ArenaParams>;
}
const init = (_l: PlayLevel<ArenaParams>): ArenaState => ({ aim: null, out: [], shots: 0, done: false, acts: 0, prev: null, depth: 0 });

function apply(level: PlayLevel<ArenaParams>, s: ArenaState, act: ArenaAct, seq: number): { state: ArenaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: ArenaState): ArenaState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: out };
  if (act.kind === "aim") {
    const o = p.options.find((x) => x.id === act.option);
    if (!o) return { state: bump(s), moments: out, refused: "bad_option" };
    if (s.out.includes(o.id)) return { state: bump(s), moments: out, refused: "already_out" };
    return { state: bump(pushUndo(s, { ...s, aim: o.id })), moments: out };
  }
  if (act.kind === "fire") {
    if (!s.aim) return { state: bump(s), moments: out, refused: "aim_first" };
    const o = p.options.find((x) => x.id === s.aim) as ArenaOption;
    const next = bump(pushUndo(s, { ...s, shots: s.shots + 1 }));
    if (o.id === p.key) { out.push(mom("solved", seq, { picked: o.text, shots: s.shots + 1 })); return { state: { ...next, done: true, aim: null }, moments: out }; }
    // a miss: that target goes dark; the hint rung shows on screen (never the key); the first miss is the evidence
    out.push(mom("law_refused", seq, { picked: o.text, why: "not_this", left: p.options.length - s.out.length - 1 }));
    return { state: { ...next, out: [...s.out, o.id], aim: null }, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<ArenaParams>, s: ArenaState) => s.done;
const solve = (level: PlayLevel<ArenaParams>): ArenaAct[] => [{ kind: "aim", option: level.params.key }, { kind: "fire" }];
/** no act sequence passes without knowing the key: the options are shuffled at build time and graded by id */
const shortcut = (_l: PlayLevel<ArenaParams>): ArenaAct[] | null => null;
const malActs = (_l: PlayLevel<ArenaParams>, _mal: string): ArenaAct[] | null => null;

/** one candidate per challenge of the request's skill (else of the topic), novelty by item id */
function generate(req: GenRequest): Candidate<ArenaParams>[] {
  const items = (Array.isArray(req.grammar?.items) ? req.grammar.items : []) as ArenaChallenge[];
  const mine = items.filter((c) => c.skillId === req.skillId);
  const pool = mine.length ? mine : items.filter((c) => c.topicId === req.topicId);
  return pool.map((c) => ({
    signature: `arena:${c.id}`,
    difficulty: Math.min(1, Math.max(0, ((c.difficulty ?? 2) - 1) / 4 + (c.form === "yesno" ? -0.1 : 0))),
    level: {
      v: "play@1", levelId: `arena-${c.id}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "arena", mode: "pick", topicId: c.topicId, skillId: c.skillId,
      fade: req.fade, goal: "pick", params: { itemId: c.id, form: c.form, prompt: c.prompt, options: c.options.map((o) => ({ id: o.id, text: o.text, ...(o.word ? { word: o.word } : {}) })),
        key: (c.options.find((o) => o.text === c.keyText) ?? c.options[0]).id, hint: c.hint ?? null },
      targets: [], mal: {}, slip: null, context: "space", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    },
  }));
}
function facts(level: PlayLevel<ArenaParams>, s: ArenaState): Facts {
  // on-screen values only; the key is never a fact until the child has hit it
  const f: Facts = { goal: "pick", options: level.params.options.length };
  if (s.out.length) f.out = s.out.length;
  if (s.done) { f.done = "yes"; f.answer = (level.params.options.find((o) => o.id === level.params.key) as ArenaOption).text; }
  return f;
}
function board(level: PlayLevel<ArenaParams>, s: ArenaState) {
  const p = level.params;
  return { title: "Arena", lines: [p.prompt.en.slice(0, 80), p.options.filter((o) => !s.out.includes(o.id)).map((o) => o.text).join(" · ").slice(0, 80)] };
}
function grade(level: PlayLevel<ArenaParams>, acts: PlayActEnvelope<ArenaAct>[]): PlayGrade {
  return gradeLevel(arenaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const arenaLogic: FamilyLogic<ArenaParams, ArenaState, ArenaAct> = {
  family: "arena", modes: ["pick"], malRules: [],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
