// Play grammar `play@1` (round 3, stream "play"; docs/design/round3/play/GRAMMAR.md and DESIGN.md).
//
// THE contract between the play families (src/play/families/**), the play server (server/play/**), the lesson (the
// Director / Stagecraft seam, owned by other streams and reached through patches) and the forge stream (which targets this
// file for live composition). One module, imported by the client, the server (Node type stripping) and the tests.
//
// Erasable TypeScript only (no enums, namespaces or parameter properties: `rs4-erasable-ts`).
//
// The laws this contract encodes (DESIGN.md §0):
//   - a level is built by CODE (a family generator), solver-checked and shortcut-free before it is served; no model writes a
//     level, a key, a position, a count or an outcome;
//   - the child's input is an ACT on the idea (split, cut, take, place, set); the law answers; the SERVER replays the raw
//     acts through the same pure law and grades; a frame's claim is never an input;
//   - in-game evidence enters the learner model at GAME_WEIGHT; only a bare item outside the game can make a skill secure;
//   - the world is a pure view of the learner ledger (pencil / ink), drawn on real prerequisite edges only; no counters;
//   - the teacher reacts to MOMENTS with authored, guarded lines; she never speaks mid-drag and never judges the child.

// ───────────────────────────── identifiers ─────────────────────────────

export const PLAY_VERSION = "play@1" as const;
/** The four flagship families of round 3. The grammar is open: a new family adds its id here and registers its logic. */
export const FAMILIES = ["todo-jodo", "taraazu", "nishana", "kyun-lab",
  "nazariya",   // r4-khand: block world (views, arrays, area/perimeter, squares/cubes, mirror)
] as const;
export type FamilyId = (typeof FAMILIES)[number];
/** Family sub-worlds. A mode is one representation with its own law inside a family. */
export const MODES = {
  "todo-jodo": ["atoms", "strips", "bundles"],
  taraazu: ["equation", "equality"],
  nishana: ["place", "compare"],
  "kyun-lab": ["fair-test"],
  nazariya: ["views", "array", "floor", "powers", "mirror"],   // r4-khand
} as const satisfies Record<FamilyId, readonly string[]>;
export type ModeOf<F extends FamilyId> = (typeof MODES)[F][number];
export type PlayMode = (typeof MODES)[FamilyId][number];

export const ARTS = ["kagaz", "chalk", "blueprint", "raat"] as const;
export type ArtId = (typeof ARTS)[number];
export type Lang = "en" | "hi" | "hinglish";
/** Fade stage inside the game (DESIGN.md §3): 1 concrete world · 2 world + live symbol · 3 the symbol is the controller.
 *  Stage 4, the bare item, is outside the game by definition and is the Director's, never a play level. */
export type Fade = 1 | 2 | 3;
export type Door = "garam" | "teekha";
export type Subject = "maths" | "science" | "evs";

// ───────────────────────────── layout floors (DESIGN.md §7; checked by the shot harness) ─────────────────────────────

export const FLOORS = Object.freeze({
  /** minimum rendered text height for labels and values, CSS px (class 4-5 labels use `textYoung`) */
  text: 14, textYoung: 16, numeral: 16,
  /** minimum hit area of anything the child touches, CSS px, and the gap between neighbours */
  target: 44, targetGap: 8,
  /** phone chrome rows (play mode): top bar, teacher strip, goal rail, controls */
  topBar: 44, teacherStrip: 64, rail: 52, controls: 64,
  /** wide layout side column */
  sideColumn: 340, wideAt: 900,
});

// ───────────────────────────── the game weight (DESIGN.md §8) ─────────────────────────────

/** In-game evidence weight into the learner model (the existing `game-evidence-into-kt-not-bayesnets` decision). */
export const GAME_WEIGHT = 0.5;

// ───────────────────────────── levels ─────────────────────────────

/** What the generator proved about a level before it could be served (P-O1/O3). */
export interface LevelProof {
  solvable: true;
  shortcutFree: true;
  /** the shortest solution in acts (a display budget, never a penalty) */
  minActs: number;
  /** how many distinct solutions the solver enumerated (capped) */
  solutions: number;
  /** misconception ids whose mal-rule act sequence differs observably from every correct one on this level */
  discriminates: string[];
  /** predicted first-try success for this child (band fit, 0..1) and the score the picker gave the level */
  pFirstTry: number; score: number;
  genMs: number;
}
/**
 * One level: fully specified, code-built, solver-checked. `params` is family-specific and validated by the family's
 * `validate()`. A level never carries child-facing prose: strings come from the authored bank by id.
 */
export interface PlayLevel<P = unknown> {
  v: typeof PLAY_VERSION;
  levelId: string;
  family: FamilyId;
  mode: PlayMode;
  topicId: string;
  skillId: string;
  fade: Fade;
  /** the level's goal predicate id (family-specific, closed list) */
  goal: string;
  params: P;
  /** misconception ids this level is meant to tell apart (kit ids) */
  targets: string[];
  /** the family's mal-rule id → the kit misconception id for this topic (from data/play/coverage.json) */
  mal: Record<string, string>;
  /** "spot the slip": the apprentice's bugged work is shown; the child finds and fixes it */
  slip?: { misconceptionId: string; by: "bittu" | "golu" } | null;
  /** which door produced it (absent on the first level of a segment) */
  door?: Door;
  /** a context skin id from data/play/contexts.json (fictional, no factual claim); never changes the maths */
  context: string;
  seed: number;
  proof: LevelProof;
}

// ───────────────────────────── acts (the only input that can change game state) ─────────────────────────────

export type ActVia = "touch" | "voice" | "key";
/** The envelope every family act travels in. `t` = ms since the level mounted (device clock; never used to grade). */
export interface PlayActEnvelope<A = PlayActBody> { seq: number; t: number; via: ActVia; act: A }

// Todo-Jodo
export type AtomsAct =
  | { kind: "split"; node: string; by: number }          // divide block `node` by `by` (1 < by < value, or the law refuses)
  | { kind: "done" }                                    // declare every leaf an atom
  | { kind: "predict"; same: boolean }                  // two benches: will the two trees end in the same atoms?
  | { kind: "share"; atom: string; with: string }       // HCF/LCM: pair an atom of tree A with an equal atom of tree B
  | { kind: "unshare"; atom: string }
  | { kind: "name"; x: number }                         // fade 2-3 / HCF-LCM: name the value the world built
  | { kind: "undo" };
export type StripsAct =
  | { kind: "cut"; bar: number; k: number }             // re-cut every part of `bar` into k (2..6)
  | { kind: "join"; bar: number; k: number }            // join every k neighbours (only alike, aligned pieces)
  | { kind: "shade"; bar: number; part: number }        // toggle one part
  | { kind: "pour"; from: number; to: number }          // move the shaded pieces of `from` into `to`
  | { kind: "choose"; bar: number }                     // compare: "this one is more" (or -1 for "same")
  | { kind: "name"; bar: number; n: number; d: number } // fade 3: name a bar's amount (the symbol as the controller)
  | { kind: "done" }
  | { kind: "undo" };
export type BundlesAct =
  | { kind: "unbundle"; place: number }                 // 1 of place p → 10 of place p-1 (0 = ones)
  | { kind: "take"; place: number; n: number }          // take n blocks away from place p (subtraction goal)
  | { kind: "write"; place: number; digit: number }     // fade 3: write the answer digit of place p
  | { kind: "done" }
  | { kind: "undo" };
// Taraazu
export type BalanceAct =
  | { kind: "take"; side: "L" | "R"; what: "unit" | "bag" }
  | { kind: "group"; k: number }                        // split both pans into k equal groups, keep one each
  | { kind: "open" }                                    // open the lone bag (only on a level scale)
  | { kind: "drop"; n: number }                         // equality mode: put n cubes in the box (replaces its content)
  | { kind: "name"; x: number }                         // name the bag's value
  | { kind: "undo" };
// Nishana
export type LineAct =
  | { kind: "place"; which: number; x: number }         // put marker `which` at line coordinate x (a number in [lo, hi])
  | { kind: "commit" }
  | { kind: "order"; first: number }                    // compare: which value is smaller (marker index), or -1 = equal
  | { kind: "round"; to: number }                       // round goal: the landmark (an end of the line) the value rounds to
  | { kind: "undo" };
// Kyun-Lab
export type LabAct =
  | { kind: "set"; setup: number; factor: string; level: string }
  | { kind: "predict"; choice: string }                 // "A" | "B" | "same" | a setup's outcome bucket
  | { kind: "run" }
  | { kind: "conclude"; factor: string }                // the factor that made the difference, or "cant_tell"
  | { kind: "undo" };
export type PlayActBody = AtomsAct | StripsAct | BundlesAct | BalanceAct | LineAct | LabAct;

/** Field names that look like a verdict claim. Stripped from every act before replay (rj-ot-frame-claim-as-grade). */
export const CLAIM_KEYS = Object.freeze(["correct", "verdict", "right", "isCorrect", "score", "pass", "solved", "grade"]);
const MAX_ACTS = 400;
/** PURE. A device's act list → envelopes the server will replay: bounded, claim fields dropped, malformed dropped. */
export function sanitizeActs(raw: unknown): PlayActEnvelope[] {
  if (!Array.isArray(raw)) return [];
  const out: PlayActEnvelope[] = [];
  for (const e of raw.slice(0, MAX_ACTS)) {
    if (!e || typeof e !== "object") continue;
    const env = e as Record<string, unknown>;
    const a = env.act as Record<string, unknown> | undefined;
    if (!a || typeof a !== "object" || typeof a.kind !== "string" || a.kind.length > 16) continue;
    const act: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(a)) {
      if (CLAIM_KEYS.includes(k)) continue;
      if (typeof v === "number" ? Number.isFinite(v) : typeof v === "string" ? v.length <= 40 : typeof v === "boolean") act[k] = v;
    }
    const via = env.via === "voice" || env.via === "key" ? env.via : "touch";
    out.push({ seq: Number.isFinite(env.seq) ? Number(env.seq) : out.length, t: Number.isFinite(env.t) ? Number(env.t) : 0, via, act: act as unknown as PlayActBody });
  }
  return out.sort((x, y) => x.seq - y.seq);
}

// ───────────────────────────── moments (what the teacher and the juice react to) ─────────────────────────────

export const MOMENT_KINDS = [
  "first_act",                  // the child's first act on the level
  "progress",                   // a legal act that moved the world toward the goal (a split, a cut, a level set)
  "law_refused",                // the law refused an act (a prime will not split; pieces do not fit; bag will not open)
  "misconception_consequence",  // an act matched a mal-rule's signature and the world showed its consequence
  "near_miss",                  // close but not met (Nishana within 2× tolerance; Taraazu one cube off)
  "prediction_committed",
  "prediction_violated",        // the run contradicted the child's prediction
  "prediction_confirmed",
  "new_strategy",               // a different first move from the child's last level of this mode
  "impasse",                    // no productive act for the child's own hesitation p75 (client-detected; floor 8 s)
  "solved",
  "slip_found",                 // the child found the apprentice's mistake
] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];
/** On-screen facts only: what the child can see right now (values, never sentences). */
export type Facts = Record<string, string | number>;
export interface Moment { kind: MomentKind; seq: number; facts: Facts; misconceptionId?: string }

// ───────────────────────────── grading and evidence ─────────────────────────────

export type PlayVerdict = "solved" | "partial" | "not_yet" | "ungraded";
export interface PlayEvidence {
  skillId: string;
  outcome: "correct" | "incorrect" | "partial";
  /** a mal-rule signature matched (a misconception HIT at the game weight) */
  misconceptionId?: string;
  /** a correct act on a level built to discriminate this misconception */
  discriminates?: string;
  via: "game"; weight: typeof GAME_WEIGHT;
  levelId: string; actSeq: number;
}
export interface PlayGrade {
  levelId: string;
  verdict: PlayVerdict;
  /** acts replayed, how many the law refused, and whether the level was solved without a mal-rule signature */
  acts: number; refused: number; clean: boolean;
  evidence: PlayEvidence[];
  moments: Moment[];
  /** what is on screen at the end (for the Director's PLAY facts row) */
  facts: Facts;
}

// ───────────────────────────── the family contract ─────────────────────────────

/** What the server's picker hands a generator. Nothing here identifies the child to a model (no model is called). */
export interface GenRequest {
  family: FamilyId; mode: PlayMode; topicId: string; skillId: string; classLevel: number; fade: Fade; goal?: string;
  /** misconception id → P(holds), from the learner model (server/learner/kt/misconception.js) */
  mis: Record<string, number>;
  /** the family's mal-rule id → the kit misconception id for this topic (data/play/coverage.json) */
  misMap: Record<string, string>;
  /** the topic's grammar knobs from data/play/coverage.json (ranges, goals) */
  grammar: Record<string, unknown>;
  /** recent level signatures for this child and mode (novelty) */
  recent: string[];
  seed: number;
  harder?: boolean;
  /** P(the child does the target skill unaided now), from the learner model; absent = the class default */
  pL?: number;
}
/** A generated level before the picker scores it. `difficulty` 0..1 is the family's own estimate (size, steps, form). */
export interface Candidate<P = unknown> { level: PlayLevel<P>; signature: string; difficulty: number }

/**
 * A family's pure logic half (src/play/families/<f>/logic.ts). Both the client (instant consequences) and the server
 * (grading) import it. Everything is deterministic in (level, acts).
 */
export interface FamilyLogic<P = unknown, S = unknown, A extends PlayActBody = PlayActBody> {
  family: FamilyId;
  modes: readonly PlayMode[];
  /** never throws: a bad params object returns null (the server then serves another candidate) */
  validate(level: PlayLevel<unknown>): PlayLevel<P> | null;
  init(level: PlayLevel<P>): S;
  /** THE LAW. Returns the next state and the moments the act produced; a refused act returns the same state. */
  apply(level: PlayLevel<P>, state: S, act: A, seq: number): { state: S; moments: Moment[]; refused?: string };
  goalMet(level: PlayLevel<P>, state: S): boolean;
  /** candidate levels for a request (the server filters, scores and picks) */
  generate(req: GenRequest): Candidate<P>[];
  /** the shortest act sequence that solves the level, or null (solvability) */
  solve(level: PlayLevel<P>): A[] | null;
  /** an act sequence that reaches the goal WITHOUT the target concept, or null (must be null to serve: shortcut-free) */
  shortcut(level: PlayLevel<P>): A[] | null;
  /** the act sequence a child holding mal-rule `malId` would make on this level */
  malActs(level: PlayLevel<P>, malId: string): A[] | null;
  /** replay → verdict + evidence (the server's grade) */
  grade(level: PlayLevel<P>, acts: PlayActEnvelope<A>[]): PlayGrade;
  /** on-screen values for the teacher and the Director (never sentences) */
  facts(level: PlayLevel<P>, state: S): Facts;
  /** the board twin: the same values, drawn plainly (the last rung of the ladder) */
  board(level: PlayLevel<P>, state: S): { title: string; lines: string[] };
  /** the family's mal-rule ids (the coverage file maps them to kit misconception ids per topic) */
  malRules: readonly string[];
}

// ───────────────────────────── art direction (DESIGN.md §4) ─────────────────────────────

export interface ArtTokens {
  id: ArtId;
  dark: boolean;
  ground: string; ground2: string;     // stage ground and its second tone
  panel: string; panelEdge: string;    // trays, pans, set-up cards
  ink: string; ink2: string; ink3: string;
  /** the relevant-object hues, in role order: primary quantity, secondary quantity, structure, highlight */
  q1: string; q2: string; q3: string; q4: string;
  good: string;                        // "goal met": always with a tick shape
  look: string;                        // "look again": always with a magnifier shape; never red, never a cross
  you: string;                         // the reserved "your move" hue (one element per state)
  shadow: string;
  /** stroke character: 0 = machine-clean, 1 = chalk / hand */
  jitter: number;
  font: { display: string; ui: string; mono: string; deva: string };
  sound: "paper" | "chalk" | "blip" | "glass";
}
/** Which art directions a family can wear (each family's view implements all of these). */
export const FAMILY_ARTS: Record<FamilyId, readonly ArtId[]> = {
  "todo-jodo": ["kagaz", "chalk", "blueprint", "raat"],
  taraazu: ["kagaz", "chalk", "blueprint", "raat"],
  nishana: ["blueprint", "kagaz", "chalk", "raat"],
  "kyun-lab": ["kagaz", "blueprint", "raat", "chalk"],
};
export interface ArtPickInput {
  family: FamilyId; subject: Subject; topicId: string; classLevel: number;
  /** the topic's preferred directions (data/play/coverage.json `arts`), best first */
  topicArts?: readonly ArtId[];
  /** the child's own choice (play settings), if any */
  childArt?: ArtId | null;
  /** the last art direction this child saw in this subject */
  lastArt?: ArtId | null;
}
export interface ArtPick { art: ArtId; reason: "child" | "topic" | "rotation" | "band" }
/**
 * PURE. The art direction for a level: the child's choice when the family can wear it (and it is not a repeat that the
 * child did not choose); else the topic's first preference that is not the last one shown in this subject; class 4-5
 * prefer light grounds. Never the same direction twice in a row for one child and subject unless the child chose it.
 */
export function pickArt(i: ArtPickInput): ArtPick {
  const can = FAMILY_ARTS[i.family];
  if (i.childArt && can.includes(i.childArt)) return { art: i.childArt, reason: "child" };
  const young = i.classLevel <= 5;
  const pref = (i.topicArts?.length ? i.topicArts : can).filter((a) => can.includes(a));
  const order = young ? [...pref.filter((a) => a !== "raat"), ...pref.filter((a) => a === "raat")] : pref;
  const fresh = order.filter((a) => a !== i.lastArt);
  if (fresh.length) return { art: fresh[0], reason: fresh[0] === order[0] ? (young && order[0] !== pref[0] ? "band" : "topic") : "rotation" };
  return { art: order[0] ?? can[0], reason: "topic" };
}

// ───────────────────────────── the teacher's lines (DESIGN.md §5) ─────────────────────────────

export interface Reaction {
  /** stable id: `<moment>.<lang>.<n>` from data/play/reactions.json; the TTS cache key with the filled text hash */
  id: string;
  moment: MomentKind;
  lang: Lang;
  text: string;
  channel: "micro";
}
/**
 * Words a micro-reaction may never contain: verdicts on the child (her face and her micro-lines are verdict-neutral; the
 * verdict lives on the work), praise of the person, and pressure. Matched on word boundaries, case-folded.
 */
export const REACTION_BANNED = Object.freeze([
  // verdicts
  "sahi", "galat", "right", "wrong", "correct", "incorrect", "galti", "glat", "शाबाश", "सही", "गलत",
  // person praise / babyish register (DESIGN-V3 §1.2)
  "shabash", "smart", "genius", "superstar", "awesome", "yay", "oops", "oopsie", "good job", "well done", "great job",
  // pressure and manipulation (NEVER MANIPULATE)
  "hurry", "jaldi karo", "quick", "streak", "points", "coins", "reward", "lose", "haar", "last chance", "don't stop", "mat ruko",
]);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BANNED_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${REACTION_BANNED.map(escapeRe).join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");
/** PURE. The play guard on one filled line (the server also runs the never-rules floor on it). */
export function reactionProblems(text: string, opts: { hidden?: (string | number)[] } = {}): string[] {
  const out: string[] = [];
  if (!text || text.length > 80) out.push("length");
  if (BANNED_RE.test(text)) out.push("banned_word");
  if (/[{}<>\\`]|\bundefined\b|\bNaN\b|\[object /.test(text)) out.push("template_bug");
  if (/!{2,}|\?{2,}/.test(text)) out.push("punctuation");
  for (const h of opts.hidden ?? []) {
    const s = String(h);
    if (s && new RegExp(`(^|[^0-9/.])${escapeRe(s)}(?=$|[^0-9/.])`).test(text)) out.push("reveals_hidden");
  }
  return out;
}

// ───────────────────────────── session wire (server/play/routes.js) ─────────────────────────────

/** POST /api/play/start */
export interface PlayStartRequest {
  childId: string;
  /** one of: a skill (the Director's admission), a topic (dev / Practice), or neither (next due play topic) */
  skillId?: string; topicId?: string;
  lessonId?: string;                 // inside a lesson: the session is tied to it (seam facts, evidence)
  lang?: Lang; art?: ArtId | null; fade?: Fade;
}
export interface PlayStartResponse {
  sessionId: string;
  level: PlayLevel;
  art: ArtPick;
  /** the reaction lines pre-filled for this level's likely moments (ids + text; audio by /api/play/say) */
  bank: Reaction[];
  /** the family's world map for this child (DESIGN.md §6) */
  world: PlayWorldFamily | null;
}
/** POST /api/play/act: the acts since the last post (the server replays ALL acts of the level each time). */
export interface PlayActRequest { sessionId: string; levelId: string; acts: PlayActEnvelope[]; final?: boolean; impasse?: boolean }
export interface PlayActResponse {
  levelId: string;
  moments: Moment[];
  /** at most one micro-reaction for this post (floor rules are the client's: it may drop it) */
  reaction: Reaction | null;
  /** present when the level ended (goal met or final post) */
  grade?: PlayGrade;
  /** present with a grade: the two doors for the next level */
  doors?: { door: Door; level: PlayLevel; hint: string }[];
  /** the seam the lesson should take now, if any (the client forwards it as a module event) */
  seam?: PlaySeam | null;
  /** present with a grade: the lesson evidence rows the server derived from its own replay (source "game", weight 0.5) */
  evidence?: { skillId: string; outcome: "correct" | "incorrect" | "partial"; misconceptionId?: string; discriminates?: string; source: "game"; itemId: string; probe: `P${number}`; hintsUsed: 0; weight: number }[];
  /** inside a lesson, with a grade: the server's evidence rows signed for this child and lesson (server/play/evidence.js).
   *  The lesson turn folds ONLY a verified token, once per level; the plain `evidence` rows above are for display. */
  evidenceToken?: string;
  /** inside a lesson, with a seam: the seam's telegraphic facts row signed for this child and lesson (the Director's PLAY row
   *  is read only from a verified token, never from words or values the device sends) */
  seamToken?: string;
  /** the refreshed session token (her reaction history rides in it); send it on the next post */
  sessionId: string;
}
/** POST /api/play/next */
export interface PlayNextRequest { sessionId: string; door: Door }
export interface PlayNextResponse { sessionId: string; level: PlayLevel; art: ArtPick; bank: Reaction[] }
/** GET /api/play/world?childId= */
export interface PlayWorldResponse { classLevel: number; families: PlayWorldFamily[] }

/** When the lesson's Director should take a full turn (DESIGN.md §5 seam turn). */
export interface PlaySeam {
  kind: "level_end" | "impasse" | "prediction" | "misconception" | "segment_end";
  /** telegraphic values for her line (the PLAY facts row) */
  facts: Facts;
  /** the bare kit item the Director should pose after the segment (fade 4), if the segment is over */
  bareItem?: { skillId: string } | null;
}

// ───────────────────────────── the world (DESIGN.md §6) ─────────────────────────────

/** Drawn states: ahead (not started) · hatched (practising) · pencil (got it today) · ink (secure). */
export type InkState = "ahead" | "hatched" | "pencil" | "ink";
export interface PlayStation {
  topicId: string; title: string; skillIds: string[];
  state: InkState;
  /** the server scheduled a re-check (never from time alone) */
  recheck: boolean;
  /** this is the topic the child's class is on now */
  here: boolean;
  mode: PlayMode;
}
export interface PlayRoute { from: string; to: string; cite: "curriculum" | "kit"; edge: string }
export interface PlayWorldFamily { family: FamilyId; stations: PlayStation[]; routes: PlayRoute[] }
/** PURE. The drawn state of a station from its skills' map states (the Garden/Sky map's own states). */
export function inkOf(states: ("not_started" | "practising" | "got_it" | "secure")[]): InkState {
  if (!states.length || states.every((s) => s === "not_started")) return "ahead";
  if (states.every((s) => s === "secure")) return "ink";
  if (states.every((s) => s === "secure" || s === "got_it")) return "pencil";
  return "hatched";
}

// ───────────────────────────── the lesson seam (patches; GRAMMAR.md §6) ─────────────────────────────

/** The Studio artifact a play segment rides in the lesson (shared/studio.ts gains `| PlayArtifact` by patch). */
export interface PlayArtifact {
  kind: "play";
  play: { sessionId: string; family: FamilyId; mode: PlayMode; skillId: string; topicId: string; art: ArtId; levelId: string };
}
/** PURE. The Director's PLAY facts row: telegraphic key=value pairs, never a sentence (the recitation law). */
export function playFactsRow(f: Facts, max = 12): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(f)) {
    if (parts.length >= max) break;
    const val = String(v).replace(/[\n\r|]/g, " ").slice(0, 32);
    if (/^[a-z][a-z0-9_]{0,23}$/i.test(k) && val) parts.push(`${k}=${val}`);
  }
  return parts.join(" ");
}
