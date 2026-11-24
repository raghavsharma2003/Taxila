import { withTestAccount, freshChild, openLesson, done } from "/home/user/Taxila/tests/prod/_owner.mjs";
await withTestAccount(async ({ api }) => {
  const child = await freshChild(api, { name: "Riya", classLevel: 4, lang: "hinglish", interests: ["cricket"] });
  const L = await openLesson(api, child, { topicId: "c4-maths-ch05-t01", spoken: false });
  for (const t of ["mujhe samajh nahi aaya, board par likh ke samjhao", "haan", "1/2 bada hai"]) {
    const row = await L.turn(t, { raw: true });
    const r = row?.r ?? row;
    const slot = r?.ui?.studioSlot ?? null;
    console.log(JSON.stringify({ t, reply: String(r?.teacherReply ?? "").slice(0, 160), slot: slot ? { state: slot.state, kind: slot.artifact?.kind, intent: slot.intentId } : null, tray: r?.ui?.tray, agent: r?.debug?.agent ?? r?.agent ?? null }));
  }
});
done();
