// Stop path under a model outage (drill server: TAXILA_DRILL_HANG_DEPLOY=taxila-fast hangs every classify call,
// TAXILA_UNDERSTAND_DEPLOY=missing fails the note): which stop phrases still get the one check-in?
//   TAXILA_BASE=http://127.0.0.1:8812 node stop-drill.mjs
import { writeFileSync } from "node:fs";
const O = await import("/home/user/Taxila/tests/prod/_owner.mjs");
const { withTestAccount, openLesson, freshChild, PERSONAS, done, ok } = O;
const CASES = [
  { said: "bas, aaj ke liye itna hi", spoken: false },
  { said: "बस, आज के लिए इतना ही।", spoken: true },
  { said: "aaj ke liye bas", spoken: false },
  { said: "lesson khatam karo", spoken: false },
  { said: "बस करो अब", spoken: true },
  { said: "bas karo ab", spoken: false },
  { said: "मुझे अब नहीं पढ़ना", spoken: true },
  { said: "I'm done for today", spoken: false },
];
const out = [];
await withTestAccount(async ({ api, child: first }) => {
  for (let i = 0; i < CASES.length; i++) {
    const c = CASES[i];
    const child = i === 0 ? first : await freshChild(api, { ...PERSONAS.aarav, name: "Riya", classLevel: 5 });
    let L;
    try { L = await openLesson(api, child, { persona: PERSONAS.aarav, topicId: "c5-maths-ch08-t01", spoken: c.spoken }); } catch (e) { out.push({ ...c, err: e.message }); continue; }
    await L.turn(c.spoken ? "हाँ, मैं तैयार हूँ" : "haan ready", { raw: true });
    const r = (await L.turn(c.said, { raw: true })).r;
    const rec = { ...c, kind: r.move?.kind ?? null, request: r.move?.request ?? null, end: !!r.end, chips: (r.ui?.chips ?? []).map((x) => x.id), reply: r.teacherReply, err: r.error?.message };
    rec.checkIn = rec.kind === "break" && rec.chips.includes("stop:end");
    out.push(rec);
    console.log(JSON.stringify(rec).slice(0, 500));
    await L.end();
  }
}, { tag: "e2erev-drill", child: { classLevel: 5, firstName: "Riya" } });
writeFileSync(new URL("./stop-drill.json", import.meta.url), JSON.stringify(out, null, 1));
ok(out.every((r) => r.checkIn || r.end), `every stop phrase gets the check-in or ends under the outage (${out.filter((r) => r.checkIn || r.end).length}/${out.length})`);
done();
