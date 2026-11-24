// The scripted walk as knows.js shapes it: a small pure model of director/state.js's script walk (warm-up, hook, beats,
// cards, remediation, the last skill's ladder) that applies a plan and a simulated child's answers. It records the events
// assertWalkExplained reads and the because records that APPLIED (a record in the plan whose choice never came up, such as a
// remediation for a card answered right, is not applied). No model, no network, no clock.
import { beatsFor, afterCompressCheck, ladderFor, remedyNow, askCardId, checkCardId } from "../../server/director/knows.js";

const ordered = (script, kit) => {
  const by = new Map(script.skills.map((s) => [s.skillId, s]));
  return kit.skills.map((s) => by.get(s.id)).filter(Boolean);
};
/** The keyed card a beat poses, as the walk builds it (id + authored target), or null for a beat with no card. */
export function cardOfBeat(sk, beat) {
  const [kind, id] = beat.split(":");
  if (kind === "explain") {
    const b = sk.explain.find((x) => x.id === id);
    return b?.ask ? { id: askCardId(sk.skillId, id), skillId: sk.skillId, scriptAsk: { beatId: id, targets: b.ask.targets ?? null } } : null;
  }
  if (kind === "worked") return sk.workedExample?.yourStep ? { id: askCardId(sk.skillId, "worked"), skillId: sk.skillId, scriptAsk: { beatId: "worked", targets: sk.workedExample.yourStep.targets ?? null } } : null;
  if (kind === "check") {
    const c = sk.checks.find((x) => x.id === id);
    return c ? { id: checkCardId(sk.skillId, id), skillId: sk.skillId, scriptCheck: { checkId: id, targets: c.targets ?? null } } : null;
  }
  return null;
}

/**
 * @param {{ script, kit, plan, answer: (card) => { verdict: "right"|"wrong"|"stuck", misconceptionId?: string } }} a
 * @returns {{ events: object[], applied: object[] }}
 */
export function simulateWalk({ script, kit, plan, answer }) {
  const events = [], applied = [];
  const apply = (b) => { if (b && !applied.some((x) => x.choice === b.choice && x.on === b.on)) applied.push(b); };
  const planned = (choice, on) => (plan.because ?? []).find((b) => b.choice === choice && b.on === on);
  if (plan.prereqCheck) { events.push({ kind: "prereq", topicId: plan.prereqCheck.topicId }); apply(planned("prereqCheck", plan.prereqCheck.topicId)); }
  if (plan.firstCard) { events.push({ kind: "first", itemId: plan.firstCard }); apply(planned("firstCard", plan.firstCard)); apply(planned("opener", plan.firstCard)); }
  const sks = ordered(script, kit);
  let lastDone = false;
  sks.forEach((sk, k) => {
    const compressed = plan.compress?.includes(sk.skillId);
    if (compressed) apply(planned("compress", sk.skillId));
    if (plan.checkOrder?.[sk.skillId]) apply(planned("checkOrder", sk.skillId));
    let beats = beatsFor(plan, sk, { hook: k === 0 });
    for (let i = 0; i < beats.length; i += 1) {
      const b = beats[i];
      if (b === "hook") {
        events.push({ kind: "hook", skillId: sk.skillId, index: plan.hookSlot?.skillId === sk.skillId ? plan.hookSlot.index : 0 });
        if (plan.hookSlot?.skillId === sk.skillId) apply(planned("hookSlot", sk.skillId));
      }
      events.push({ kind: "beat", skillId: sk.skillId, beat: b });
      const card = cardOfBeat(sk, b);
      if (!card) continue;
      const a = answer(card) ?? { verdict: "right" };
      if (compressed && i === 0) {
        const r = afterCompressCheck(plan, sk, a.verdict);
        if (r.done) { if (k === sks.length - 1) lastDone = true; break; }
        apply(r.because);
        beats = [...beats, ...r.beats];
        continue;
      }
      const authored = card.scriptCheck?.targets ?? card.scriptAsk?.targets ?? null;
      if (a.verdict === "wrong" && authored) {
        const rem = remedyNow(plan, card, a.misconceptionId ? { misconceptionId: a.misconceptionId } : null, sk);
        events.push({ kind: "remedy", cardId: card.id, targets: rem.targets, authored });
        apply(rem.because);
      }
    }
  });
  const last = sks.at(-1);
  if (last && !lastDone) {
    const order = ladderFor(plan, last);
    if (plan.ladderOrder?.[last.skillId]) apply(planned("ladderOrder", last.skillId));
    for (const id of order) { if (id === plan.firstCard) continue; events.push({ kind: "beat", skillId: last.skillId, beat: `ladder:${id}` }); }
  }
  return { events, applied };
}
