// adaptation-worked-example.mjs — runs adaptation-policy.md §5.4 against the REAL resolveKnob in
// adaptation.contracts.ts (gap-fill G1-adaptation-policy, 2026-10-02). Node >= 22.18 strips the TS types natively.
// Run: node docs/research/conductor/adaptation-worked-example.mjs   (exits 1 on any failed expectation)
//
// Child: B1 (age 6, Class 1). Unit test (Maths ch. 4-5) on day 3 of its 5-day window. Last four closes: strained,
// strained, fine, tired → R1 latched ON at last night's fold. Realtime budget: 600 s left, 8 expected active days.
// R0 = the band template and the §4.4 priority stack (always present, KT tier). Yesterday the child picked "shapes" (ch. 6) as the next topic (child.choice_made, context next_topic).
import { resolveKnob, MAY_PROPOSE } from './adaptation.contracts.ts';

const LANES = ['realtime', 'realtime_mini', 'cascade', 'tap'];         // preference order; `tap` is the zero-cost floor
let failures = 0;
const expect = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(got)}${ok ? '' : `  (want ${JSON.stringify(want)})`}`);
};
const show = (knob, r) => console.log(`     ${knob}: value=${JSON.stringify(r.value)} owner=${r.owner?.rule ?? '-'}/${r.owner?.layer ?? '-'} ` +
  `domain=${JSON.stringify(r.domain.kind === 'range' ? [r.domain.lo, r.domain.hi] : r.domain.values)} ` +
  `blocked=${JSON.stringify(r.blocked.map((b) => [b.dropped.rule ?? b.dropped.layer, b.reason]))}`);

// ── budget arithmetic (R10): today's realtime allowance = floor(leftSec / max(1, activeDaysLeftEst)) ──────────────
const leftSec = 600, activeDaysLeft = 8, allowance = Math.floor(leftSec / Math.max(1, activeDaysLeft));   // 75 s
const teachSec = 5 * 60;                                              // B1 teach segment wants 5 min of realtime
expect('R10 realtime allowance today (s)', allowance, 75);

// 1. segmentMinutes (lesson session length; KT sets the floor of obligations, vibe picks inside)
{
  const r = resolveKnob('segmentMinutes', { kind: 'range', lo: 10, hi: 20 },
    [{ knob: 'segmentMinutes', layer: 'limits', domain: { kind: 'range', lo: 0, hi: 21 }, reason: 'cap 30 × 0.7 aim, no homework sheet' }],
    [{ knob: 'segmentMinutes', layer: 'kt', rule: 'R0', value: 20, slack: { kind: 'range', lo: 12, hi: 20 },
       evidence: ['need.gapGrades', 'kt.due'] },
     { knob: 'segmentMinutes', layer: 'vibe', rule: 'R1', value: 14, evidence: ['state.adapt.shortSeg'] }]);
  show('segmentMinutes', r); expect('segmentMinutes', r.value, 14);
}
// 2. laneMix for the teach segment (policy: mini is never the primary teacher; budget: allowance < teach seconds)
{
  const budgetDomain = allowance >= teachSec ? LANES : ['cascade', 'tap'];
  const r = resolveKnob('laneMix', { kind: 'set', values: LANES },
    [{ knob: 'laneMix', layer: 'limits', domain: { kind: 'set', values: ['realtime', 'cascade', 'tap'] }, reason: 'policy: mini drills only' },
     { knob: 'laneMix', layer: 'budget', domain: { kind: 'set', values: budgetDomain }, reason: `R10 allowance ${allowance}s < ${teachSec}s` }],
    [{ knob: 'laneMix', layer: 'kt', rule: 'R0', value: 'realtime', evidence: [] }]);
  show('laneMix(teach)', r); expect('laneMix(teach)', r.value, 'cascade');
  expect('laneMix blocked reason', r.blocked.map((b) => b.reason), ['projected_into_domain']);
}
// 3. topic: the test window (KT tier, no slack) beats yesterday's child choice (interest tier) → choiceAck
{
  const r = resolveKnob('topic', { kind: 'set', values: ['m1.ch4', 'm1.ch5', 'm1.ch6'] }, [],
    [{ knob: 'topic', layer: 'kt', rule: 'R0', value: 'm1.ch4', evidence: ['state.school.testWindows', 'kt.skill'] },
     { knob: 'topic', layer: 'interest', rule: 'R11', value: 'm1.ch6', evidence: ['state.adapt.choice'] }]);
  show('topic', r); expect('topic', r.value, 'm1.ch4');
  expect('child choice blocked', r.blocked.map((b) => [b.dropped.rule, b.reason]), [['R11', 'outside_owner_slack']]);
}
// 4. pace: B1 bound (limits) ∩ R6 not firing (kt.eta nOpps 12 < 30 → fallback) → band default 1
{
  const r = resolveKnob('pace', { kind: 'range', lo: 0, hi: 2 },
    [{ knob: 'pace', layer: 'limits', domain: { kind: 'range', lo: 0, hi: 1 }, reason: 'B1 newSkillBudget <= 1' }],
    [{ knob: 'pace', layer: 'kt', rule: 'R0', value: 1, evidence: ['state.school.testWindows'] }]);
  show('pace', r); expect('pace', r.value, 1);
}
// 5. successFirst: vibe (R1 latch) proposes on; KT has no opinion (gap 1 day < 7) → on
{
  const r = resolveKnob('successFirst', { kind: 'set', values: ['off', 'on'] }, [],
    [{ knob: 'successFirst', layer: 'vibe', rule: 'R1', value: 'on', evidence: ['state.adapt.shortSeg'] }]);
  show('successFirst', r); expect('successFirst', r.value, 'on');
}
// 6. foundationShare (R9): gap −1 grade → 0.2 + 0.15 = 0.35, × 0.5 in a test window = 0.175
{
  const share = Math.min(0.6, 0.2 + 0.15 * 1) * 0.5;
  const r = resolveKnob('foundationShare', { kind: 'range', lo: 0, hi: 0.6 }, [],
    [{ knob: 'foundationShare', layer: 'kt', rule: 'R9', value: share, evidence: ['need.gapGrades', 'state.school.testWindows'] }]);
  show('foundationShare', r); expect('foundationShare', r.value, 0.175);
}

// ── negative controls (each MUST be blocked; these are the I-A1 / I-A2 fixtures) ─────────────────────────────────
console.log('negative controls');
{ // vibe may not lower the review floor (LS-18): layer_not_permitted
  const r = resolveKnob('reviewShare', { kind: 'range', lo: 0.15, hi: 0.25 }, [],
    [{ knob: 'reviewShare', layer: 'kt', rule: 'R3', value: 0.25, evidence: ['kt.due'] },
     { knob: 'reviewShare', layer: 'vibe', rule: 'R1', value: 0.15, evidence: ['state.adapt.shortSeg'] }]);
  expect('I-A1 vibe → reviewShare blocked', r.blocked.map((b) => b.reason), ['layer_not_permitted']);
  expect('I-A1 reviewShare unchanged', r.value, 0.25);
}
{ // an empty budget domain would be DROPPED by resolveKnob (empties_domain) and realtime would leak through.
  // That is why I-A2 refuses such a constraint at registration: budget constraints apply to laneMix only and must
  // contain the floor lane 'tap'. This fixture shows the failure the registration check exists to prevent.
  const r = resolveKnob('laneMix', { kind: 'set', values: LANES },
    [{ knob: 'laneMix', layer: 'budget', domain: { kind: 'set', values: [] }, reason: 'malformed' }],
    [{ knob: 'laneMix', layer: 'kt', rule: 'R0', value: 'realtime', evidence: [] }]);
  expect('I-A2 unguarded empty budget leaks realtime (why registration must refuse it)', r.value, 'realtime');
  const registrationOk = (c) => c.layer !== 'budget' || (c.knob === 'laneMix' && c.domain.kind === 'set' && c.domain.values.includes('tap'));
  expect('I-A2 registration refuses it', registrationOk({ knob: 'laneMix', layer: 'budget', domain: { kind: 'set', values: [] } }), false);
}
expect('MAY_PROPOSE.reviewShare', MAY_PROPOSE.reviewShare, ['kt']);
console.log(failures ? `${failures} FAILED` : 'all expectations met');
process.exit(failures ? 1 : 0);
