// Taxila parent loop contracts (docs/research/conductor/parent-loop.md). Proposed homes:
// shared/parent/model.ts, shared/parent/home.ts, and additions to shared/conductor/events.ts.
// HomeActivity, ParentBrief, WeekStory, PTM_TOOLS, ParentIntakeExtract and the detectors are in the .md next to
// their algorithms; the small shared unions they need are declared here so this file stands alone.

export type HomeFeedback = 'done' | 'skipped' | 'too_hard' | 'child_loved' | 'child_refused' | 'no_time';
export type IntakeSlot = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9';
export type AlertClass = 'S' | 'W' | 'L' | 'R' | 'C' | 'A';   // safety, wellbeing, struggle, routine, commitment, account
export type GateOut = 'suppressed' | 'folded_into_letter' | 'queued';
export interface AlertCandidate {
  cls: AlertClass; childId: string; refs: string[]; factIds: string[];
  parentAction?: 'confirm_scope_or_ptm' | 'ptm_or_school_teacher' | 'change_time_or_pause';
  route?: 'push' | 'letter'; dedupe: string;
}
export interface GateResult {
  out: GateOut;
  reason?: 'consent' | 'cap' | 'quiet' | 'dedupe' | 'safety_hold' | 'suppression_branch';
  channels?: Array<'whatsapp' | 'push' | 'app' | 'whatsapp_pointer'>;
  route?: 'childline'; ignoreQuiet?: boolean;
}

// shared/parent/model.ts
export type GuardianRole = 'owner' | 'co_parent' | 'viewer';
export interface GuardianProfile {
  guardianId: string; childIds: string[]; role: GuardianRole;
  language: 'hi' | 'hinglish' | 'en' | string;           // O1
  script: 'deva' | 'roman' | 'latin';
  prefersVoice: boolean;                                  // parent-declared ("sunna pasand hai"), never inferred literacy
  address: string;                                        // how the teacher addresses them (asked at P0)
  channel: { whatsapp: boolean; app: boolean; voiceNote: boolean };
  cadence: 'weekly' | 'daily_pull' | 'daily_push' | 'fortnightly';
  reportSlot: { weekday: 0|1|2|3|4|5|6; time: string };   // default Sun 10:00
  involvement: InvolvementPlan;
  alertPrefs: AlertPrefs;
}
export interface InvolvementPlan {                        // what the parent said they can do (P7)
  minutesPerWeek: 0 | 5 | 15 | 30;                        // home activity budget
  when: 'dinner' | 'travel' | 'bedtime' | 'weekend' | 'any';
  whoAtHome: Array<'mother'|'father'|'grandparent'|'sibling'|'other'>;   // who could do the activity; no names stored
  homeLanguage: string;
  praiseCards: boolean; homeActivity: boolean;
  capacityDial: 0 | 1 | 2;                                // 0 talk-only, 1 talk + 5-min activity, 2 full; adapts (§6.3)
}
export interface AlertPrefs {
  struggleSooner: boolean;                                // default false: struggle waits for the weekly letter
  wellbeingDetail: 'notify_only' | 'notify_with_summary'; // safety tier is not configurable
  quietFrom: string; quietTo: string;                     // default 20:30-08:00 (safety exempt)
}
export interface ParentWorry {                            // P3; a worry is a question to check, not a belief about the child
  id: string; childId: string; topicIds: string[];        // mapped by constrained choice (school-sync §4.1); may be []
  kind: 'academic' | 'exam' | 'habit' | 'confidence' | 'school_relation' | 'other';
  parentWords: null;                                      // never stored verbatim (PX4: labels not echoed or kept)
  status: 'open' | 'checking' | 'answered' | 'withdrawn';
  commitmentId?: string; createdAt: string;
}
export interface ChildHistory {                           // P4; facts only, all optional, "pata nahi" is complete
  priorTuition?: { subjects: string[]; months?: number; whatHelped?: string /* ≤120 chars, parent's words */ };
  schoolChanges?: number; mediumChange?: { from: string; to: string; classLevel: number };
  accommodations?: Array<'extra_wait'|'larger_text'|'read_aloud'|'shorter_turns'|'more_breaks'>;   // never a diagnosis
  pastTestPattern?: 'not_shared' | 'parent_entered';      // marks only via need-goals §8.2
}
export interface CareNote {                               // §4.3; parent-authored, time-limited, never inferred
  id: string; childId: string; text: string;              // ≤160 chars, parent's words, shown back verbatim
  effect: 'gentle_mode' | 'avoid_topic' | 'none';         // shapes the ChildBrief; never mentioned to the child
  avoidTopic?: string; expiresAt: string;                 // ≤ 30 days, renewable once by the parent
}
export interface Commitment {                             // §7.4; the agent's promises, tracked like jobs
  id: string; childId: string; guardianId: string;
  kind: 'check_skill' | 'report_back' | 'try_format' | 'schedule_change' | 'human_followup';
  refs: string[];                                         // skill ids, worry id, ticket id
  dueAt: string; status: 'open' | 'fulfilled' | 'missed' | 'cancelled';
  resultFactIds?: string[];                               // filled from the ledger at fulfilment
}

// ---- additions to shared/conductor/events.ts ----
export type ParentLoopEvent =
  | { type: 'parent.conversation_started'; convId: string; mode: 'intake'|'ptm_voice'|'ptm_text'|'ask'; guardianId: string }
  | { type: 'parent.conversation_ended'; convId: string; minutes: number; reason: 'done'|'parent_left'|'time'|'safety'|'budget' }
  | { type: 'parent.intake_slot'; convId: string; slot: IntakeSlot; filled: boolean; declined: boolean }
  | { type: 'parent.worry_recorded'; worryId: string; kind: ParentWorry['kind']; topicIds: string[] }
  | { type: 'parent.focus_requested'; proposalId: string; skillIds: string[]; by: string }
  | { type: 'parent.schedule_proposed'; proposalId: string; anchor?: string; dailyMin?: number; pauseUntil?: string }
  | { type: 'parent.care_note_set'; noteId: string; effect: CareNote['effect']; expiresAt: string }
  | { type: 'parent.care_note_expired'; noteId: string }
  | { type: 'parent.commitment_created'; commitmentId: string; kind: Commitment['kind']; dueAt: string; refs: string[] }
  | { type: 'parent.commitment_closed'; commitmentId: string; status: 'fulfilled'|'missed'|'cancelled'; factIds: string[] }
  | { type: 'parent.home_activity_assigned'; activityId: string; version: number; isoWeek: string }
  | { type: 'parent.home_activity_feedback'; activityId: string; isoWeek: string; fb: HomeFeedback }
  | { type: 'parent.letter_sent'; letterId: string; isoWeek: string; channels: string[] }
  | { type: 'parent.voice_note_played'; letterId: string; secondsPlayed: number }
  | { type: 'parent.reply_received'; payload: string; via: 'whatsapp'|'app' }
  | { type: 'parent.support_ticket'; ticketId: string; kind: string }
  | { type: 'child.wellbeing_statement'; incidentId: string; cls: 'bullying'|'fear'|'loneliness'|'marks_fear'|'other'; askedToShare: 'yes'|'no'|'not_asked' }
  | { type: 'alert.candidate'; alertId: string; cls: AlertClass; dedupe: string }
  | { type: 'alert.gated'; alertId: string; out: GateOut; reason?: string }
  | { type: 'alert.acknowledged'; alertId: string; via: string };
