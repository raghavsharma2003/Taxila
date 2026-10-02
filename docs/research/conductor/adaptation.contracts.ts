// adaptation.contracts.ts — the cross-day adaptation contract for the Conductor (G2-adaptation-contract).
// Status: design contract, 2026-10-02. Lands as shared/conductor/adapt.ts + additions to shared/conductor/{events,
// state,plan}.ts and shared/contracts.ts (LessonBrief). Pure types and pure functions only: no I/O, no Date.now,
// no Math.random (CONDUCTOR §3.4, I-C6). Every number tagged [U] is a launch default that a CM-A measurement
// (adaptation-policy.md §9) replaces.
//
// Reads with: CONDUCTOR.md §2-§4; adaptation-policy.md (rule table §4, precedence §5, events §6, sims §8).
// Revision G1 (gap-fill G1-adaptation-policy, 2026-10-02): R0 added; CloseLite ring 8 → 16 (R2 needs it) behind a packed
// codec; latches for R3 and R7; foldedDay; asymmetric R6; R2 thresholds re-picked from the multi-seed rerun; §8
// PlannerInputs / planDay / inputsHash; §9 constraint registration (I-A2); RULES as data. The .md is authoritative.

// Self-contained so it type-checks alone (`npx tsc --noEmit --strict --target es2022 adaptation.contracts.ts`).
// These mirror CONDUCTOR §2.2/§4.2/§4.5 and shared/contracts.ts; on landing, import them instead.
export type Band = 'B1' | 'B2' | 'B3' | 'B4';
export type Lane = 'realtime' | 'realtime_mini' | 'cascade' | 'tap';
export type FormatFamily = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';
export type SkillStatus = 'unseen' | 'introduced' | 'practising' | 'learned_today' | 'mastered' | 'due';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. ConductorChildView: the ONLY learner surface decide() may read (replaces the untyped ChildBrief/BriefReader)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

/** Every field is wrapped. `asOf` is the writer's commit time of the value; `src` is the writer's version. */
export interface Fresh<T> { value: T; asOf: string; src: string; stale: boolean }

/** The sole writer of each source. A field with two writers is a bug (CONDUCTOR §1.1 rule 1). */
export type ViewWriter =
  | 'kt.ledger'            // server/learner turn path (kt_* tables; KT row lock §5.6)
  | 'kt.refit'             // nightly ACA job: η, θ, item b, labeller M → kt_params version (kt R6)
  | 'srl.close'            // Director close step: vy_fade_state, solo counts (srl §6)
  | 'srl.weekly'           // weekly `srl.dependency:{child}:{isoWeek}` job → vy_dep_window + learner.dependency_flag
  | 'fmt.refit'            // nightly format-efficacy posterior (LS §8.4; population-first, PZ9)
  | 'mi.close'             // Director sessionClose(): interest_record, motivation_session_agg, child_thread (MI §7)
  | 'tm.consolidate'       // memory.consolidate job (TM §3.3)
  | 'need.api'             // parent/child need writes: need_goal, placement (need §4.2)
  | 'conductor.fold'       // the Conductor itself, from events (lives in ConductorState.adapt; listed for replay)
  | 'governor';            // admission/cost governor (conductor_usage, budget)

/** Staleness bounds: older than this ⇒ reader returns the declared fallback and sets stale = true (V25). */
export const MAX_AGE_H = {
  'kt.ledger': 0,          // read live under the snapshot taken at step start (consistent read, never stale)
  'kt.refit': 36,          // nightly; one missed night tolerated
  'srl.close': 0,          // written in the lesson.ended transaction
  'srl.weekly': 9 * 24,    // weekly window + 2 days
  'fmt.refit': 72,
  'mi.close': 0,
  'tm.consolidate': 24,    // a lesson's notes may lag one quiet window
  'need.api': 0,
  'conductor.fold': 0,
  'governor': 0,
} as const satisfies Record<ViewWriter, number>;

export type Fade = 0 | 1 | 2 | 3 | 4 | 5;            // srl F0 OWN … F5 MODEL
export type AgeBandVibe = 'A' | 'B' | 'C';            // vibe/sim bands by AGE (6-8 · 9-11 · 12-15), never by class

export interface SkillView {
  status: SkillStatus; pL: number; R?: number;        // R = FSRS retrievability now (fluency/memory skills)
  wheelSpin: boolean; oppsSinceRun3: number;          // kt §2.6: ≥ 10 opps, no 3-in-a-row C0
  lastEvidenceDay?: string; acquiredDay?: string;     // learned_today day (V7)
  fade?: Fade;                                         // srl.close; absent before first item
  openMisconceptions: number;
  prereqs: Array<{ skillId: string; pL: number }>;    // depth 1 only; planner walks depth ≤ 3 itself
}

/**
 * Keys are the EXACT brief_value keys recorded in decision_log (dotted, stable, versioned by src).
 * The recording reader records { key: { value, asOf, src, stale } } for every key a fired rule touched.
 */
export interface ConductorChildView {
  // identity (child row; parent API). Not adaptive, listed so replay sees what the band rules read.
  'id.ageYears': Fresh<number>;                       // writer need.api; brief key id.ageYears
  'id.band': Fresh<Band>;                             // derived from classLevel (CONDUCTOR §4.1); conductor.fold
  'id.vibeBand': Fresh<AgeBandVibe>;                  // derived from age; resolves the B1-B4 vs A/B/C mismatch
  // knowledge (KT owns mastery; the Conductor never writes it)
  'kt.skill': Fresh<Record<string, SkillView>>;       // only candidate skills for today (≤ 40); key kt.skill.<id>
  'kt.due': Fresh<Array<{ itemOrSkill: string; overdueRatio: number }>>;  // (now − due)/S, CONDUCTOR §4.4 item 4
  'kt.theta': Fresh<Record<string, { mu: number; sd: number }>>;          // per subject, GE units, kt §3.2
  'kt.eta': Fresh<{ value: number; nOpps: number; nSkills: number }>;     // kt §2.5; INTERNAL ONLY (kt R18)
  'kt.learnedToday7': Fresh<{ learned: number; introduced: number }>;     // last 7 learning days
  // independence (srl)
  'srl.solo28': Fresh<{ attempted: number; ok: number; declined: number }>;
  'srl.dep': Fresh<{ lesson: boolean; homework: boolean; tohHigh: boolean; since?: string; nEligible: number; nHelp: number }>;
  // need (school, tests and the parent's goals; the school fold itself is ConductorState.school)
  'need.parentGoals': Fresh<Array<{ kind: string; rank: 1 | 2 }>>;
  'need.gapGrades': Fresh<Record<string, number>>;    // strand → θ − enrolled level, clamped [-3, 3]; internal only
  // format efficacy (population-first; child rows only after the HTE gate AND consent, PZ9 / LS §8.6)
  'fmt.best': Fresh<Record<string, { ranked: FormatFamily[]; margin: number; scope: 'population' | 'child' }>>; // key fmt.best.<topicType>:<vibeBand>
  // motivation and interest (mode-gated: absent unless persisted_adaptive, MI §2.2)
  'mi.interest': Fresh<Record<string, { phase: 1 | 2 | 3 | 4 }>> | null;
  'mi.thread': Fresh<{ threadId: string; skillId?: string; openedDay: string } | null>;
  'mi.choices28': Fresh<{ offered: number; taken: number; teacherPick: number; harderPicked: number }>;
  // memory (only what the opener rule needs; the notebook packet itself goes to the Director)
  'tm.opener': Fresh<{ available: boolean; type?: 'C1' | 'C2' | 'C3' | 'C6' | 'C7' }>;
  // budget (read through the same recorder so a replay sees the same numbers)
  'gov.voiceLeftSec': Fresh<Partial<Record<Lane, number>>>;
  'gov.capMin': Fresh<number>;
}
export type ViewKey = keyof ConductorChildView;

/** Declared fallbacks: what a rule sees when its field is stale or absent. Fallbacks never fire a rule (V25). */
export const FALLBACK: Partial<Record<ViewKey, unknown>> = {
  'kt.eta': { value: 0, nOpps: 0, nSkills: 0 },
  'srl.dep': { lesson: false, homework: false, tohHigh: false, nEligible: 0, nHelp: 0 },
  'fmt.best': {},
  'mi.interest': null,
  'tm.opener': { available: false },
};

export interface ViewReader {
  /** Records the read into the step's brief_value map; returns the fallback when stale. */
  get<K extends ViewKey>(k: K, sub?: string): ConductorChildView[K];
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. Conductor-side adaptation memory (hysteresis needs persisted state; decide() stays pure)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export type VibeClose = 'fine' | 'strained' | 'tired';
export interface CloseLite {                          // appended on lesson.ended; ring, last 16 (T.RING); ≤ 14 days kept
  day: string; localHour: number; vibeClose: VibeClose; endedBy: string; minutes: number; plannedMin: number;
  soloPlanned: number; soloDone: number; soloDeclined: number;
}
export interface RuleLatch { on: boolean; since?: string; fineRun: number }

export interface AdaptMemory {                        // ConductorState.adapt; < 1.5 KB PACKED (adaptation-state-size.py)
  foldedDay?: string;                                 // last learningDay the night fold closed (idempotence, I-A6)
  closes: CloseLite[];
  shortSeg: RuleLatch;                                // R1
  lateSitting: RuleLatch;                             // R2
  reviewBacklog: RuleLatch;                           // R3
  soloUp: RuleLatch;                                  // R7
  paceBudget: { value: 0 | 1 | 2; since?: string; agreeDays: number; backRun: number };   // R6 (enter run / exit run)
  repSwitch: Record<string, { day: string; from: FormatFamily; to: FormatFamily }>;   // R4, per skill, 30 d TTL, ≤ 8 (LRU)
  prereqChecked: Record<string, { day: string; result: 'pass' | 'fail' }>;            // R5, 14 d TTL, ≤ 8 (LRU)
  routineCardDay?: string;                            // R14: last day a routine card was shown to the parent
  choice?: ChoiceLite;                                // the latest unconsumed child choice for a plan slot
  goal?: ChildGoal;                                   // ≤ 1 active (V23)
  optIns: Partial<Record<OptInFeature, { on: boolean; version: number }>>;
  depFlag: { lesson: boolean; homework: boolean; tohHigh: boolean; since?: string };   // mirror of srl.dep events
  lastHomePick?: { isoWeek: string; activityId: string; kind: HomeActivityKind };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. Child-agency and learner events (additions to the StudentEvent union, CONDUCTOR §2.2)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export type ChoiceContext = 'next_topic' | 'game_theme' | 'subgoal_order' | 'context_skin' | 'format_offer'
  | 'diagnostic_pick' | 'burst_or_rest';
export type CueId = 'after_snack' | 'after_tuition' | 'after_homework' | 'before_dinner' | 'after_dinner' | 'anchor';
export type ObstacleId = 'tired' | 'phone_busy' | 'tv' | 'homework_heavy' | 'forgot' | 'hard_step' | 'other';
export type ActionId = 'start_with_burst' | 'ask_for_phone' | 'do_one_item' | 'tell_teacher_hard_part' | 'set_anchor_reminder';
export type OptInFeature = 'mcii' | 'standard' | 'own_reminders';
export type HomeActivityKind = 'child_teaches' | 'everyday_maths_talk' | 'read_aloud' | 'show_work' | 'routine_only';
export interface ChoiceLite { offerId: string; context: ChoiceContext; picked: string; teacherPick: boolean; forDay: string }

export interface ChildGoal {
  goalId: string;                                      // `${isoWeek}:${n}`
  isoWeek: string; skillIds: string[];                 // ONE skill or one task (need §4.6)
  byWeekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  mcii?: { obstacle: ObstacleId; cue: CueId; action: ActionId };   // age ≥ 12 only (V23)
  status: 'active' | 'met' | 'not_met' | 'dropped' | 'expired';
}

export type AdaptEvent =
  // device or Director, whoever rendered the offer; options carry ids only (no free text: CONDUCTOR §2.3)
  | { type: 'child.choice_made'; offerId: string; context: ChoiceContext; options: string[]; picked: string;
      via: 'tap' | 'voice'; lessonId?: string; forDay?: string }
  | { type: 'child.plan_stated'; lessonId: string; cue: CueId; action: { kind: 'topic' | 'game' | 'review'; ref: string } }
  | { type: 'child.goal_set'; goalId: string; isoWeek: string; skillIds: string[]; offered: string[];
      byWeekday?: number; mcii?: { obstacle: ObstacleId; cue: CueId; action: ActionId } }
  | { type: 'child.goal_closed'; goalId: string; status: 'met' | 'not_met' | 'dropped' | 'expired'; by: 'child' | 'system';
      evidenceSeq?: number }
  | { type: 'child.thread_opened' | 'child.thread_closed'; threadId: string; skillId?: string; how?: 'answered' | 'skipped' | 'expired' }
  | { type: 'child.optin_changed'; feature: OptInFeature; on: boolean; version: number }
  // learner-model writers (source 'agent'); transitions only
  | { type: 'learner.dependency_flag'; lane: 'lesson' | 'homework'; on: boolean; cause: 'cri' | 'toh';
      windowEnd: string; refVersion: string; nEligible: number; nHelp: number; jobId: string }
  | { type: 'learner.params_refit'; kind: 'eta_theta' | 'format'; paramsVersion: string; jobId: string };

/** Idempotency keys (CONDUCTOR §3.10 rule: derived from the fact, never from a clock or random value). */
export const IDEM = {
  'child.choice_made': (e: { offerId: string }) => `choice:${e.offerId}`,
  'child.plan_stated': (e: { lessonId: string }) => `plan_stated:${e.lessonId}`,
  'child.goal_set': (e: { goalId: string }) => `goal_set:${e.goalId}`,
  'child.goal_closed': (e: { goalId: string }) => `goal_closed:${e.goalId}`,
  'child.thread_opened': (e: { threadId: string }) => `thread:${e.threadId}:opened`,
  'child.thread_closed': (e: { threadId: string }) => `thread:${e.threadId}:closed`,
  'child.optin_changed': (e: { feature: string; version: number }) => `optin:${e.feature}:${e.version}`,
  'learner.dependency_flag': (e: { lane: string; windowEnd: string; cause: string }) => `dep:${e.lane}:${e.cause}:${e.windowEnd}`,
  'learner.params_refit': (e: { kind: string; paramsVersion: string }) => `refit:${e.kind}:${e.paramsVersion}`,
} as const;
/** offerId is minted by the offerer, deterministically: lesson offers `${lessonId}:${turn}:${context}`;
 *  home offers `home:${planDay}:${planVersion}:${slotId}`; wrap offers `wrap:${lessonId}`. */

/** Additions to LessonOutcomeDigest (Director close step). */
export interface OutcomeDigestAdd {
  soloPlanned: number; soloDone: number; soloOk: number; soloDeclined: number;
  prereqChecks: Array<{ skillId: string; result: 'pass' | 'fail' }>;
  representationUsed?: { skillId: string; family: FormatFamily };
  openerDelivered: OpenerKind | 'none';               // brief honoured? (V-delivery audit, §6.4)
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 4. Plan-knob additions (DayPlan / PlannedSlot / LessonBrief)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

/** The FRAMING of the P1 warm-up. Every opener still carries ≥ 2 due retrieval items (V5). Success-first is a
 *  separate knob (targetP .85-.95 on the first items, MI §2.6), because it is orthogonal to the kind. */
export type OpenerKind = 'standard_retrieval' | 'reanchor_light' | 'goal_review' | 'thread_return' | 'callback';
export type WhyCodeAdd = 'child_goal' | 'thread_return' | 'representation_switch' | 'prereq_check' | 'independence';

export interface PlannedSlotAdd {
  pace?: { newSkillBudget: 0 | 1 | 2 };                // R6 (η, θ); B1 ≤ 1
  soloRounds?: number;                                 // R7; band base (B1 2, else 3) … base + 1
  opener?: OpenerKind;                                 // R8
  successFirst?: boolean;                              // R8b
  representation?: { skillId: string; preferFamily: FormatFamily; avoidEngines: string[] };  // R4
  prereqCheck?: { skillId: string; forTopicId: string };                                      // R5
  foundationShare?: number;                            // R9 (replaces the fixed 60/40)
}
export interface RuleFiring {
  rule: RuleId; knob: KnobId; from: unknown; to: unknown; layer: Layer;
  evidence: string[];                                  // brief_value keys (+ sub-keys) the rule read: V24
  blockedBy?: { layer: Layer; reason: string };        // proposal dropped by precedence (§5)
}
export interface DayPlanAdd { adapt: { rules: RuleFiring[]; viewSrc: Record<string, string> } }  // inside day_plan.plan
export interface LessonBriefAdd {
  opener: OpenerKind; successFirst: boolean; soloRounds: number; newSkillBudget: 0 | 1 | 2;
  representation?: PlannedSlotAdd['representation']; prereqCheck?: PlannedSlotAdd['prereqCheck'];
  goalReview?: { goalId: string; skillIds: string[] };
  choiceAck?: { offerId: string; honoured: boolean }; // a blocked child choice still gets an acknowledgement shape
  adaptTrace: RuleId[];                                // ops only; never compiled into a prompt
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 5. Precedence: safety > limits > budget > KT > SRL fading > vibe > interest (guard/handler code)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const LAYERS = ['safety', 'limits', 'budget', 'kt', 'srl', 'vibe', 'interest'] as const;
export type Layer = typeof LAYERS[number];
export const rank = (l: Layer) => LAYERS.indexOf(l);   // 0 = highest

export type KnobId = 'segmentMinutes' | 'laneMix' | 'reviewShare' | 'representation' | 'prereqCheck' | 'soloRounds'
  | 'opener' | 'successFirst' | 'homeLoop' | 'pace' | 'foundationShare' | 'topic' | 'goalCard' | 'routineCard';

/** Which layer may PROPOSE a value for which knob. Constraint layers (safety, limits, budget) may bound any knob.
 *  A proposal from a layer not listed is rejected at registration (I-A1): this is how an F-class signal is kept
 *  off an L-class knob (PZ2, PZI7). */
export const MAY_PROPOSE: Record<KnobId, Layer[]> = {
  segmentMinutes: ['kt', 'vibe'],                      // KT sets the floor (obligations); vibe picks inside
  laneMix: ['kt', 'vibe'],
  reviewShare: ['kt'],                                 // never vibe or interest: LS-18 is a floor, not a preference
  representation: ['kt'],
  prereqCheck: ['kt'],
  soloRounds: ['srl'],
  opener: ['kt', 'srl', 'interest'],                  // reanchor (kt) > goal_review (srl) > thread/callback (interest)
  successFirst: ['kt', 'vibe'],                        // kt forces it after a ≥ 7-day gap; vibe after a bad close
  homeLoop: ['kt', 'srl', 'interest'],
  pace: ['kt'],
  foundationShare: ['kt'],                             // need weights enter as KT-tier inputs (need §4.7)
  topic: ['kt', 'interest'],                           // test window/school/parent focus are KT-tier; child choice is interest-tier
  goalCard: ['srl', 'interest'],
  routineCard: ['kt'],                                 // FACTS tier: reads endedBy counts only, never vibe (V27, pl PA-6)
};

export type Domain = { kind: 'range'; lo: number; hi: number } | { kind: 'set'; values: readonly string[] };
export interface Constraint { knob: KnobId; layer: Layer; domain: Domain; reason: string }
export interface Preference {
  knob: KnobId; layer: Layer; rule: RuleId; value: number | string;
  slack?: Domain;            // how far LOWER layers may move this value (default: not at all)
  evidence: string[];
}

const intersect = (a: Domain, b: Domain): Domain | null => {
  if (a.kind === 'range' && b.kind === 'range') {
    const lo = Math.max(a.lo, b.lo), hi = Math.min(a.hi, b.hi); return lo <= hi ? { kind: 'range', lo, hi } : null;
  }
  if (a.kind === 'set' && b.kind === 'set') {
    const v = a.values.filter((x) => b.values.includes(x)); return v.length ? { kind: 'set', values: v } : null;
  }
  return null;               // mixed kinds are a registration error (I-A1)
};
const contains = (d: Domain, v: number | string) =>
  d.kind === 'range' ? typeof v === 'number' && v >= d.lo && v <= d.hi : d.values.includes(String(v));
const project = (d: Domain, v: number | string): number | string =>
  d.kind === 'range' ? Math.min(d.hi, Math.max(d.lo, Number(v))) : (d.values.includes(String(v)) ? v : d.values[0]);

/**
 * resolveKnob — the arbitration rule CONDUCTOR never gave (vibe-temperament R6 item 54).
 * 1. Constraints are intersected in precedence order. A lower-layer constraint that would empty the domain is
 *    dropped and logged: a lower layer never overrides a higher one, and never re-enables what it blocked.
 * 2. The highest-precedence preference sets the value (projected into the domain).
 * 3. A lower preference may move the value only inside the slack the current owner declared, and only inside the
 *    domain. Otherwise it is dropped and logged as blocked. Ties inside one layer: the rule listed first in RULES.
 * Pure; byte-deterministic; every drop lands in decision_log.decisions[].blocked.
 */
export function resolveKnob(knob: KnobId, base: Domain, cons: Constraint[], prefs: Preference[]):
  { value?: number | string; domain: Domain; owner?: Preference; blocked: Array<{ by: Layer; dropped: Constraint | Preference; reason: string }> } {
  const blocked: Array<{ by: Layer; dropped: Constraint | Preference; reason: string }> = [];
  let d = base, dOwner: Layer = 'safety';
  for (const c of [...cons].filter((c) => c.knob === knob).sort((a, b) => rank(a.layer) - rank(b.layer))) {
    const n = intersect(d, c.domain);
    if (n) { d = n; dOwner = c.layer; } else blocked.push({ by: dOwner, dropped: c, reason: 'empties_domain' });
  }
  const mine = prefs.filter((p) => p.knob === knob);
  for (const p of mine) if (!MAY_PROPOSE[knob].includes(p.layer))      // e.g. vibe proposing reviewShare
    blocked.push({ by: p.layer, dropped: p, reason: 'layer_not_permitted' });
  const ordered = mine.filter((p) => MAY_PROPOSE[knob].includes(p.layer))
    .sort((a, b) => rank(a.layer) - rank(b.layer));                     // stable sort: RULES order breaks ties
  let value: number | string | undefined, owner: Preference | undefined, window: Domain | undefined;
  for (const p of ordered) {
    if (value === undefined) {
      value = project(d, p.value); owner = p;
      window = p.slack ? (intersect(d, p.slack) ?? undefined) : undefined;
      if (value !== p.value) blocked.push({ by: dOwner, dropped: p, reason: 'projected_into_domain' });
      continue;
    }
    if (window && contains(window, p.value)) { value = p.value; continue; }   // allowed nudge; owner unchanged
    blocked.push({ by: owner!.layer, dropped: p, reason: 'outside_owner_slack' });
  }
  return { value, domain: d, owner, blocked };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 6. Rule registry (the table in adaptation-policy.md §4, as data; thresholds [U] → CM-A*)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export type RuleId = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14';
export interface RuleSpec {
  id: RuleId; knob: KnobId; alsoKnobs?: KnobId[]; layer: Layer; cls: 'L' | 'L?' | 'F';  // PZ2 evidence class of the knob change
  reads: ViewKey[] | Array<ViewKey | `state.adapt.${string}`>;
  minN: string; hysteresis: string; bounds: string; reversal: string; // human-readable; the code is in rules/*.js
}
export const T = {                     // thresholds, one place, each with its measurement id (policy §4, §8)
  RING: 16, RING_MAX_DAYS: 14,
  // R1: seeds 11-18, n = 8 × 2000 steady children: 2.5% of sittings ON, but 23.6% of children latch at least once in
  // 8 weeks (the earlier "false-on 2.6%" was the sitting share, not the child share); flips 0.49/child/8 wk; CM-A1
  R1_ON_K: 3, R1_ON_M: 4, R1_OFF_FINE: 3,
  // R2: night fold over the ring. .30/.30 → 23.5% false latch; .40/.20 → 15.9% false, 91.3% hit; CM-A2
  R2_MIN_EACH: 4, R2_GAP_ON: 0.40, R2_GAP_OFF: 0.20, R2_LATE_HOUR: 20,
  R3_ON_OVERDUE: 6, R3_OFF_OVERDUE: 2, R3_OVERDUE_RATIO: 1.0, R3_SHARE_ON: 0.25, R3_SHARE_BASE: 0.15,
  R4_COOLDOWN_D: 3, R4_TTL_D: 30, R5_RECHECK_D: 3, R5_PL_BELOW: 0.4, R5_MAX_DEPTH: 3, R5_TTL_D: 14,
  // R6: enter at ±0.5 (1 prior sd, kt §2.5), exit inside ±0.25; up needs 2 agreeing refits, down 3 (costlier if wrong)
  R6_ETA_UP: 0.5, R6_ETA_DOWN: -0.5, R6_ETA_EXIT: 0.25, R6_MIN_OPPS: 30, R6_MIN_SKILLS: 3,
  R6_AGREE_DAYS: 2, R6_AGREE_DOWN: 3, R6_EXIT_RUN: 2,                                      // CM-A3
  R7_MAX_EXTRA: 1, R7_ON_OK: 0.8, R7_ON_MIN_ATTEMPTS: 8, R7_OFF_DECLINE: 0.4,             // CM-A6
  R8_GAP_DAYS: 7,
  R9_BASE: 0.2, R9_SLOPE: 0.15, R9_MAX: 0.6, R9_EXAM_MULT: 0.5, R9_CATCHUP_FLOOR: 0.5,     // need §4.7 ∩ CONDUCTOR §4.4
  R10_MIN_DAYS_LEFT: 1,
  R13_MIN_AGE_MCII: 12,
  R14_MIN_OF_LAST: [3, 5], R14_COOLDOWN_D: 14,
  HASH_Q: { pL: 0.01, eta: 0.05, ratio: 0.1, voiceSec: 30, minutes: 1, localMin: 15 },     // inputsHash quantisation
} as const;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 7. conductor-sim persona contract (evals/conductor-sim/personas/*.json), with planted negative controls
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export interface DayPersona {
  id: 'fast_learner' | 'wheel_spinner' | 'over_reliant' | 'tired_every_evening' | 'interest_switcher' | 'goal_setter_teen'
    | 'exam_vs_thread' | string;
  seed: number; band: Band; ageYears: number; weeks: number;
  routine: { anchorLocal: string; openHours: number[]; openHourP: number[]; daysPerWeek: number };
  truth: {
    eta: number;                                       // true learning-speed offset (logit), kt §2.5
    skillT: number; forgetS0Days: number;              // day-level SimChild (student-simulators §4.4-4.5)
    prereqGap?: { skillId: string; blocks: string[] }; // makes wheel-spin real on the blocked skills
    dependency: number;                                // δ of metacognition-srl-depsim.py, independent of θ
    pBadClose: { early: number; late: number };        // P(strained|tired) by sitting hour (< / ≥ 20:00)
    interestPath?: Array<{ fromWeek: number; tag: string }>;    // interest-switcher
    choiceTake: number; teacherPickP: number;          // MI D9
  };
  plantedBadRule?: PlantedRule;                        // the negative control: the gate MUST trip with it on
}
export interface PlantedRule { id: string; description: string; mustTrip: string[] }   // invariant / validator ids

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 8. The planner seam (G1): planDay is pure over PlannerInputs; inputsHash is sha256 over RFC 8785 JCS bytes
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export type DayKind = 'school_day' | 'free_day' | 'holiday' | 'off';
export interface TestWindowLite { subject: string; on: string; chapters: string[]; kind: 'unit' | 'periodic' | 'term'; daysLeft: number }
export interface FrozenSlotRef { slotId: string; digest: string }      // shown/started slots, carried verbatim (V10)
/** A recorded view value as it enters the hash: asOf is DROPPED (stale is already decided against the recorded now). */
export interface ViewIn { value: unknown; src: string; stale: boolean }

export interface PlannerInputs {
  v: 1;
  build: { plannerSha: string; cfgDigest: string; thresholdsV: string };          // code + config + T version
  child: { band: Band; vibeBand: AgeBandVibe; ageYears: number; tier: string };
  day: { learningDay: string; dayKind: DayKind; reason: 'first_open' | 'day_start' | 'replan' | 'resume' | 'parent_change';
         anchor: { kind: 'window_start' | 'opened' | 'replan'; localHHMM: string } };   // floored to T.HASH_Q.localMin
  window: { from: string; to: string; bedtimeMinus60: string; bedtimeMinus30: string };  // clockPhase bounds, local
  limits: { capMin: number; hwSubCapMin: number; restDay: boolean; careEffect?: 'gentle_mode' };
  mode: 'free' | 'paused' | 'safety_hold';                                        // in_lesson never plans
  school: { testWindows: TestWindowLite[]; pointers: Record<string, string> };
  homework: Array<{ taskId: string; dueDay: string; estMin: number }>;
  promises: Array<{ id: string; kind: string; ref: string }>;
  frozen: { planVersion?: number; slots: FrozenSlotRef[] };
  usage: { usedMin: number; hwUsedMin: number };                                  // floored to whole minutes
  voice: { leftSec: Partial<Record<Lane, number>>; activeDaysLeftEst: number };   // floored to 30 s
  adapt: AdaptMemory;
  view: Record<string, ViewIn>;          // EXACTLY the keys planKeys() named, read through the recording ViewReader
  arms: Record<string, string>;          // experiment → arm (pure hash assignment, obs O10)
}
export type PlannerBase = Omit<PlannerInputs, 'view'>;
/** Pure: which view keys (with sub-keys, e.g. 'kt.skill.m1.ch4.add') this plan may read. Deterministic in `base`. */
export type PlanKeys = (base: PlannerBase) => string[];
/** Pure: no clock, no I/O, no randomness, no reader. Reads only `inputs`. */
export type PlanDay = (inputs: PlannerInputs) => { plan: unknown /* DayPlan & DayPlanAdd */; firings: RuleFiring[] };
/** inputsHash = 'pi1:' + lowercase hex sha256(JCS(quantise(inputs))). JCS = RFC 8785. Quantise BEFORE hashing. */
export const quantise = (x: number, q: number) => Math.round(x / q) * q;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 9. Constraint registration (I-A2): a constraint resolveKnob could drop as `empties_domain` must never get there
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export function registerConstraint(c: Constraint): Constraint {
  if (!(['safety', 'limits', 'budget'] as Layer[]).includes(c.layer)) throw new Error(`I-A2: ${c.layer} may not constrain`);
  if (c.layer === 'budget' && c.knob !== 'laneMix') throw new Error('I-A2: budget constrains laneMix only');
  if (c.knob === 'laneMix' && !(c.domain.kind === 'set' && c.domain.values.includes('tap')))
    throw new Error('I-A2: a laneMix constraint must keep the zero-cost floor lane tap');
  if (c.domain.kind === 'range' ? c.domain.lo > c.domain.hi : c.domain.values.length === 0)
    throw new Error('I-A2: empty constraint domain');
  return c;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 10. RULES as data (adaptation-policy.md §4 is the human-readable table; order = tie-break order in resolveKnob)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const RULES: RuleSpec[] = [
  { id: 'R0', knob: 'segmentMinutes', alsoKnobs: ['laneMix', 'topic', 'pace', 'reviewShare'], layer: 'kt', cls: 'L',
    reads: ['kt.due', 'kt.skill', 'need.gapGrades'], minN: '-', hysteresis: '-', bounds: 'band template §4.3', reversal: 'CONDUCTOR §4.4' },
  { id: 'R1', knob: 'segmentMinutes', alsoKnobs: ['successFirst'], layer: 'vibe', cls: 'F', reads: ['state.adapt.closes'],
    minN: '4 closes', hysteresis: 'on 3/4 bad, off 3 fine', bounds: '≥ band minimum set', reversal: 'CM-A1' },
  { id: 'R2', knob: 'segmentMinutes', layer: 'vibe', cls: 'F', reads: ['state.adapt.closes'],
    minN: '4 late + 4 early', hysteresis: 'on gap ≥ .40, off < .20', bounds: 'late sittings only', reversal: 'CM-A2' },
  { id: 'R3', knob: 'reviewShare', layer: 'kt', cls: 'L', reads: ['kt.due'],
    minN: '-', hysteresis: 'on ≥ 6 overdue, off ≤ 2', bounds: '.15-.25 of lesson min', reversal: 'CM-A4' },
  { id: 'R4', knob: 'representation', layer: 'kt', cls: 'L', reads: ['kt.skill', 'fmt.best'],
    minN: '10 opps (wheel-spin)', hysteresis: '3 d cooldown per skill', bounds: 'never the same family', reversal: 'CM-A4' },
  { id: 'R5', knob: 'prereqCheck', layer: 'kt', cls: 'L', reads: ['kt.skill'],
    minN: '10 opps (wheel-spin)', hysteresis: '3 d recheck', bounds: 'depth ≤ 3, 1 per lesson', reversal: 'CM-A4' },
  { id: 'R6', knob: 'pace', layer: 'kt', cls: 'L', reads: ['kt.eta'],
    minN: '30 opps, 3 skills', hysteresis: 'enter ±.5 (2 up / 3 down refits), exit inside ±.25 (2)', bounds: '0-2, B1 ≤ 1', reversal: 'CM-A3' },
  { id: 'R7', knob: 'soloRounds', layer: 'srl', cls: 'L?', reads: ['srl.solo28', 'srl.dep'],
    minN: '8 solo attempts', hysteresis: 'on ok ≥ .8 or dep flag; off decline ≥ .4', bounds: 'base … base + 1', reversal: 'CM-A6' },
  { id: 'R8', knob: 'opener', alsoKnobs: ['successFirst'], layer: 'kt', cls: 'L?', reads: ['tm.opener', 'mi.thread'],
    minN: '-', hysteresis: '-', bounds: '≥ 2 due retrieval items always (V5)', reversal: 'CM-A7' },
  { id: 'R9', knob: 'foundationShare', layer: 'kt', cls: 'L', reads: ['need.gapGrades', 'need.parentGoals'],
    minN: 'placement done', hysteresis: 'weekly recompute', bounds: '0-.6; × .5 in a test window', reversal: 'CM-A5' },
  { id: 'R10', knob: 'laneMix', layer: 'budget', cls: 'F', reads: ['gov.voiceLeftSec'],
    minN: '-', hysteresis: 'lane fixed per lesson (I-R7)', bounds: 'always keeps tap', reversal: 'CM6' },
  { id: 'R11', knob: 'topic', layer: 'interest', cls: 'F', reads: ['state.adapt.choice', 'mi.choices28'],
    minN: '-', hysteresis: 'one choice per slot, consumed', bounds: 'inside the KT domain only', reversal: 'CM-A7' },
  { id: 'R12', knob: 'homeLoop', layer: 'srl', cls: 'L?', reads: ['srl.dep', 'mi.interest'],
    minN: '-', hysteresis: 'weekly; no repeat kind 2 weeks running', bounds: '≤ 1 activity/week (PLI)', reversal: 'PLM' },
  { id: 'R13', knob: 'goalCard', layer: 'srl', cls: 'L?', reads: ['id.ageYears', 'mi.choices28'],
    minN: '-', hysteresis: '≤ 1 active goal; weekly', bounds: 'MCII ≥ 12 y and opt-in', reversal: 'CM-A7' },
  { id: 'R14', knob: 'routineCard', layer: 'kt', cls: 'F', reads: ['state.adapt.closes'],
    minN: '5 closes', hysteresis: '3 of last 5 cut short; 14 d cooldown', bounds: 'parent in-app only; endedBy facts only', reversal: 'DC-M1' },
];
