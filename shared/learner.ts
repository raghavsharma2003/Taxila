// Taxila learner model — shared types (LEARNER-MODEL.md §3, §4, §6.1-§6.3.1, §9.1, §10, §13.1).
// Runtime twins live in server/learner/*.js (plain JS ESM); tests/learner-shared.test.mjs asserts that the
// constants below equal the ones the server runs (BANDS, OUTCOMES, partition lists, modes).
// Additive to shared/contracts.ts: the legacy SkillState/Evidence there stay the live route's contract.

// ───────────────────────────── bands and scales (§3) ─────────────────────────────
export type ClassLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Band4 = "B1" | "B2" | "B3" | "B4";
export type Band3 = "A" | "B" | "C";
export type ContractBand = "6-9" | "10-15";
export interface BandRow { b4: Band4; b3: Band3; contract: ContractBand; typicalAge: [number, number] }
export const BANDS: Readonly<Record<ClassLevel, BandRow>> = {
  1: { b4: "B1", b3: "A", contract: "6-9", typicalAge: [6, 7] }, 2: { b4: "B1", b3: "A", contract: "6-9", typicalAge: [7, 8] },
  3: { b4: "B2", b3: "A", contract: "6-9", typicalAge: [8, 9] }, 4: { b4: "B2", b3: "B", contract: "6-9", typicalAge: [9, 10] },
  5: { b4: "B3", b3: "B", contract: "10-15", typicalAge: [10, 11] }, 6: { b4: "B3", b3: "B", contract: "10-15", typicalAge: [11, 12] },
  7: { b4: "B3", b3: "C", contract: "10-15", typicalAge: [12, 13] }, 8: { b4: "B4", b3: "C", contract: "10-15", typicalAge: [13, 14] },
  9: { b4: "B4", b3: "C", contract: "10-15", typicalAge: [14, 15] },
};
/** Grade-equivalent: 0.0 = start of Class 1; 5.0 = start of Class 6; a month ≈ 0.1. */
export type GE = number;
export type SkillId = string;
export type MisconceptionId = string;
export type Subject = "maths" | "science" | "evs" | "english" | "hindi" | "sst";
export type Strand = `${Subject}:${string}`;

// ───────────────────────────── legal modes (§4) ─────────────────────────────
export type LegalMode = "M0" | "M1" | "M2" | "M3";
export const LEGAL_MODES = ["M0", "M1", "M2", "M3"] as const;
export type LearnerLayer =
  | "session" | "kt" | "mis" | "ability" | "need_fact" | "fade" | "vibe_explicit" | "mem_A" | "lang_tile"
  | "eta" | "need_belief" | "cri_agg" | "mem_B" | "lang_est"
  | "vibe_slow" | "interest" | "value_arms" | "pz_child" | "cri" | "research";
/** The write context every writer.js builder receives. */
export interface WriterChild { id: string; legal_mode: LegalMode; consent?: { P3?: boolean; P4?: boolean } }

// ───────────────────────────── knowledge (§6.1) ─────────────────────────────
export type TopicType = "T1" | "T2" | "T3" | "T4" | "T5";
export const OUTCOMES = {
  "item.open": ["C0", "C1", "C2", "C3", "C4", "IDK", "NA"],
  "item.mcq2": ["first_correct", "wrong"],
  "item.mcq3": ["first_correct", "wrong"],
  "item.mcq4": ["first_correct", "wrong"],
  "probe.why": ["full", "partial", "none", "misconception"],
  "probe.teachback": ["high", "mid", "low", "misconception"],
  "probe.transfer.near": ["pass", "fail"],
  "probe.transfer.far": ["pass", "fail"],
  "probe.errorspot": ["caught_fixed", "caught", "missed"],
  "probe.predict": ["right", "mapped_wrong", "other"],
  solo: ["C0", "C1", "fail"],
  para: ["fluent", "hesitant"],
} as const;
export type EvidenceClass = keyof typeof OUTCOMES;
export type OutcomeName<C extends EvidenceClass> = (typeof OUTCOMES)[C][number];
export type ItemForm = "produce" | "recognise";

/** One evidence event (one item attempt chain = one episode). seq is server-assigned; replay folds by seq. */
export interface EvidenceEvent {
  id: string; seq?: number; childId?: string; sessionId: string; episodeId: string;
  /** The ONLY clock KT reads (§13.1 VK6). Defaults to `at` of the session's first event. */
  sessionStartAt?: string;
  at: string;
  skillIds: SkillId[];                 // 1-3, conjunctive
  /** The item's target skill: (a)/(b)/(c) count only for it. Defaults to skillIds[0]. */
  target?: SkillId;
  cls: EvidenceClass; outcome: number;  // index into OUTCOMES[cls]
  grader: "code" | "llm" | "human"; graderVersion: string; asrConf?: number; itemKey: string;
  topicType?: TopicType;
  /** PRODUCT-DESIGN §6.4.1; mcq defaults to recognise, everything else to produce. */
  form?: ItemForm;
  teach?: boolean; assisted?: "parent" | "sibling" | null; controllerEasy?: boolean; preAttemptHelp?: boolean;
  gamingWindowKt?: boolean; safetyFired?: boolean; contaminated?: boolean; kitVerified?: boolean; entryRung?: 0 | 1 | 2 | 3 | 4;
  /** The grader mapped the answer to this belief (a hit). */
  misconceptionId?: MisconceptionId;
  /** This item discriminates this misconception (a correct answer is evidence against it). */
  discriminates?: MisconceptionId;
  /** A misconception-graded why/teach-back updates the misconception layer ('mis', default) OR the skill LR ('skill'), never both. */
  misRoute?: "mis" | "skill";
  paramsVersion?: string;
}

export type Display = "unseen" | "introduced" | "practising" | "learned_today" | "mastered" | "durable";
export interface FsrsMemory { S: number; D: number; lastReviewAt: string; reps: number; lapses: number }
export interface KtSkillState {
  skillId: SkillId; topicType: TopicType;
  pL: number; retention: number;
  mem: FsrsMemory | null;
  n: number; lastAt: string | null; paramsVersion: string;
  flags: { unaided: boolean; generative: boolean; delayed: boolean; durable7: boolean; durable30: boolean };
  recent: (0 | 1)[]; opp: number; run: number;
  display: Display; refresh: boolean;
  /** The frozen cold-start prior and where it was materialised (TH2). */
  prior: { pL0: number; source: "theta" | "type_default"; epochId: string; seq: number | null } | null;
  aDay: string | null; bDay: string | null; learnedAt: string | null;
  anchorAt: string | null; anchorSession: string | null; delayedMisses: number; nextReviewAt: string | null;
}
export interface MisconceptionState {
  misconceptionId: MisconceptionId; logit: number; hits: number;
  lastAt: string | null; resolvedAt: string | null; checkScheduledAt: string | null;
}
export interface KtView {
  skill(id: SkillId): KtSkillState | undefined;
  pSuccessNext(skillIds: SkillId[], cls?: EvidenceClass): number;
  weakestPrereq(id: SkillId): SkillId | null;
  due(k?: number): SkillId[];
  wheelSpin(id: SkillId): "none" | "warn" | "confirm";
}

// ───────────────────────────── ability (§6.3, §6.3.1) ─────────────────────────────
export interface Normal { mu: GE; sd: number }
export interface StrandPosterior {
  strand: Strand; mean: GE; sd: number; q25: GE; q30: GE; q40: GE; modes: GE[]; ambiguous: boolean; nItems: number;
  stop: "exit" | "strain" | "time" | "cap" | "precise" | "pser" | "bracket"; engineVersion: string;
}
export interface ItemMeta {
  itemKey: string; strand: Strand | null; skillIds: SkillId[];
  b: { source: "item_mml" | "item_online" | "template" | "skill"; mu: GE; sd: number };
  K?: 2 | 3 | 4; entryRung: 0 | 1 | 2 | 3 | 4; contaminated: boolean;
}
export interface ThetaObs { evId: string; strand: Strand; y: 0 | 1; b: GE; a: number; c: number; s: number; w: number }
export interface EpochBase { epochId: string; openedAt: string; strands: Strand[]; m: number[]; S: number[]; sd0: number[] }
export interface EpochAbility {
  base: EpochBase; ll: Record<string, number[]>; seen: string[]; nObs: Record<string, number>; sessionId?: string;
}

/** The fold state (server/learner/kt/ledger.js). JSON-serialisable; `session` is in-memory only. */
export interface Ledger {
  v: 1; childId: string; classLevel: number; paramsVersion: string;
  skills: Record<SkillId, KtSkillState>; mis: Record<MisconceptionId, MisconceptionState>;
  ability: Record<string, EpochAbility>; seen: Record<string, number | null>; lastSeq: number;
  session: unknown | null;
}

// ───────────────────────────── the CHILD brief (§9.1) ─────────────────────────────
export interface BriefView {
  /** The child's mode and consent: gates tier-B rows (INTEREST needs mem_B = M2+ and P3). Absent = M1, no P3. */
  mode?: { legalMode: LegalMode; consent?: { P3?: boolean } };
  child: { firstName: string; classLevel: ClassLevel; band4: Band4; sessions?: number };
  address?: { childCallsTeacher: string; teacherCallsChild: "name" | "name+beta" };
  lang?: { matrix: "hi" | "en"; enInsertion: "low" | "mid" | "high"; terms: "en_labels" | "medium_terms" };
  read?: { support: "R0" | "R1" | "R2"; aloud: boolean };
  accommodations?: ("more_wait" | "larger_text" | "read_aloud" | "tap_only" | "slower_speech")[];
  today?: { title: string; foundation?: number; school?: number };
  skills?: { solid: { title: string; refresh?: boolean }[]; learning: { title: string; entry: "worked_step" | "hint_first" }[] };
  prereq?: { title: string } | null;
  watch?: { belief: string; seen?: number }[];
  review?: string[];
  need?: { chapter?: string; window?: { kind: string; bucket: "this_week" | "next_week" | "2_3_weeks" | "later" }; scope?: string };
  goal?: string;
  /** Tier B: absent in M1 unless P3. */
  interests?: string[];
  support?: { fade: 0 | 1 | 2 | 3 | 4 | 5; soloRounds?: number; nudgeSec?: number };
  notebook?: { opener?: string; items?: string[] };
  session?: { capMin?: number; schoolMode?: boolean };
}

// ───────────────────────────── the Director's learner view (§10, partial) ─────────────────────────────
export interface DirectorLearnerView {
  child: { id: string; firstName: string; classLevel: ClassLevel; legalMode: LegalMode; schoolMode: boolean };
  bands: BandRow;
  kt: KtView;
  mis: { active: { id: MisconceptionId; p: number; needsVerify: boolean; hits: number }[] };
  theta: Record<string, Record<Strand, { mu: GE; sd: number; nObs: number }>>;
}

// ───────────────────────────── vibe/affect isolation partition (§13.1) ─────────────────────────────
/** Inputs the isolation test PERMUTES. None may reach KT scoring, misconception logits, θ or probeFor(). */
export const KT_PERMUTED_INPUTS = [
  "vibe.waitNudgeSec", "vibe.endpointSilenceMs", "vibe.teacherTurnWords", "vibe.humourDose", "vibe.humourAssetId",
  "vibe.energy", "vibe.address", "vibe.interestTheme",
  "prefs.explicit.child", "prefs.explicit.parent",
  "timing.onsetLatencyMs", "timing.zChildOnset", "timing.wordsPerSec", "timing.dwellAfterHintMs", "timing.rapid",
  "timing.repeatedTokenRatio", "timing.scriptMix", "timing.bargeIn", "timing.intraSessionOffsetMs",
  "acts.AFFECT_SELF", "acts.taskValence",
  "derived.engagementState", "derived.suspicions.FRUSTRATION", "derived.suspicions.DRIFT",
] as const;
/** Inputs HELD FIXED (replayed from the recording). These are allowed to move KT. */
export const KT_HELD_INPUTS = [
  "episode.itemKey", "episode.skillIds", "episode.cls", "episode.teach", "episode.pSuccessAtSelection",
  "episode.selectedBy", "episode.seq", "session.sessionStartAt",
  "outcome.outcome", "outcome.answerText", "outcome.grader", "outcome.graderVersion", "outcome.asrConf",
  "outcome.contaminated",
  "acts.ATTEMPT", "acts.HEDGED_ATTEMPT", "acts.IDK", "acts.CLARIFY_Q", "acts.ANSWER_REQUEST", "acts.HINT_REQUEST",
  "acts.OFF_TASK", "acts.META", "acts.addressesQuestion",
  "flag.gamingWindowKt", "flag.controllerEasy", "flag.assisted", "flag.safetyFired",
  "params.paramsVersion", "seed.lessonSeed",
] as const;
export type PermutedInput = (typeof KT_PERMUTED_INPUTS)[number];
export type HeldInput = (typeof KT_HELD_INPUTS)[number];
export type ActLabel = "ATTEMPT" | "HEDGED_ATTEMPT" | "IDK" | "CLARIFY_Q" | "ANSWER_REQUEST" | "HINT_REQUEST" | "OFF_TASK" | "META" | "AFFECT_SELF";

/** The ONLY argument shape KT/misconception/θ/probe code receives (a projection of the turn onto HeldInput). */
export interface KtReplayInput {
  episodes: { itemKey: string; skillIds: SkillId[]; cls: EvidenceClass; teach: boolean; pSuccessAtSelection: number;
    selectedBy: "plan" | "band" | "costly_move" | "easy_cap" | "review"; seq: number }[];
  outcomes: { episodeIdx: number; outcome: number; answerText: string | null; grader: "code" | "llm" | "human";
    graderVersion: string; asrConf?: number; contaminated: boolean }[];
  taskActs: { turnIdx: number; act: Exclude<ActLabel, "AFFECT_SELF">; addressesQuestion: boolean }[];
  flags: { gamingWindowKt: boolean[]; controllerEasy: boolean[]; assisted: ("parent" | "sibling" | null)[]; safetyFired: boolean[] };
  sessionStartAt: string; paramsVersion: string; lessonSeed: string;
}

// Type-level partition checks (run in `tsc -b`): the lists are disjoint, and no EvidenceEvent field is a
// permuted input's leaf name (no vibe/timing/affect/engagement field can ride on an event into KT).
type Leaf<S extends string> = S extends `${string}.${infer R}` ? Leaf<R> : S;
type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
export type PartitionDisjoint = Assert<IsNever<Extract<PermutedInput, HeldInput>>>;
type EventLeafLeak = Extract<keyof EvidenceEvent, Exclude<Leaf<PermutedInput>, "address" | "energy">>;
export type EventCarriesNoPermutedInput = Assert<IsNever<EventLeafLeak>>;
