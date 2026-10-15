#!/usr/bin/env node
// Round 5 (stream 4A): the agent lane's game ask, end to end through the real server. A child asks to play; the reply
// either carries a real play piece (a studioSlot of a game) or says honestly that none is ready, and never points at one
// that is not up. TAXILA_BASE=http://localhost:8098 node --env-file=.env.local tests/prod/agent-game-probe.mjs [--topics a,b]
import { withTestAccount, freshChild, openLesson, arg, done } from "./_owner.mjs";

const TOPICS = String(arg("topics", "c4-maths-ch05-t01,c3-maths-ch02-t01,c2-maths-ch01-t01,c5-maths-ch03-t01")).split(",");
const ASKS = ["game khelna hai", "mujhe game khelna hai na", "ek game dikhao"];
const out = [];
await withTestAccount(async ({ api }) => {
  for (const [k, topicId] of TOPICS.entries()) {
    const cl = Number(topicId.match(/^c(\d)/)?.[1] ?? 4);
    const child = await freshChild(api, { name: "Kabir", classLevel: cl, lang: "hinglish", interests: ["cricket"] });
    const L = await openLesson(api, child, { topicId, spoken: true });
    const row = await L.turn(ASKS[k % ASKS.length], { raw: true, asr: 0.92 });
    const r = row?.r ?? row;
    const slot = r?.ui?.studioSlot ?? r?.studioSlot ?? null;
    out.push({ topicId, ask: ASKS[k % ASKS.length], reply: r?.teacherReply ?? r?.reply ?? r?.text, slotKind: slot?.artifact?.kind ?? null, play: slot?.artifact?.play?.family ?? null,
      reasons: (r?.debug?.reasons ?? r?.reasons ?? []).filter((x) => /agent|studio|play/.test(x)), agentNotes: r?.debug?.agent?.notes ?? null });
  }
});
for (const o of out) console.log(JSON.stringify(o));
done();
