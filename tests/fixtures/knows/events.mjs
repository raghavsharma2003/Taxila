// The real walk's moves read back as knows.js assertWalkExplained events (shared by the real-walk tests). Pure.
/** The real moves as assertWalkExplained events. */
export function eventsOf({ script, kit, moves, plan }) {
  const ladders = new Map(script.skills.map((sk) => [sk.skillId, new Set((sk.ladder ?? []).map((x) => x.itemId))]));
  const targetsOf = new Map(script.skills.flatMap((sk) => [
    ...(sk.explain ?? []).filter((b) => b.ask).map((b) => [`script:${sk.skillId}:ask:${b.id}`, b.ask.targets ?? null]),
    ...(sk.workedExample?.yourStep ? [[`script:${sk.skillId}:ask:worked`, sk.workedExample.yourStep.targets ?? null]] : []),
    ...(sk.checks ?? []).map((c) => [`script:${sk.skillId}:${c.id}`, c.targets ?? null])]));
  const out = [];
  let lastCard = null;
  for (const m of moves) {
    const b = m.scriptBeat;
    const id = m.item?.id ?? m.itemId ?? null;
    if (id && id === plan?.firstCard && !out.some((e) => e.kind === "first")) out.push({ kind: "first", itemId: id });
    else if (id && /^c\d+-/.test(String(id)) && !String(id).startsWith(kit.topicId)) out.push({ kind: "prereq", topicId: String(id).replace(/-(i|rl-)[\w-]*$/, "") });
    if (b?.kind === "hook") {
      const sk = script.skills.find((x) => x.skillId === b.skillId);
      const said = [...(m.sayFirst ?? []), ...(m.content ?? [])].join(" ");
      const index = (sk.hook.interestSlots ?? []).findIndex((x) => x.use && said.includes(x.use.hi ?? x.use));
      out.push({ kind: "hook", skillId: b.skillId, index: Math.max(0, index) });
      out.push({ kind: "beat", skillId: b.skillId, beat: "hook" });
    } else if (b?.kind === "explain") out.push({ kind: "beat", skillId: b.skillId, beat: `explain:${b.beatId}` });
    else if (b?.kind === "worked") out.push({ kind: "beat", skillId: b.skillId, beat: "worked" });
    else if (b?.kind === "check" && !String(b.beatId).startsWith("then:")) out.push({ kind: "beat", skillId: b.skillId, beat: `check:${b.beatId}` });
    // (v6.10: a remediation's follow-up card is posed as kind "check", beatId "then:<mix-up>": not a script beat)
    // (a remediation chosen is walkRemedy's "reteach" move; a help line said on a remediation's board is not a choice)
    else if (b?.kind === "remediation" && m.kind === "reteach") out.push({ kind: "remedy", cardId: lastCard, targets: b.beatId.replace(/^rem:/, ""), authored: targetsOf.get(lastCard) ?? null });
    else if (id && !String(id).startsWith("script:") && id !== plan?.firstCard) {
      const sk = [...ladders].find(([, set]) => set.has(id));
      if (sk) out.push({ kind: "beat", skillId: sk[0], beat: `ladder:${id}` });
    }
    if (id && String(id).startsWith("script:") && !String(id).includes(":then:")) lastCard = id;
  }
  return out;
}
