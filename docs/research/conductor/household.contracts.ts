// household.contracts.ts (gap-fill G3-household-siblings) — lift into shared/conductor/household.ts.
// Design: household.md. SQL: household.sql. Reference allocator + persona sim: household-sim.mjs.
// Self-contained for `tsc --noEmit --strict`; the four aliases below stand in for the shared/conductor types.
export type ChildId = string; export type GuardianId = string; export type DeviceId = string;
export type HouseholdId = string; export type Band = 'B1' | 'B2' | 'B3' | 'B4';
export type LocalHHMM = `${number}:${number}`;            // household-tz wall clock, floored to 5 min
export type IsoDate = string; export type IsoInstant = string;

// ───────────────────────── §2.1 household facts and members ─────────────────────────
export interface HouseholdFacts {
  id: HouseholdId; ownerGuardianId: GuardianId; tz: string;          // every member's RoutineFacts.tz === tz (I-H12)
  anchorSchool: LocalHHMM; anchorOff: LocalHHMM;                      // parent-authored (DC1); the anchor is the household's
  phones: 1 | 2 | 3;                                                  // planning lanes; a lane is a phone
  orderMode: 'younger_first' | 'parent_fixed';
  version: number;                                                    // allocator CAS
}
export interface HouseholdMember {
  childId: ChildId; householdId: HouseholdId;
  ref: number;                     // ordinal, never reused; the ONLY member id in household-level audit rows
  state: 'active' | 'leaving';     // 'leaving' is set by the erasure fence (2b) and nothing else
  fixedPos?: number; estMin?: number;
}

// ───────────────────────── §2.2 child → household reports (household_inbox rows) ─────────────────────────
// Emitted as a Conductor command and written as a NEW household_inbox row inside the child's commit.
export type HouseholdReport =
  | { type: 'household.plan_reported'; day: IsoDate; requestedMin: number; earliest: LocalHHMM; latestEnd: LocalHHMM;
      band: Band; cause: 'first_open' | 'child_replan' | 'parent_change' | 'test_window' }   // NEVER 'household' (I-H3)
  | { type: 'household.sitting_started'; day: IsoDate; slotId: string; lessonId?: string; lane: number;
      startedAt: IsoInstant; plannedEnd: IsoInstant }
  | { type: 'household.sitting_ended'; day: IsoDate; slotId: string; endedAt: IsoInstant;
      endedBy: 'completed' | 'time_limit' | 'cap' | 'bedtime' | 'child_left' | 'idle' | 'network' | 'profile_switch' | 'safety' | 'outage';
      resumableUntil?: IsoInstant }
  | { type: 'household.sitting_voided'; day: IsoDate; reassignId: string };                // the profile owner never sat
// Written by the parent API / workspace service directly (domain row + inbox row, one transaction):
export type HouseholdAdminReport =
  | { type: 'household.routine_changed'; anchorSchool?: LocalHHMM; anchorOff?: LocalHHMM; phones?: 1 | 2 | 3;
      orderMode?: HouseholdFacts['orderMode']; settingsVersion: number }
  | { type: 'household.member_joined'; ref: number };
// There is deliberately NO 'household.member_left' report: erasure fences, cascades, and re-allocates nothing (I-H6).

// ───────────────────────── §2.3 household → child events (delivered by the wakeup courier) ─────────────────────────
// Body of the student_event; fire_wakeups merges the courier keys {reason:'household'|'reassign', wakeupId} on top.
export interface HouseholdWindowAssigned {
  type: 'household.window_assigned';
  day: IsoDate; hhVersion: number;                  // monotonic per household; the fold ignores hhVersion <= state's
  lane: number; state: 'planned' | 'none';          // 'none': no room before this child's latestEnd today
  from?: LocalHHMM; to?: LocalHHMM;                 // present iff state === 'planned'
  cause: 'morning' | 'sibling_plan' | 'sibling_started' | 'sibling_ended' | 'sibling_overrun' | 'sibling_voided' | 'routine_changed';
  // No sibling id, name, band, length or count, ever (I-H7). `cause` names the kind of change, not the child.
}
export interface SessionReassigned {
  type: 'session.reassigned';
  reassignId: string;                               // → session_reassign row; ids of the other child live only there
  direction: 'out' | 'in';
  scope: { lessonId?: string; packId?: string };
  minutesMoved: number; voiceSecMoved: Partial<Record<'realtime' | 'realtime_mini' | 'cascade', number>>;
  byGuardian: GuardianId;
}
export type HouseholdChildEvent = HouseholdWindowAssigned | SessionReassigned;

// ───────────────────────── §2.4 Conductor-side additions ─────────────────────────
export interface ConductorStateHouseholdAdd {
  household?: {                                     // folded ONLY from household.window_assigned (never read from tables)
    day: IsoDate; hhVersion: number; lane: number; state: 'planned' | 'none'; from?: LocalHHMM; to?: LocalHHMM;
    cause: HouseholdWindowAssigned['cause'];
  };
}
export interface PlannerInputsHouseholdAdd {        // included in inputsHash (X43); window floored to 5 min
  household?: { lane: number; state: 'planned' | 'none'; from?: LocalHHMM; to?: LocalHHMM };
}
export type CommandHouseholdAdd =
  | { kind: 'household.report'; report: HouseholdReport };   // commit → insert household_inbox (new row)
export type ReplanCause = 'lesson_ended' | 'test_announced' | 'pointer_vote' | 'limit_change' | 'wheel_spin' | 'household';
/** I-H3 (no-cascade): a re-plan whose cause is 'household' may emit no 'household.report' of type plan_reported. */
export const mayReportPlan = (cause: ReplanCause): boolean => cause !== 'household';
export interface DecisionLogHouseholdAdd { householdV: number | null }    // decision_log.household_v (I-H4)

// ───────────────────────── §3 the allocator (pure; one owner: writer 'household.alloc') ─────────────────────────
export interface MemberInput {                      // one per active member; stored in household_decision_member
  ref: number; birthYear: number; fixedPos?: number;
  earliest: number; latestEnd: number;              // minutes after local midnight: school end + recovery | allowedFrom;
                                                    // min(allowedTo, bedtime − 60)
  requestedMin: number;                             // last plan_reported today, else estMin, else the band template
  sittings: Array<{ state: 'started'; startedAt: number; plannedEnd: number; lane: number }
                | { state: 'ended'; startedAt: number; endedAt: number; lane: number }>;
  doneForDay: boolean;
  prev: { lane: number; from: number | null; to: number | null; state: 'planned' | 'none' } | null;  // last delivered
  leaving: false;                                   // leaving members are not inputs at all
}
export interface AllocInput {
  v: 1; household: { anchor: number; phones: 1 | 2 | 3; orderMode: HouseholdFacts['orderMode'] };
  day: IsoDate | number; now: number;               // the ONE recorded clock read (household_decision.now_used)
  cfg: { handoverMin: 5; hysteresisMin: 10; minWindowMin: 3; debounceMin: number; courierMin: number; replanDebounceMin: number };
  members: MemberInput[];
}
export interface WindowOut {
  ref: number; seq: number;                         // 0 = the planned window; 1.. = sitting facts
  lane: number; from: number | null; to: number | null;
  state: 'planned' | 'none' | 'frozen' | 'done'; changed?: boolean;
}
/** Pure: no clock, no I/O, no randomness; byte-deterministic in `input` (I-H4). Reference: household-sim.mjs. */
export type Allocate = (input: AllocInput) => WindowOut[];

// ───────────────────────── §4 notifications ─────────────────────────
export type CapScope = { kind: 'guardian'; scope: `learn:${string}` | `wb:${string}` };   // never per (guardian, child)
export interface FamilyLetterEnvelope {             // ONE weekly_letter notification per recipient guardian
  guardianId: GuardianId; householdId: HouseholdId; isoWeek: string;
  letters: Array<{ letterId: string; firstName: string }>;   // filled at SEND time from weekly_letter rows that resolve
  deepLink: `/p/letters/${string}`;
  // Lint I-H11: no string holds a number or a comparative about more than one child (PP4: no sibling comparison).
}

// ───────────────────────── §5 shared device ─────────────────────────
export interface DeviceAdmission { deviceId: DeviceId; childId: ChildId; lessonId: string; priority: 0 | 1 | 2; since: IsoInstant }
export interface ProfileSwitch {                    // client order, enforced by G-LE-5 and tested as I-H8
  steps: readonly ['end_session_and_close_webrtc', 'post_lesson_end_reason_profile_switch', 'flush_evidence_queue',
                   'drop_child_token', 'pick_profile', 'mint_new_child_token', 'admission_for_new_child'];
}
export interface AnchorReminderPlan {               // device-local; one per DEVICE, never per child (I-H9)
  deviceId: DeviceId; householdVersion: number; atLocal: LocalHHMM; maxPerDay: 1; maxPerWeek: 5;
  pauseAfterIgnored: 3;                              // ignored = no app.opened by ANY household profile on this device
  copy: 'household_neutral';                         // no child name, order, count or performance on the lock screen
}
export interface ReassignRequest { reassignId: string; byGuardian: GuardianId; fromChild: ChildId; toChild: ChildId;
  scope: { lessonId?: string; packId?: string } }    // same household only; I-H10 governs what moves
