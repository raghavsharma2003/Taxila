// Stop path at a pending why-probe (the w2flow pass-2 shape): class 5, c5-maths-ch08-t01, correct answers until her line
// asks for a reason, then "bas, aaj ke liye itna hi", then "haan, bas karo".
import { writeFileSync } from "node:fs";
const O = await import("/home/user/Taxila/tests/prod/_owner.mjs");
const { withTestAccount, openLesson, ordinaryTurn, freshChild, PERSONAS, arg, done, ok } = O;
const RUNS = Number(arg("runs", "6"));
const WHY = /\b(kaise|kyun|kyon|why|how did|reason|kaise pata)\b/i;
const out = [];
await withTestAccount(async ({ api, child: first }) => {
  for (let i = 0; i < RUNS; i++) {
    const persona = { ...PERSONAS.aarav, name: "Riya", classLevel: 5 };
    const child = i === 0 ? first : await freshChild(api, persona);
    let L;
    try { L = await openLesson(api, child, { persona, topicId: "c5-maths-ch08-t01" }); } catch (e) { out.push({ i, err: String(e.message).slice(0, 200) }); continue; }
    let n = 0;
    for (; n < 26 && !L.ended; n++) {
      if (n >= 3 && WHY.test(String(L.last?.teacherReply ?? "")) && L.last?.move?.kind !== "break") break;
      const t = ordinaryTurn(L, persona, { wrongRate: 0.1 });
      await L.turn(t.text);
    }
    const before = L.last;
    const s1 = (await L.turn("bas, aaj ke liye itna hi")).r;
    let s2 = null, s3 = null;
    if (!s1.end && !s1.error) s2 = (await L.turn("haan, bas karo")).r;
    if (s2 && !s2.end && !s2.error) s3 = (await L.turn("bas")).r;
    const rec = { i, lesson: L.lessonId, n, before: { kind: before?.move?.kind, reply: before?.teacherReply },
      s1: { kind: s1.move?.kind, req: s1.move?.request, end: !!s1.end, chips: (s1.ui?.chips ?? []).map((c) => c.id), ask: s1.ui?.ask?.itemId ?? null, reply: s1.teacherReply },
      s2: s2 && { kind: s2.move?.kind, end: !!s2.end, reply: s2.teacherReply }, s3: s3 && { kind: s3.move?.kind, end: !!s3.end, reply: s3.teacherReply } };
    out.push(rec);
    console.log(JSON.stringify(rec).slice(0, 900));
    await L.end();
  }
}, { tag: "e2erev-stopwhy", child: { classLevel: 5, firstName: "Riya" } });
writeFileSync(new URL("./stop-why.json", import.meta.url), JSON.stringify(out, null, 1));
ok(out.every((r) => !r.s1 || r.s1.end || (r.s1.kind === "break" && r.s1.chips.includes("stop:end"))), "first stop: a check-in with the stop choice");
ok(out.every((r) => !r.s2 || r.s2.end), "the confirm ends the lesson");
done();
