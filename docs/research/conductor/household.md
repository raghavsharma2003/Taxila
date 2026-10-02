# Household and siblings: several actors, one phone (gap-fill G3-household-siblings)

**Date:** 2026-10-02 · **Status:** design, ruled into `CONDUCTOR.md` as X59-X66 (revision 5). **Precedence:** as
for every conductor doc, `CONDUCTOR.md` overrides this file and `context/decisions.md` overrides both.
**Files:** `household.sql` (migration `005_household.sql`), `household.contracts.ts` (→ `shared/conductor/household.ts`;
`tsc --strict` clean), `household-sim.mjs` (reference `allocate()` + the conductor-sim persona; output
`household-sim-2026-10-02.txt`), `household-pg16-probe.py` (scratch PG 16.14; output
`household-pg16-probe-2026-10-02.txt`).
**Tags:** [V] read in the primary source this session · [S] secondary · [M] memory, check before it gates ·
[U] unmeasured design default · [I] inference · [sim] from `household-sim.mjs` (a model of a household, not a
household) · [probe] from the PG 16 probe · [repo] a fact in this repository.
**Method and limits.** The session's web-search budget was spent before this task began (200/200), so no new search
results are used. Evidence came from direct fetches of primary pages (CSF's BaSE 2025 article [V]; the ASER 2024
summary via Drishti IAS [S]; three other fetches were refused with 403 and are not cited as read) and from the
evidence the sibling docs already carry. Everything numeric about behaviour inside the design is [U] or [sim].

---

## 0. The decisions on one screen

The problem: CONDUCTOR §4.4 says "sittings are ordered younger-first, and the second child's plan shifts by the first
child's planned length", but the Conductor is a per-child actor whose `decide()` may read only its own state, its own
event, and recorded view keys (I-C6, I-R3). A rule that reads a sibling cannot be deterministic or replayable as
written. Notification caps, the anchor reminder, admission and erasure were all keyed per child and silently assumed
one child per phone.

| # | decision | why |
|---|---|---|
| H1 | **A household is a small second actor with one owner: the household allocator** (writer `household.alloc`). It owns `household_slot`, the only read model of "who has which phone, when". It is a pure function `allocate(AllocInput) → WindowOut[]` run in its own short transaction | one writer per fact (§1.1 rule 1); the per-child actor stays per child |
| H2 | **Sibling input reaches a child only as an event in that child's own log**: `household.window_assigned`, carried by a `wakeup` row (the *courier*) and ingested by `fire_wakeups` or the piggyback drain. `decide()` folds it into `state.household`; it never reads a household table | replay of a child holds by construction: the window is in `student_event` (I-H4) |
| H3 | **Children talk to the household only by inserting `household_inbox` rows** in their own commit (a command `household.report`). A brand-new row; its FK takes `KEY SHARE` on `household`, which never conflicts with the allocator's `NO KEY UPDATE` [probe F6] | the child commit's X29 order gains one new-row insert before `child_seq` and no wait |
| H4 | **Presence wins; order plans.** Younger-first (or a parent-fixed order) orders *planned* windows among the children available at each moment. A child who opens while the phone is free starts; her sitting becomes a fixed fact and the others' unshown windows move after it | the phone is in a hand, not in a schedule; a planner that makes a present child wait would be ignored or resented [I] |
| H5 | **No cascade.** A re-plan caused by `household.*` never reports its length back. Debounce 60 s per household, 5 min per child (existing), hysteresis 10 min. Result: one allocator pass per trigger, ≤ 1 delivery per member per pass [sim: 1,116 passes, max 1 and 1] | without the rule a trigger can run up to n − 1 extra passes (the order is a DAG, so it terminates, but plans churn) [sim fixture: 1 → 2 passes, 3 → 5 deliveries] |
| H6 | **The notification cap belongs to the recipient guardian**: `notify_slot` keyed `(guardian_id, scope, slot)`. Slot 1 is a single **family letter** envelope per week; slot 2 is one other learning push from any child; one wellbeing pointer a week. A guardian with 3 children gets at most 2 learning pushes a week, not 6 + 3 | the parent's attention is one budget [I]; the per-child cap was a 3× multiplier [sim C1: 6/week] |
| H7 | **The shared device is one lane**: one pending admission per device (`device_admission` PK), one realtime session per device, torn down before the next child's token; the anchor reminder is scheduled **per device**, never per child; budgets and caps stay per child | the device is shared; the money, the screen-time cap and the evidence are not |
| H8 | **`session.reassign` travels by courier, not by locking two `child_seq` rows.** It moves minutes to the real child, money only within that child's headroom (I-C7), and voids the profile owner's sitting so the allocator can give her a fresh window | a two-child ingest deadlocks against a courier batch in the opposite order [probe F8d control 5/5] |
| H9 | **Erasing a sibling re-allocates nothing.** Erasure gains a fence step (2b) that waits out an in-flight allocator and marks the member `leaving`; then the cascade. The siblings' windows, logs and plans do not move that day; caps keep content-free tombstones | the cascade otherwise deadlocks with an in-flight allocator [probe F8c control 5/5]; a re-allocation on erasure moved a sibling's window on 7/8 seeds [sim C4] |
| H10 | **No sibling data in a child's log, plan, brief or device docs** (I-H7). Window events carry the child's own lane and times and a cause *kind*; reassign events carry a `reassignId` | erasure would otherwise leave the erased child's id in the sibling's append-only log; and PP4 forbids comparison |

---

## 1. Evidence: Indian children mostly learn on a shared, often the mother's, phone

- **BaSE 2025** (Central Square Foundation; Aug 2025-Jan 2026; 15,000 respondents across 10 states, 12,500 households
  and 2,500 teachers in low-resourced settings): "90% of households own one or more smartphones"; "72% of children are
  accessing the smartphone in the household"; "Majority of this access is shared, with a higher likelihood of sharing
  with the mother as compared to the father"; "84% of them spend more than 30 minutes on the smartphone, in a typical
  day" [V, CSF article]. The split "68% shared, 4% dedicated" is carried by `design/parent-experience.md` from the
  report [S; the report PDF was not read here].
- **ASER 2024** (rural): about 90% of 14-16-year-olds have a smartphone at home, but only 27% (age 14) to 37.8%
  (age 16) own one; 57% of users used it for education in the reference week, 76% for social media [S, Drishti IAS
  summary; the same figures in `learning-science.md` §5.5]. For the 6-12-year-olds who are most of Taxila's bands,
  own-phone rates can only be lower [I].
- **So the common case is not one child and one phone.** It is one adult's phone, handed over after it comes home,
  to one child at a time, with siblings waiting (`day-cycle.md` AR-10.2, `kids-ux-ages.md` §8, `PRODUCT-DESIGN.md`
  §2.3 and §2.5.1 `/who` after every finish when ≥ 2 profiles exist [repo]). Families with 2-3 school-age children are
  common in exactly the states where tuition use is highest (Bihar, UP) [M: NFHS-5 TFR by state; not fetched].
- **The phone's arrival is the anchor**, not the child's routine: "sessions happen when the phone is handed over"
  (parent-experience §1.1 [S]); working-parent households get the phone at 19:00-19:30 (dc AR-10.1). The persona in §8
  uses a 19:00 Wednesday for exactly that.

What this forces: (a) one plan per *phone-evening*, not only per child; (b) parent-facing caps per parent, not per
child; (c) privacy between siblings on a device that cannot enforce it (ws §8.6: the picker has no PIN by default);
(d) wrong-profile sessions as a normal event, not an error (ws R7.5).

---

## 2. The model

### 2.1 Entities

```
 household (1 per owner guardian in v1) ── tz, anchor_school, anchor_off, phones (lanes), order_mode, version, lease
   ├─ household_member (child_id PK, ref ordinal, state active|leaving, fixed_pos, est_min)       cascades with child
   ├─ household_device (device_id PK → lane)                                                     cascades with device
   ├─ household_slot  (household, day, child, seq) ── lane, [starts_at, ends_at), state planned|frozen|done
   │     EXCLUDE (household =, day =, lane =, tstzrange &&) DEFERRABLE INITIALLY DEFERRED         ← I-H1 is a constraint
   ├─ household_inbox (new rows only, from child commits and the parent API)                     ← the household's mailbox
   └─ household_decision (+ household_decision_member, cascades with child)                      ← replay record
```

v1 equates a household with the owner guardian's account (`child.guardian_id` [repo `001_core.sql`]). Viewer guardians
(pl PA-20) belong to it. Two separate households for one child (separated parents) are out of v1; the reversal
condition is in §9.3.

### 2.2 Contracts

Full types in `household.contracts.ts`. The load-bearing ones:

```ts
// child → household: a Conductor command, written as a NEW household_inbox row in the child's own commit
export type HouseholdReport =
  | { type: 'household.plan_reported'; day; requestedMin; earliest; latestEnd; band;
      cause: 'first_open' | 'child_replan' | 'parent_change' | 'test_window' }        // never 'household' (I-H3)
  | { type: 'household.sitting_started'; day; slotId; lessonId?; lane; startedAt; plannedEnd }
  | { type: 'household.sitting_ended'; day; slotId; endedAt; endedBy; resumableUntil? }
  | { type: 'household.sitting_voided'; day; reassignId };
// parent API / workspace: household.routine_changed, household.member_joined. No member_left: erasure re-allocates nothing.

// household → child: the body of a student_event, delivered by a wakeup courier row
export interface HouseholdWindowAssigned {
  type: 'household.window_assigned'; day; hhVersion;      // monotonic; the fold ignores hhVersion <= state's
  lane; state: 'planned' | 'none'; from?; to?;            // 'none': no room before this child's latestEnd
  cause: 'morning' | 'sibling_plan' | 'sibling_started' | 'sibling_ended' | 'sibling_overrun' | 'sibling_voided' | 'routine_changed';
}                                                         // no sibling id, name, band, length or count (I-H7)
export interface SessionReassigned { type: 'session.reassigned'; reassignId; direction: 'out' | 'in'; scope;
  minutesMoved; voiceSecMoved; byGuardian }               // replaces session.reassign{toChild} in §2.2
```

### 2.3 Lock positions (the X29 writer table)

| writer | locks, in order |
|---|---|
| **household allocator** (new) | `household` (lease and CAS by `UPDATE`, i.e. `FOR NO KEY UPDATE`; never `SELECT … FOR UPDATE`) → `household_slot` (this household's rows, **active members only**) → `household_inbox` (delete consumed ids) → new rows only: `household_decision`, `household_decision_member`, `wakeup` courier rows. **Never `child_seq`, `conductor_state`, `notify_slot`, or another household** |
| Conductor commit (amended) | `conductor_state` → (`forge_request` → `forge_waiter`) → `job` → `wakeup` → `notification`/`notify_slot` (guardian-scoped keys; **slot 1 before slot 2**) → `household_inbox` (new row) → `child_seq` LAST |
| `session.reassign` (new shape) | `workspace` (lower child id, then higher) `FOR UPDATE` → moved ledger rows → `conductor_usage` (lower, higher) → `budget` (lower, higher) → `session_reassign` (new) → `wakeup` courier rows for both. Never `child_seq` |
| erasure (amended) | (1) `→ erasing`; (2) the child's lease; **(2b) household fence**: one short transaction `update household set version = version` + `update household_member set state = 'leaving'`; (3) cascade delete (retries on `40P01`) |
| `fire_wakeups` | unchanged (wakeup SKIP LOCKED → each child's `child_seq`); now also carries courier events. **It remains the only writer that locks more than one `child_seq`**, so no two multi-`child_seq` writers exist to form a cycle |

Probe results (scratch PG 16.14, n = 5 per race cell) [probe]: allocator vs a sibling's Conductor commit, each side
first, **0/10** deadlocks (F8a); allocator courier inserts vs a slow two-child `fire_wakeups` batch, **0/10** (F8b);
fenced erasure vs an allocator already touching the erased child, **0/5**, child erased every time (F8c); reassign via
courier vs a Director turn and a two-child fire batch, **0/15** (F8d); two sibling commits racing for slot 2, exactly
one wins, **0/5** (F7a); each taking 1 then 2, **0/5** (F7b). Controls: the unfenced erasure deadlocks **5/5**; a
reassign that ingests straight into A then B vs a batch firing B then A deadlocks **5/5**; a commit taking slot 2 then 1
against one taking 1 then 2 deadlocks **5/5**; an allocator using `SELECT … FOR UPDATE` blocks the child's inbox insert
for 1.74 s vs 0.05 s (F6).

---

## 3. Problem 1: a deterministic, replayable sibling order

### 3.1 The flow

```
 child A step()                     household allocator (worker; dirty set = inbox rows older than 60 s)      child B step()
 ──────────────                     ───────────────────────────────────────────────────────────────           ──────────────
 decide: first_open → planDay       lease household → read members (active), facts, slots, inbox ids ≤ N
 → cmd household.report             → allocate(input) (pure; one recorded now)
   {plan_reported, requestedMin}    → upsert household_slot rows (deferred EXCLUDE checks at COMMIT)
 commit: … notify_slot →            → delete inbox ≤ N → household_decision(+_member)
   INSERT household_inbox →         → for each changed, unstarted member: INSERT wakeup                        fire_wakeups / piggyback
   child_seq                           (child, 'hh:{day}:v{ver}', now(), 'household',                         → ingest
                                        'household.window_assigned', payload)                                 household.window_assigned
                                    COMMIT                                                                    → decide folds
                                                                                                                state.household;
                                                                                                                replan unshown
                                                                                                                slots (5-min
                                                                                                                debounce), NO report
```

Latency: inbox → pass ≤ 60 s (debounce) + the dirty-set poll (1-5 s, X35) + courier ≤ 15 s (ticker) or 0 s if the
sibling's own device asks first (piggyback drains that child's due wakeups before answering, §3.9). The first sibling
to open never waits on any of this: her plan is computed at open from her own state (§3.5).

### 3.2 `allocate()` (pure; reference implementation in `household-sim.mjs`)

Inputs (`AllocInput`): facts (anchor for the day kind, lanes, order mode), the recorded `now`, and per active member a
`MemberInput`: `earliest` (school end + recovery, or `allowedFrom` on an off day), `latestEnd` (`min(allowedTo,
bedtime − 60)`: no new teaching in the last hour, DC7), `requestedMin` (today's `plan_reported`, else `est_min`, else
the band template session), today's sitting facts, `doneForDay`, and `prev` (the window last delivered to that child).

1. **Facts first.** Every started sitting occupies `[startedAt, max(plannedEnd, now))` on its device's lane; every ended
   one `[startedAt, endedAt)`. These are `frozen`/`done` rows and never move.
2. **Plan the rest by list scheduling.** At each lane's cursor (starting at the anchor) pick, in order (younger-first by
   birth year, then `ref`; or `fixed_pos`), the first child whose `earliest ≤ cursor`; if none, jump the cursor to the
   smallest `earliest`. Place `[from, from + requestedMin)` at the first gap clear of every placed interval plus a
   5-min hand-over [U], clipped to that child's `latestEnd`. A window shorter than 3 min becomes `state: 'none'`.
3. **Hysteresis.** Keep `prev` if both ends moved < 10 min [U], it still fits `[earliest, latestEnd]`, and it overlaps
   nothing placed. So a 1-4 min drift never reaches a child.
4. Emit one `WindowOut` per row; `changed` marks the rows whose window differs from `prev`. Only changed, unstarted
   members get a courier row.

The order key uses only facts in the input, the loop has no clock or randomness, and the output is sorted by
`(ref, seq)`, so the function is byte-deterministic in its input: the nightly replay re-ran **1,106/1,106** recorded
passes byte-equal; a planted clock read breaks it (control C7) [sim].

### 3.3 How a sibling's re-plan or overrun moves the others

| trigger (inbox kind) | what the pass does | who gets an event |
|---|---|---|
| `plan_reported` (first open, a child's own re-plan, a parent change, a test window) with \|Δ\| ≥ 5 min from the last report | re-places every unstarted member after the reporter's new length | each later member whose window moved ≥ 10 min, or now overlaps |
| `sitting_started` (presence wins: a child started out of order or early) | the sitting becomes a fixed occupant; unstarted members re-flow around it | those it displaced |
| `sitting_ended` later than planned (an overrun: a natural-stop wrap, the parent's "+10" behind the PIN) | the fixed interval grows to the true end | the next member(s) if the overlap or drift ≥ 10 min |
| `sitting_ended` early (`child_left`, `idle`, `safety`) | nothing is pulled earlier unless the drift ≥ 10 min; the next present child may simply start (presence wins) | usually nobody |
| `sitting_voided` (a wrong-profile session was reassigned) | the profile owner has no sitting again: she gets a fresh window if one fits before her `latestEnd` | her |
| `routine_changed` (anchor, lanes, order) | full re-flow | everyone whose window moved |

**Only unshown slots move.** A child's `day_plan` slot with `slot.shown`/`slot.started` stays frozen in content (V10).
The household window is a timing fact the child never sees (no times, no sibling names and no countdown on the child
surface, dc AR-10.7), so moving a *shown* slot's window changes no child-visible content. Its length is then governed by
the existing late-start collapse at lesson start (time left before bedtime − 60, §4.4).

**Debounce.** Inbox rows coalesce for 60 s per household [U] (the dirty-set read waits until the oldest unconsumed
row is 60 s old). The per-child 5-min re-plan debounce (§3.7) still applies on the receiving side, so a burst of
passes produces one re-plan. Monotonic `hhVersion` makes an older courier a no-op.

**No-cascade rule (I-H3).** A re-plan whose cause is `household` emits no `household.plan_reported`. The household
keeps using the length the child reported for her own reasons; the child fits her plan inside the window she was given
and may end up shorter. Why this is enough: windows depend only on members *earlier* in the order plus fixed facts, so
the dependency graph is a DAG. Without the rule a trigger can still propagate down the order, one extra pass per
member that re-plans to a different length (bounded by n − 1). The fixture in `household-sim.mjs` (anchor 19:20 →
20:00, the middle child R2-latched so a ≥ 20:00 start snaps her to the minimum segment set) shows 1 pass / 3 deliveries
with the rule and 2 passes / 5 deliveries without it. Over the persona's 4 weeks × 8 seeds: 1,116 passes, max passes
per trigger **1**, max deliveries per member per pass **1** [sim].

### 3.4 The child's side

- **Fold** (`decide`, `household.window_assigned`): if `body.hhVersion > state.household?.hhVersion` (or the day
  changed), replace `state.household`. If a plan exists with unshown slots, set `pending.replanAfter = now + 5 min`
  with cause `household`. Otherwise do nothing. Never a parent line, never a child-visible change.
- **`PlannerInputs.household`** = `{lane, state, from, to}`, floored to 5 min, inside `inputsHash` (X43). `planDay`
  treats a planned window that starts in the future as the sitting's window: effective start = `from`, and the sitting
  length is ≤ `to − from` and ≤ `latestEnd − from`. It never *raises* a length (V26 holds). A window already in the past,
  or `state: 'none'`, falls back to the child's own routine window: the child is present and the phone is free.
  Registered as a `limits`-layer constraint through `registerConstraint` (X44), so the `GUARDS` remain a no-op on
  planner output (I-A10).
- **Reports** (`household.report` command): on first open; on its own re-plan when the length moved ≥ 5 min and the
  cause is not `household`; on `lesson.started` / first `slot.started` (`sitting_started`); on `lesson.ended`
  (`sitting_ended`, with `resumableUntil` for `network` and `profile_switch`); on a reassign out (`sitting_voided`).
- **Validator additions:** **V28** rejects a plan whose sitting slot lies outside a planned future household window;
  **V29** rejects a `household`-caused re-plan that raises `plannedMin` or carries a `plan_reported` command (I-H3);
  **V30** rejects any plan, brief or device doc field carrying a sibling id, name, length or count (I-H7).

### 3.5 Replay

- **The child.** `decide` reads the window from the event, so replay needs nothing new. `decision_log.household_v`
  records `state.household.hhVersion` after each batch; I-H4 asserts that a replay reproduces it on every row, and the
  replay reader has no household handle at all (any access throws, the household analogue of `ReplayMiss`).
- **The household.** `household_decision(version, now_used, build_sha, facts, output)` +
  `household_decision_member(version, child_id, ref, input)`. Replay = `allocate(rebuild(facts, members, now_used))`,
  compared byte-for-byte with `output`. Member inputs cascade with the child (§6), so a pass recorded before a
  sibling's erasure is no longer replayable afterwards; replay marks it `member_erased` and does not fail. In the
  persona that is 1,048 of 1,116 passes after day 25, all of which had already passed their nightly replay [sim]. Like
  `decision_log`, retention is the replay window (90 d [U]).

---

## 4. Problem 2: one parent, several children, one attention budget

### 4.1 The arithmetic

Under CONDUCTOR §4.10.3, `notify_slot` is keyed `(guardian_id, child_id, scope, slot)`, so a guardian with three
children may receive 3 weekly letters + 3 milestone/test pushes (6 learning) + 3 wellbeing pointers a week. The
persona's control arm reaches **6** learning pushes in a guardian-week and 2 wellbeing pointers [sim C1]. That is a
nagging channel built out of a no-nagging policy (§0.1 line 8).

### 4.2 Ruling: the recipient guardian owns the cap; one family letter

- **Slot scope per recipient guardian**, ISO week in the guardian's tz: `learn:{isoWeek}` slots 1-2, `wb:{isoWeek}`
  slot 1. Slot 1 holds **only** the family letter (a `check` constraint); every other learning class (`milestone`,
  `test_window`) competes for slot 2, first come. A blocked push sets `status = 'blocked', block_reason = 'cap'`, and
  the fact rides in the family letter. A second wellbeing statement in the week appends to the in-app note under the
  same pointer (coalesced). Safety, account and payment are unchanged (uncapped, protocol-gated).
- **The family letter** is one `notification` row per recipient guardian per week (`child_id` null, `household_id`
  set, dedupe `letter:{isoWeek}`). Each child's `parent.letter:{child}:{isoWeek}` job still writes that child's own
  `weekly_letter` (WeekStory, claim-checker, lints: unchanged, per child). The first child's `job.done` inserts the
  envelope; a sibling's identical `notify` hits `unique (guardian_id, dedupe)` and merges. Siblings' letter wakeups move to
  `sendAt − 2 h` [U] so every letter has rendered; the envelope's `notBefore = sendAt` (the guardian's day, which is
  already `hash(guardianId) mod 7`, pl PA-9). The **send-time gate** fills `letters[]` from the `weekly_letter` rows
  that still resolve (an erased child's drops out, §6) and re-checks safety hold, consent and STOP per child: a child in
  `safety_hold` is omitted from the envelope with no wording that reveals it.
- **Envelope copy** (WhatsApp utility template: image header + ≤ 5 lines + one CTA to `/p/letters/{isoWeek}`): the
  children's first names and "this week's letters are ready", nothing else. **Lint I-H11:** no string in the envelope,
  card or app list may carry a number or a comparative about more than one child (PP4: no sibling comparison). The
  per-child letters open separately and are never laid out side by side.
- **Home loop:** at most one home activity per child per week stays, but the parent's declared capacity dial
  (pl PA-15) is per guardian. The weekly intent picks across children round-robin up to that dial [U].
- **Routine card (answers adaptation-policy open question 3):** where ≥ 2 members share a lane, R14's "sittings keep
  getting cut" card is one **household** card (14-day cooldown per household) whose evidence is the household's late
  starts. Its action is "earlier anchor / change the order / second phone", never a per-child judgment. R2's late arm
  stays per child (a child second in line *is* starting late, and the minimum segment set is right for her).

### 4.3 SQL (`household.sql`)

```sql
create table notify_slot (                           -- replaces CONDUCTOR §4.10.3
  guardian_id uuid not null references guardian(id) on delete cascade,              -- the RECIPIENT
  scope text not null,                               -- 'learn:2026-W40' | 'wb:2026-W40'
  slot smallint not null, cls text not null,
  child_id uuid references child(id) on delete set null,                            -- attribution only
  notification_id bigint references notification(id) on delete set null,            -- tombstone: the cap counts sends
  taken_at timestamptz not null default now(),
  primary key (guardian_id, scope, slot),
  check ((scope like 'learn:%' and slot between 1 and 2) or (scope like 'wb:%' and slot = 1)),
  check (slot <> 1 or scope not like 'learn:%' or cls = 'weekly_letter'),
  check (slot <> 2 or cls in ('milestone','test_window')));
create or replace function notify_take(p_guardian uuid, p_scope text, p_cls text, p_child uuid, p_notification bigint)
returns smallint language sql as $$
  insert into notify_slot (guardian_id, scope, slot, cls, child_id, notification_id)
  values (p_guardian, p_scope, 1 + (p_scope like 'learn:%' and p_cls <> 'weekly_letter')::int, p_cls, p_child, p_notification)
  on conflict do nothing returning slot;             -- null → blocked 'cap'
$$;
```

Probe [F2-F3, F7]: the letter takes slot 1 once; one milestone takes slot 2; a second child's milestone and the third
child's test window block; one wellbeing pointer, the second coalesces; a viewer guardian has her own recipient cap;
slot 1 refuses a milestone. Erasing the child who took slot 2 leaves `2:null:null` and the sibling stays capped; with
`ON DELETE CASCADE` the slot is freed and a third push goes out (control). Two siblings' commits racing for slot 2:
exactly one wins, 0/5 deadlocks. Lock rule: a commit that takes two learning slots takes **1 before 2** (the reverse
order deadlocks 5/5).

---

## 5. Problem 3: the shared device

### 5.1 Profile switch mid-sitting

Today's rule (one realtime session per child, torn down on every profile switch, ws §5.5; G-LE-5 in PRODUCT-DESIGN
§2.5.1) is kept and ordered (`ProfileSwitch.steps` in the contracts, tested as I-H8):

1. end the session: close WebRTC and the relay socket; `POST /api/lesson/end {reason: 'profile_switch'}`;
2. flush the evidence queue under the *old* child's token; drop that token;
3. `/who` → pick → mint the new child's token → that child's admission.

`EndedBy` gains `profile_switch`. It is **resumable for 15 min** like `network` (the older child was interrupted, not
done): the resume keeps the lessonId, brief and reservation and counts only voice actually used (§4.6). The household
gets `sitting_ended{endedBy:'profile_switch', resumableUntil}`; the allocator treats the interval as done and the
grabber's sitting as a new fixed occupant. If the phone comes back inside 15 min, the older child resumes (presence
wins); otherwise her day ends with the minutes she used. The sim had 7 switches and 2 resumes, with **0** device
overlaps [sim].

### 5.2 One pending admission per device, two budgets

`device_admission(device_id PK, child_id, lesson_id, priority, since)`. A tap upserts it: the same child double-tapping
reuses the wait (no row returned); a different child **replaces** it (the old child's wait is cancelled because her
client has already torn down); never two rows per device [probe F10]. A waiting admission takes no rate-bucket token;
a granted one consumes it, and it is not refunded on a later switch (the RPM bucket counts session starts, which really
happened).

Budgets stay per child: the usage reserve (`conductor_usage`), the voice budget and the cap are reserved against **the
profile in use**, minted with that child's id at tile `pointerdown`. So a sibling's session can never spend another
child's minutes except through a wrong-profile tap, which §5.4 repairs. Household-level spending is a parent-dashboard
sum, never a pooled budget.

### 5.3 The anchor reminder per household device

The local anchor reminder (X12) is scheduled **per device from the household anchor**, never per child: ≤ 1 a day,
≤ 5 a week (school days), self-pausing after 3 ignored, where *ignored* means no `app.opened` by **any** household
profile on that device within the window. That counter is device-local and pre-profile, so it never enters a child's log
(orch R7.8). Copy is household-neutral ("Taxila ka time"): no name, order, count or performance on the lock screen
(§4.10.1). It re-syncs from a sixth device doc, `household` (anchor, lanes, today's windows as times only), fetched
with the device credential rather than a child token. A B4 on her own phone keeps only the reminders she set herself
(§4.10.1). [sim: max 1/day and 5/week per device; scheduling per child gives 3/day (C6).]

### 5.4 `session.reassign` and the household plan

The wrong-profile case (ws R7.5): child Y used child X's profile. The parent (same household only) reassigns it.

- **One transaction, courier delivery:** lock `workspace` X and Y in id order (the KT lock, §5.6); move the
  session's evidence, turns, notebook pages and `turn_trace` to Y; move `conductor_usage.used_min` X → Y; move budget
  `spent` X → Y **only up to Y's headroom** (`spent + reserved ≤ limit`, I-C7), with any excess staying booked to X and
  recorded in `session_reassign.micro_usd_kept`; insert `session_reassign`; insert two courier rows
  (`session.reassigned`, `out` for X, `in` for Y). It never ingests into two `child_seq` rows (H8).
- **Minutes:** Y's `used_min` may now exceed Y's cap. That is a fact (Y really used the screen), not a governor
  breach: admission refuses Y's next start (I-C3 is about starts and block reserves). X gets her minutes back for the
  day. The sim saw 12 reassigns, with 12.4 min landing over the target's cap in one seed [sim].
- **Household:** X's sitting is voided (`sitting_voided`), so the allocator gives X a fresh window if one fits before
  her `latestEnd`. Y's occupancy fact moves to Y. Lane occupancy is unchanged, so no overlap can appear.
- **Child surfaces:** I18 holds: nothing X or Y saw is taken back, and the next plans absorb it.

### 5.5 `safety_hold` on a shared phone

A hold is per child (X33). The sibling's profile keeps working. On a hold the child's sitting ends with
`endedBy: 'safety'`, and the household sees an ordinary `sitting_ended`. The siblings' courier cause is the generic
`sibling_ended`, never the reason (I-H7), and the parent-facing household view shows the held child as "not today" with
no cause. The hold screen itself reveals nothing on a shared phone (§3.2).

---

## 6. Problem 4: erasing one sibling

**Order** (amends §5.7): revoke that child's device docs → (1) workspace `→ erasing` (fences jobs through
`complete_job`) → (2) take the child's lease → **(2b) household fence**: `update household set version = version`
(waits for any in-flight allocator) + `update household_member set state = 'leaving'`, one short transaction; later
passes read only `active` members, so they never touch the leaving child's rows or insert a courier for her → (3)
cascade delete → Blob prefixes → sweepers → receipt.

**What must not move:**

| object | effect of erasing child A |
|---|---|
| `household`, members B/C, their `household_slot` rows, `household_decision` | unchanged (byte-identical md5 in probe F4) |
| B's and C's `student_event`, `day_plan`, `state.household` | no new event and no re-plan that day. The allocator is **not** run on leave (no `member_left` report exists). The next morning's pass simply has two members |
| A's `household_slot`, `household_member`, `household_inbox`, `household_decision_member`, `wakeup`, `device_admission` | cascade to 0 rows |
| `notify_slot` rows A took | stay as content-free tombstones (`child_id`, `notification_id` set null): the week's cap is unchanged |
| the family letter that week | the send-time gate omits A's letter; the envelope lists the remaining children |
| `session_reassign` rows naming A | `from_child`/`to_child` set null; B's `session.reassigned` event carries only the `reassignId` |
| anything in B's or C's log carrying A's id | none can exist (I-H7, V30, the W-map lint on event schemas) |

[probe F4: 0 rows carry A's id afterwards; the household and siblings' rows md5-identical. Fenced erasure vs an
in-flight allocator 0/5 deadlocks; unfenced 5/5. sim: 0 sibling windows disturbed and 0 events to siblings on 8/8 seeds;
the "re-allocate on leave" control disturbed 7/8.]

---

## 7. Invariants (registry rows for CONDUCTOR §9.9; each with a negative control)

| id | predicate | negative control | measured here |
|---|---|---|---|
| I-H1 | no two `household_slot` rows overlap in (household, day, lane): the exclusion constraint, checked at COMMIT; no two sittings overlap on one device | an overlapping insert raises 23P01; the same re-timing pass with the constraint `IMMEDIATE` fails mid-pass; per-child planning without household windows overlaps | probe F1a-d; sim 0 planned and 0 device overlaps, control C2 512 |
| I-H2 | per recipient guardian and ISO week: ≤ 2 learning pushes (slot 1 the family letter, slot 2 one other), ≤ 1 wellbeing pointer, **independent of the number of children**; erasure never frees a taken slot | `notify_slot` keyed per (guardian, child) → 6; `child_id ON DELETE CASCADE` → 3 after an erasure | probe F2, F3; sim max 2 and 1; C1 6, C5 3 |
| I-H3 | a `household`-caused re-plan emits no `plan_reported`; ≤ 1 courier per member per pass; ≤ 1 pass per trigger | a re-plan that re-reports its length | sim max 1 and 1; fixture 1 → 2 passes |
| I-H4 | `decide` never reads a household table (the replay reader has no handle); replayed `state.household.hhVersion` = `decision_log.household_v` on every row; `allocate(recorded input)` is byte-equal to `household_decision.output` (except `member_erased`) | a decide that reads `household_slot` throws in the shim; a clock read planted in `allocate` | sim 1,106/1,106 byte-equal; C7 trips |
| I-H5 | lock order: the allocator never locks `child_seq`/`conductor_state`/`notify_slot`; `fire_wakeups` is the only writer locking > 1 `child_seq`; learning slots are taken 1 before 2; 0 deadlocks in the cells | reassign ingesting into two children vs a reverse batch; slot 2-then-1; allocator `FOR UPDATE` | probe F7-F8: 0 in all design cells; controls 5/5, 5/5 and a 1.74 s block |
| I-H6 | erasing a sibling changes no other member's slot, window, plan or log that day, and leaves 0 rows carrying the erased id | erasure that re-allocates; erasure without the fence (deadlock) | probe F4, F8c; sim 0; C4 7/8 seeds disturbed |
| I-H7 | no child's event, plan, brief or device doc carries a sibling's id, name, band, length or count; window causes are kinds | a schema with `siblingId`, or a cause `safety_of_sibling`, fails the W-map lint | lint (G2) |
| I-H8 | ≤ 1 pending admission per device; a profile switch closes the old session and drops its token before the new child's token is minted; every reservation is against the profile in use | two taps by two profiles leave two rows; a token minted before teardown | probe F10; client test |
| I-H9 | anchor reminders per device ≤ 1/day and ≤ 5/week whatever the number of children; ignored is device-level | reminders scheduled per child | sim max 1 and 5; C6 3/day |
| I-H10 | reassign: minutes move in full; money moves only within the target's headroom (I-C7 holds); the owner's sitting is voided; lane occupancy unchanged | moving money past headroom trips I-C7 | sim 12 reassigns, 0 overlaps |
| I-H11 | no family-letter string carries a number or comparative about more than one child | "Riya 5 din, Kabir 2 din" must fail the lint | lint (G2) |
| I-H12 | every household member's routine tz equals `household.tz`; one learning day per household | a member in another tz is refused at join | unit |

---

## 8. conductor-sim persona `three_siblings_one_phone`

**Persona** (`household-sim.mjs`, 8 seeds × 28 days): Riya B1 (6 y, Class 1; school to 13:30; bedtime 20:30, latest
start 19:30); Kabir B2 (8 y; tuition Tue/Thu to 18:00, so earliest 18:15 on those days; bedtime 21:00); Meera B4
(13 y; bedtime 22:00; a test window on days 7-11 asks for her 52-minute maximum). One phone. Anchor 16:30, moved to
17:00 by the parent on day 14; **19:00 on Wednesdays** (the phone comes home late); 11:00 on weekends. Each child skips
10% of school days and 35% of off days; 12% "jump the queue" by opening up to 25 min before the anchor; 30% of
sittings overrun by up to 8 min, 15% end early; 8% are interrupted by a younger sibling's profile switch (15-min
resume); 4% are wrong-profile sessions, reassigned 5-120 min later; 5% of cap hits get the parent's "+10". Milestones,
a test-window push, wellbeing statements and the weekly letter go through the per-guardian slots, with forced
milestones on day 21 (Kabir) and day 26 (Meera) around **Kabir's erasure on day 25 at 17:10**.

**Tables** (`household-sim-2026-10-02.txt`; totals over the 8 seeds):

| sittings | resumes | switches | reassigns | waits for the phone | squeezed out | passes | deliveries | reports |
|---|---|---|---|---|---|---|---|---|
| 509 | 2 | 7 | 12 | 78 | 2 | 1,116 | 558 | 1,569 |

| gate | result |
|---|---|
| I-H1 planned `household_slot` overlap / device overlap | **0 / 0** |
| I-C3 governor cap breach (each child against her own cap) / DC7 sitting past bedtime − 30 | **0 / 0** |
| I-H2 max learning pushes per guardian-week / wellbeing pointers | **2 / 1** |
| I-H9 anchor reminders per device | **1 / day, 5 / week** |
| I-H3 max deliveries per member per pass / max passes per trigger | **1 / 1** |
| I-H6 sibling windows disturbed by the erasure / events to siblings | **0 / 0** |
| I-H4 nightly allocator replay | **1,106 / 1,106 byte-equal** (1,048 earlier passes unreplayable after the erasure, as designed) |

| negative control | result |
|---|---|
| C1 `notify_slot` per (guardian, child) | **6** learning pushes in one guardian-week (2 wellbeing) |
| C2 per-child planning from each child's own routine | **512** planned overlaps |
| C3 household re-plan re-reports (fixture) | passes 1 → **2**, deliveries 3 → 5 |
| C4 erasure re-allocates the remaining members | **7/8** seeds disturbed, 8 events to siblings |
| C5 `notify_slot.child_id ON DELETE CASCADE` | **3** learning pushes in the erasure week |
| C6 anchor reminder per child | **3** per device-day |
| C7 a clock read planted in `allocate()` | replay no longer byte-equal |

**What the sim does not show.** It is a model: arrival times, skips and overruns are invented, so its counts of
passes and waits are not predictions. It shows that the rules hold under churn and that each control trips. It does not
model two phones, `parent_fixed` order, homework-first slots, or the realtime bucket. Two phones are covered by the
exclusion constraint per lane (probe F1c).

---

## 9. Measurements, owner decisions, open questions

### 9.1 Measure before relying on it (log in `context/measurements.md` with n, method, date)

| id | measure | decides |
|---|---|---|
| HH-M1 | share of households with ≥ 2 active child profiles; phones per household (`household_device` lanes in use) | whether the allocator is a v1 core path or an edge case; the `phones` default |
| HH-M2 | real hand-over gaps and order compliance (who actually starts first, by band) from `household_inbox` facts | the 5-min hand-over [U]; younger-first vs parent-fixed default |
| HH-M3 | windows delivered per child-day and the share that moved a shown slot's window | the 10-min hysteresis [U]; the 60 s debounce [U] |
| HH-M4 | wrong-profile sessions per 100 sittings on shared phones (reassigns + "I didn't do that" in kids-ux S1) | whether a picture-PIN default is needed for B1-B2 |
| HH-M5 | family-letter open rate vs single-child households' letter open rate | the merged envelope vs separate letters (reversal of H6's envelope half) |
| HH-M6 | profile-switch resume rate and duplicated warm-up minutes | the 15-min `profile_switch` resume window |

### 9.2 Owner decisions

None block M0, because single-child families exercise the same code with one member. Before M1 (> 30 families),
the owner confirms: (a) per-guardian caps over per-child caps (H6); (b) younger-first as the default order with a
parent override; (c) the household-neutral reminder copy.

### 9.3 Reversal conditions

- **H1/H2 (household actor, courier):** reverse to an in-commit allocation only if HH-M3 shows the 60 s + courier lag
  makes > 5% of second sittings start on a stale window *and* a lock-order probe of the in-commit variant shows 0
  deadlocks against `fire_wakeups`.
- **H6 (per-guardian cap):** reverse to per (guardian, child) only if parents of ≥ 2 children ask for more messages
  in the M1 interviews *and* the opt-out/block rate does not rise in an A/B; the family envelope reverses on HH-M5.
- **H9 (no re-allocation on erasure):** keep it unless parents report the gap left by an erased sibling as a problem;
  the next morning's pass already closes it.
- **One household per owner guardian:** add a `household_child` many-to-many only when separated or joint-custody
  families appear (support tickets or onboarding answers). The courier design does not change.

### 9.4 Open questions

1. Should a B4 with her own phone leave the household lane entirely? (v1: her device is lane 1 if paired to the same
   household. The planner then never queues her behind siblings.)
2. Weekend sittings may be two per child (morning and evening). The allocator handles it as two windows only if the
   planner emits two sitting slots. v1 stays one sitting per day (§4.3).
3. Does the household view on the parent's dashboard ("aaj: Riya 16:30, Kabir 17:00, Meera 17:40") invite
   comparison? It shows times only, never minutes done; PX review needed.

---

## 10. Rulings for CONDUCTOR.md (applied there as X59-X66, marked "(gap-fill G3-household-siblings)")

| # | ruling |
|---|---|
| X59 | household allocator as the single owner of `household_slot`; children → `household_inbox` new rows; household → child only by courier `wakeup` rows; `decide` never reads household tables |
| X60 | presence wins, order plans; younger-first default; 60 s debounce, 10-min hysteresis; the no-cascade rule |
| X61 | `notify_slot` keyed by recipient guardian; slot 1 = the family letter; tombstones on erasure |
| X62 | one family letter envelope per guardian-week, per-child letters inside; lint I-H11 |
| X63 | shared device: `device_admission` per device; `profile_switch` ending resumable 15 min; budgets per profile in use; the anchor reminder per device |
| X64 | `session.reassign` by courier: money within headroom, minutes in full, sitting voided |
| X65 | erasure fence (2b); no re-allocation on leave; content-free tombstones |
| X66 | no sibling data in a child's log, plan, brief or device docs; `session.reassign{toChild}` becomes `session.reassigned{reassignId}` |

---

## Sources

- Central Square Foundation, *Beyond Access: The Next Phase of EdTech and AI in Bharat* (BaSE 2025 findings; fetched
  2026-10-02) [V] — https://www.centralsquarefoundation.org/articles/beyond-access-the-next-phase-of-edtech-and-ai-in-bharat
- BaSE 2025 landing page (sample: 15,000 respondents, 12,500 households, 2,500 teachers; fetched 2026-10-02) [V] —
  https://www.edtechbase.centralsquarefoundation.org/base-2025
- ASER 2024 summary (smartphone access and ownership, 14-16-year-olds; fetched 2026-10-02) [S] —
  https://www.drishtiias.com/daily-updates/daily-news-analysis/aser-2024-and-elementary-education ; the same figures
  in `docs/research/learning-science.md` §5.5 [repo]
- Not readable this session (403/size): the PIB ASER 2024 release, the Business Standard BaSE article, the ASER 2024
  final-report PDF, GSMA's gender-gap page, the PIB NFHS-5 release. None of them is cited as read.
- PostgreSQL 16: explicit locking (row-level lock conflict table: `FOR KEY SHARE` conflicts only with `FOR UPDATE`;
  `UPDATE` without key changes takes `FOR NO KEY UPDATE`), exclusion constraints (`DEFERRABLE`), `btree_gist` [M; each
  behaviour then measured on 16.14 in the probe] — https://www.postgresql.org/docs/16/explicit-locking.html ,
  https://www.postgresql.org/docs/16/sql-createtable.html , https://www.postgresql.org/docs/16/btree-gist.html
- Internal [repo]: `CONDUCTOR.md` §2-§10; `day-cycle.md` AR-10.2; `student-workspace.md` R7.5, §8.6;
  `orchestration-architecture.md` R7.8; `adaptation-policy.md` open question 3; `parent-loop.md` PP4, PA-9, PA-15;
  `design/parent-experience.md` §0-§1.1; `design/kids-ux-ages.md` §8; `design/PRODUCT-DESIGN.md` §2.3, §2.5.1;
  `db/migrations/001_core.sql`; `student-workspace.sql` (`device`, `device_child`).
