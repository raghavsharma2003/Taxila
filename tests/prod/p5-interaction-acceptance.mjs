// p5-interaction acceptance (owner priority 5, natural student-tutor interaction; owner directive 2026-10-05). Runs against
// a local server (TAXILA_BASE=http://127.0.0.1:<port>, DB checks on the Neon TEST branch) and later against taxila.dev.
// Every check is on what the child SEES (the reply, the card, the end flag); the trace checks read brain_trace codes only.
//
//   1. steering during TEACHING is acted on and does not skip ahead: story / example / slowly / samajh nahi aaya
//   2. "can we talk about something else" is steering: never a break, never a wrap, the ways-in chips are on screen
//   3. the card cap: one question never sits on the card for more than 3 teacher turns in a row
//   4. the readings: "matlab?", "phir se bolo", "mummy bula rahi thi, haan", "skip", "boring", "mujhse nahi hoga",
//      "ruko soch raha hoon", "tum robot ho?", "ghost story sunao" — each acted on, none ends the lesson, none is a bare re-ask
//   5. no bare question, no orphan quote, no cut decimal, no goodbye words on a turn that goes on (owner-2 R3/R6/R8)
//   6. brain_trace carries the readings as codes (request.*, conv2.note.* or conv2.no_note) — DB checks, local or with
//      TAXILA_DB_URL; skipped with a WARN otherwise
// No disclosure is sent. Each lesson is fresh; the account is deleted in a finally.
//
// Run: NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8932 node tests/prod/p5-interaction-acceptance.mjs
import { withTestAccount, ok, warn, done, dbq, BASE } from "./lib.mjs";
import { PERSONAS, freshChild, openLesson, openingOf, RX, jaccard } from "./_owner.mjs";

const minusAsk = (t, a) => (a ? String(t ?? "").split(a).join(" ") : String(t ?? "")).trim();
const kitAsk = (r) => (r?.ui?.ask?.itemId ? r.ui.ask.text : null);
const words = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean).length;
const bare = (r) => !!kitAsk(r) && words(minusAsk(r.teacherReply, kitAsk(r))) < 4;
const DANGLING = /^[\s”"’)\]]/;
const CUT_DECIMAL = /\b\d\.\s\d/;
const lessons = [];

/** Turns until the lesson is in its teaching phase (a hook / explanation / worked example on the table), at most 3. */
async function toTeaching(L) {
  for (let i = 0; i < 3 && !["explain", "worked_example", "hook"].includes(L.last?.move?.kind ?? L.opening.move?.kind); i++) await L.turn("haan", { kind: "filler" });
}
/** Fillers until a kit question is on the card (at most 8 turns). */
async function toQuestion(L) {
  for (let i = 0; i < 8 && !kitAsk(L.last); i++) await L.turn("haan, aage", { kind: "filler" });
  return !!kitAsk(L.last);
}

await withTestAccount(async ({ api }) => {
  const persona = PERSONAS.golu;
  const child = await freshChild(api, persona);
  const open = async (topicId = "c4-maths-ch05-t01") => { const L = await openLesson(api, child, { topicId, persona }); lessons.push(L); return L; };

  // 1. teaching-phase steering
  for (const [phrase, sign] of [["story ki tarah batao", /\b(kahani|story|ek din|ek baar|once|one day|ek ladka|ek ladki|ek chhota)\b/i],
    ["example do", /\b(example|jaise|maan lo|maano|suppose|imagine|udaharan|socho)\b/i],
    ["slowly please", /\b(dheere|dhire|slow|aaram se|step by step|ek ek|ek-ek|chhote)\b/i], ["samajh nahi aaya", null]]) {
    const L = await open();
    await L.turn("haan ready hoon", { kind: "greet" });
    await toTeaching(L);
    const prev = L.last;
    const row = await L.turn(phrase, { kind: "steer" });
    const r = row.r, rep = String(r.teacherReply ?? "");
    const fresh = minusAsk(rep, kitAsk(r));
    ok(!r.error && !r.end, `teach "${phrase}": the lesson goes on (${r.move?.kind})`);
    ok(r.move?.kind === "reteach", `teach "${phrase}": a re-explanation of the same idea, not the next step (move ${r.move?.kind})`);
    ok(sign ? sign.test(rep) : (words(fresh) >= 8 && jaccard(fresh, minusAsk(prev.teacherReply ?? openingOf(L), kitAsk(prev))) < 0.5), `teach "${phrase}": acted on — "${rep.slice(0, 120)}"`);
    await L.end();
  }

  // 2. change of topic is steering
  {
    const L = await open();
    await L.turn("haan ready hoon", { kind: "greet" });
    await toQuestion(L);
    const r = (await L.turn("can we talk about something else", { kind: "steer" })).r;
    ok(!r.end && !["break", "wrap"].includes(r.move?.kind), `"something else" is steering, never a break or a wrap (move ${r.move?.kind})`);
    ok((r.ui?.chips ?? []).some((c) => c.id === "req:visual") && (r.ui?.chips ?? []).some((c) => c.id === "stop:continue"), `the ways-in chips are on screen (${(r.ui?.chips ?? []).map((c) => c.id).join(",")})`);
    const story = (await L.turn("Tell it as a story", { kind: "steer", body: { chipId: "req:story" } })).r;
    ok(!story.end && /\b(kahani|story|ek din|ek baar|once|one day)\b/i.test(String(story.teacherReply ?? "")), `the story chip gets a story — "${String(story.teacherReply ?? "").slice(0, 100)}"`);
    await L.end();
  }

  // 3. the card cap
  {
    const L = await open();
    await L.turn("haan ready hoon", { kind: "greet" });
    if (await toQuestion(L)) {
      const asks = [L.last.ui.ask.itemId];
      for (let i = 0; i < 6 && !L.ended; i++) { await L.turn(i % 2 ? "hmm" : "pata nahi", { kind: "idk" }); asks.push(L.last?.ui?.ask?.itemId ?? null); }
      let run = 1, worst = 1;
      const seen = asks.filter(Boolean);
      for (let i = 1; i < seen.length; i++) { run = seen[i] === seen[i - 1] ? run + 1 : 1; worst = Math.max(worst, run); }
      ok(worst <= 3, `the card cap: the same question at most 3 turns in a row (worst run ${worst}: ${asks.join(" → ")})`);
      ok(!L.ended, "the lesson goes on after the capped question");
    } else warn("card cap: no kit question reached in 8 turns");
    await L.end();
  }

  // 4. the readings, each on a fresh question
  const READINGS = [["matlab?", (r) => !bare(r)], ["phir se bolo", (r) => !!r.teacherReply], ["mummy bula rahi thi, haan", (r) => !RX.wrapWords.test(String(r.teacherReply ?? "")) && !/mummy ke paas ja/i.test(String(r.teacherReply ?? ""))],
    ["skip", (r) => !r.end], ["boring", (r) => (r.ui?.chips ?? []).some((c) => c.id === "req:game")], ["mujhse nahi hoga", (r) => r.move?.kind !== "safeguard" && !bare(r)],
    ["ruko, soch raha hoon", (r) => !kitAsk(r)], ["tum robot ho?", (r) => /\b(ai|artificial|AI)\b/i.test(String(r.teacherReply ?? ""))], ["ghost story sunao", (r) => !RX.defer.test(String(r.teacherReply ?? "")) && !/\b(ek baar ek bhoot|once upon a time a ghost)\b/i.test(String(r.teacherReply ?? ""))]];
  {
    const L = await open("c5-maths-ch02-t01");
    await L.turn("haan ready hoon", { kind: "greet" });
    for (const [phrase, check] of READINGS) {
      if (L.ended) break;
      await toQuestion(L);
      const r = (await L.turn(phrase, { kind: "steer" })).r;
      ok(!r.error && !r.end, `"${phrase}": the lesson goes on (move ${r.move?.kind})`);
      ok(check(r), `"${phrase}": acted on — "${String(r.teacherReply ?? "").slice(0, 120)}"`);
    }
    await L.end();
  }
}, { tag: "p5int", child: { firstName: "Riya" } });

// 5. the reply shape over every turn of every lesson
const all = lessons.flatMap((L) => L.rows.filter((x) => x.r && !x.r.error).map((x) => ({ r: x.r, kind: x.kind })));
const bares = all.filter((x) => x.kind !== "module" && bare(x.r));
ok(bares.length === 0, `no reply is only the question on the card (${bares.length}/${all.length}${bares.length ? `: "${bares[0].r.teacherReply.slice(0, 80)}"` : ""})`);
const dangling = all.filter((x) => DANGLING.test(String(x.r.teacherReply ?? "")));
ok(dangling.length === 0, `no reply opens on an orphan quote (${dangling.length}/${all.length})`);
const cut = all.filter((x) => CUT_DECIMAL.test(String(x.r.teacherReply ?? "")));
ok(cut.length === 0, `no cut decimal ("0. 4") in any reply (${cut.length}/${all.length})`);
const bye = all.filter((x) => !x.r.end && !["wrap", "break"].includes(x.r.move?.kind) && RX.wrapWords.test(String(x.r.teacherReply ?? "")));
ok(bye.length === 0, `no goodbye words on a turn that goes on (${bye.length}/${all.length})`);

// 6. the trace codes (never the child's words)
const ids = lessons.map((L) => L.lessonId).filter(Boolean);
const rows = ids.length ? await dbq("select reasons from brain_trace where lesson_id = any($1::uuid[])", [ids]).catch(() => null) : null;
if (!rows) warn(`brain_trace not readable from here (${BASE}): trace checks skipped`);
else {
  const codes = rows.flatMap((x) => x.reasons ?? []);
  ok(codes.some((c) => /^request\.(another|story|example|slower|clarify|repeat|back|skip|boredom|frustration|thinking|identity|uptake|decline|change_topic)$/.test(c)),
    `brain_trace records the readings as request codes (${[...new Set(codes.filter((c) => c.startsWith("request.")))].join(", ")})`);
  ok(codes.every((c) => !/\s/.test(c) || c.length < 60), "trace reasons are codes, never sentences");
}
done();
