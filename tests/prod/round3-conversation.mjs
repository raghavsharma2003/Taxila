// Round 3 conversation acceptance (V5.2 natural conversation; owner directive 2026-10-09). Runs against a local server
// (TAXILA_BASE=http://127.0.0.1:<port>, Neon TEST branch) and taxila.dev. Code checks on what the child SEES (the reply, the
// card, the move the response carries, the end flag), with phrases that are NOT in evals/conversation-v2/cases.mjs or the
// round-2 held-out set, so a pass is not the battery's own strings coming back.
//
//   A. a FIRST pose is a bridge then the card question byte for byte: it ends on the card's question, carries a few words of
//      her own, no goodbye words mid-lesson, one question (the draft used to re-word the kit question or say goodbye)
//   B. a question about her over a question already posed ("tum kis city mein ho?"): answered as an AI teacher, her own
//      words, the card question last (the drift check used to cut the answer and ship the bare question)
//   C. a share from their life ("meri cousin ki shaadi hai next week"): noticed in her words now AND come back to later in
//      the lesson (a kept promise: s.later)
//   D. a stop check-in: "padhai band karte hain" offers going on / a break as well as stopping; the "haan" after it carries on
//      with no goodbye and no "rest" talk
//   E. a granted break ("pani pi ke aati hoon") asks no question
//   F. giving up beside a confusion ("kuch palle nahi pad raha, rehne do") is read as frustration (the move says so)
//   G. a re-pose after two "pata nahi": never only the card question (owner-2 R3)
//   H. over every reply: no "sensible" (a recited prompt word), no helpline on a non-distress turn, no reply that is only the
//      card question after a child line, none repeating an earlier line (J >= 0.8)
//   I. LOCAL ONLY (the debug read): the share of turns the reply guard rewrote, and the codes, reported (not a gate)
// No disclosure is sent. Each lesson is fresh; the account is deleted in a finally.
//
// Run: NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:18912 node tests/prod/round3-conversation.mjs
//      NODE_USE_ENV_PROXY=1 node tests/prod/round3-conversation.mjs --base https://taxila.dev
import { withTestAccount, ok, warn, done, BASE, isLocal } from "./lib.mjs";
import { PERSONAS, freshChild, openLesson, RX, jaccard } from "./_owner.mjs";

const minusAsk = (t, a) => (a ? String(t ?? "").split(a).join(" ") : String(t ?? "")).trim();
const kitAsk = (r) => (r?.ui?.ask?.itemId ? r.ui.ask.text : null);
const words = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean).length;
const own = (r) => minusAsk(r?.teacherReply, kitAsk(r));
const bare = (r) => !!kitAsk(r) && words(own(r)) < 4;
const endsOnAsk = (r) => !!kitAsk(r) && String(r.teacherReply ?? "").trim().endsWith(String(kitAsk(r)).replace(/…$/, "").trim().slice(-40));
const qCount = (t) => (String(t ?? "").match(/[?？]/g) ?? []).length;
const GOODBYE = /\b(good\s*bye|bye[\s-]*bye|alvida|phir\s+milte\s+hain|see\s+you\s+(?:next|tomorrow|soon)|aaj\s+ke\s+liye\s+(?:bas\s+)?itna|lesson\s+ended|we['’]?ll\s+stop\s+(?:here|the\s+lesson))\b/i;
const GO_ON = /\b(continue|keep\s+going|carry\s+on|aage|chalte\s+rah|jaari|break|pause|aaram)\b|आगे|ब्रेक/i;
const REST_TALK = /\b(aaram\s+karo|aaram\s+kijiye|rest|close\s+the\s+book|lesson\s+ended|so\s+jao|good\s*night)\b/i;
const lessons = [];
const debugs = [];

async function toQuestion(L, max = 8) {
  for (let i = 0; i < max && !kitAsk(L.last); i++) await L.turn("haan, aage", { kind: "filler" });
  return !!kitAsk(L.last);
}
/** The first turn that newly puts a kit question on the card (a first pose), driving with fillers. */
async function toFirstPose(L, max = 9) {
  for (let i = 0; i < max; i++) {
    const before = kitAsk(L.last) ? L.last.ui.ask.itemId : null;
    const row = await L.turn(i === 0 ? "haan ready hoon" : "achha, aage", { kind: "filler" });
    if (row.r?.debug) debugs.push(row.r.debug);
    const now = row.r?.ui?.ask?.itemId ?? null;
    if (now && now !== before) return row.r;
  }
  return null;
}
const track = (row) => { if (row?.r?.debug) debugs.push(row.r.debug); return row; };

await withTestAccount(async ({ api }) => {
  const open = async (p = PERSONAS.aarav, topic = 0) => {
    const child = await freshChild(api, p);
    const L = await openLesson(api, child, { topicId: p.topics[topic], persona: p });
    lessons.push(L);
    return L;
  };

  // A. a first pose: bridge + the card question
  for (const [p, topic] of [[PERSONAS.aarav, 0], [PERSONAS.meher, 0]]) {
    const L = await open(p, topic);
    const r = await toFirstPose(L);
    if (!r) { ok(false, `A ${p.name}: no question reached the card in 9 turns`); await L.end(); continue; }
    const rep = String(r.teacherReply ?? "");
    ok(endsOnAsk(r), `A ${p.name}: a first pose ends on the card's question — "${rep.slice(-90)}"`);
    ok(!GOODBYE.test(rep) && !r.end, `A ${p.name}: no goodbye words on a first pose mid-lesson`);
    ok(words(own(r)) >= 2, `A ${p.name}: a few words of her own before it (${words(own(r))})`);
    await L.end();
  }

  // B. a question about her, over a question already posed
  {
    const L = await open(PERSONAS.zoya, 0);
    await L.turn("haan ready hoon", { kind: "greet" });
    if (!(await toQuestion(L))) ok(false, "B: no question on the card");
    else {
      track(await L.turn("achha", { kind: "filler" }));               // the same question is now a re-pose
      const r = track(await L.turn("tum kis city mein ho?", { kind: "offtopic" })).r;
      const rep = String(r?.teacherReply ?? "");
      ok(!r?.error && !r?.end, `B: the lesson goes on (${r?.move?.kind})`);
      ok(/\b(AI|artificial|computer)\b/i.test(own(r)), `B: answered as an AI teacher in her own words — "${own(r).slice(0, 120)}"`);
      ok(!bare(r), `B: not only the card question (${words(own(r))} own words)`);
      ok(!kitAsk(r) || endsOnAsk(r), `B: the card question comes last — "${rep.slice(-80)}"`);
      ok(!RX.defer.test(rep), `B: answered now, never deferred (owner-2 R7.defer)`);
    }
    await L.end();
  }

  // C. a share kept for later
  {
    const L = await open(PERSONAS.aarav, 1);
    await L.turn("haan ready hoon", { kind: "greet" });
    if (!(await toQuestion(L))) ok(false, "C: no question on the card");
    else {
      const r = track(await L.turn("meri cousin ki shaadi hai next week", { kind: "offtopic" })).r;
      ok(/\b(shaadi|wedding|cousin)\b/i.test(own(r)), `C: noticed in her words now — "${own(r).slice(0, 120)}"`);
      // answer on: the kit's own key when a question is on the card, else a filler, until the share comes back (≤ 8 turns)
      let back = false;
      for (let i = 0; i < 8 && !back && !L.ended; i++) {
        const item = L.item(L.last);
        const row = track(await L.turn(item ? String(item.answer).slice(0, 60) : "achha", { kind: item ? "answer" : "filler" }));
        if (/\b(shaadi|wedding|cousin)\b/i.test(String(row.r?.teacherReply ?? ""))) back = true;
      }
      ok(back, "C: she comes back to it later in the lesson (the promise is kept)");
    }
    await L.end();
  }

  // D. a stop check-in, then a plain "haan"
  {
    const L = await open(PERSONAS.golu, 0);
    await L.turn("haan ready hoon", { kind: "greet" });
    await toQuestion(L);
    const r = track(await L.turn("padhai band karte hain", { kind: "stop" })).r;
    const rep = String(r?.teacherReply ?? "");
    ok(!r?.end, "D: one check-in, the lesson does not end on the first ask");
    ok(GO_ON.test(rep), `D: going on or a break is offered as well as stopping — "${rep.slice(0, 140)}"`);
    ok(!GOODBYE.test(rep), "D: no goodbye before they chose");
    if (!L.ended) {
      const n = track(await L.turn("haan", { kind: "filler" })).r;
      const t = String(n?.teacherReply ?? "");
      if (!n?.end) ok(!REST_TALK.test(t) && !GOODBYE.test(t), `D: the "haan" after it carries on, no goodbye or rest talk — "${t.slice(0, 140)}"`);
      else warn(`D: the lesson ended on "haan" after the check-in (${n?.move?.kind})`);
    }
    await L.end();
  }

  // E. a granted break asks nothing
  {
    const L = await open(PERSONAS.zoya, 1);
    await L.turn("haan ready hoon", { kind: "greet" });
    await toQuestion(L);
    const r = track(await L.turn("pani pi ke aati hoon", { kind: "steer" })).r;
    ok(!r?.end && qCount(r?.teacherReply) === 0, `E: a granted break asks no question — "${String(r?.teacherReply ?? "").slice(0, 120)}"`);
    await L.end();
  }

  // F. giving up beside a confusion is frustration
  {
    const L = await open(PERSONAS.kabir, 0);
    await L.turn("haan ready hoon", { kind: "greet" });
    await toQuestion(L);
    const r = track(await L.turn("kuch palle nahi pad raha, samajh nahi aa raha, rehne do", { kind: "confused" })).r;
    ok(r?.move?.request === "frustration", `F: read as frustration (move request ${r?.move?.request ?? "none"}, ${r?.move?.kind})`);
    ok(!/1098|14416/.test(String(r?.teacherReply ?? "")), "F: no helpline (not distress)");
    await L.end();
  }

  // G. two "pata nahi": never the bare card question
  {
    const L = await open(PERSONAS.golu, 1);
    await L.turn("haan ready hoon", { kind: "greet" });
    if (!(await toQuestion(L))) ok(false, "G: no question on the card");
    else {
      for (let i = 0; i < 2; i++) {
        const r = track(await L.turn("pata nahi", { kind: "idk" })).r;
        ok(!bare(r), `G "pata nahi" #${i + 1}: not only the card question (${words(own(r))} own words) — "${String(r?.teacherReply ?? "").slice(0, 120)}"`);
      }
    }
    await L.end();
  }
}, { tag: "r3conv" });

// H. over every reply
const all = lessons.flatMap((L) => L.rows.map((x) => ({ L, x })));
const recited = all.filter(({ x }) => /\bsensible\b/i.test(String(x.r?.teacherReply ?? "")));
ok(recited.length === 0, `H: no recited prompt word ("sensible") in ${all.length} replies${recited.length ? ` — "${recited[0].x.r.teacherReply.slice(0, 100)}"` : ""}`);
const helpline = all.filter(({ x }) => /1098|14416/.test(String(x.r?.teacherReply ?? "")));
ok(helpline.length === 0, `H: no helpline on a non-distress turn (${helpline.length})`);
const bareRows = all.filter(({ x }) => !["filler", "greet", "answer"].includes(x.kind) && bare(x.r));
ok(bareRows.length === 0, `H: no child line answered with only the card question (${bareRows.length})${bareRows.length ? ` — "${bareRows[0].x.child}" -> "${bareRows[0].x.r.teacherReply.slice(0, 80)}"` : ""}`);
let reps = 0;
for (const L of lessons) {
  const seen = [];
  for (const x of L.rows) { const t = String(x.r?.teacherReply ?? ""); if (t && seen.some((p) => jaccard(p, t) >= 0.8)) reps++; if (t) seen.push(t); }
}
ok(reps === 0, `H: no reply repeats an earlier line of its lesson (J >= 0.8): ${reps}`);

// I. local only: the reply guard's rewrites over the turns of this run
if (isLocal) {
  const withGuard = debugs.filter((d) => d?.guard && !(d.guard.caught ?? []).includes("unavailable"));
  const rewritten = withGuard.filter((d) => d.guard.rewritten);
  const codes = {};
  for (const d of withGuard) for (const c of d.guard.caught ?? []) codes[c] = (codes[c] ?? 0) + 1;
  warn(`I: reply guard rewrote ${rewritten.length}/${withGuard.length} turns of this run; first-draft codes ${JSON.stringify(codes)}`);
} else warn("I: the debug read is local-only; no rewrite count on a remote target");
done();
