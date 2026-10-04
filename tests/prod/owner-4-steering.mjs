// OWNER TEST 2026-10-04 item 4 — "I want to talk about something else" / "explain it in this way" is not understood.
// Owner intent: free-form steering requests (change topic, explain differently, slower, with an example, in Hindi /
// English, as a story) must be understood and ACTED ON within the next turn. (A picture/diagram request is item 5.)
//
// Each request is made in a fresh lesson, mid-lesson (after two ordinary turns: during the teaching or on a question),
// on the typed and the spoken lane. The very next teacher turn is judged by:
//   - the common bar: no error/fallback, the lesson is NOT ended (a topic change is not a stop: F8), not a bare re-ask
//     of the card's question, nothing deferred ("baad mein", "pehle yeh khatam"), not the previous turn again;
//   - the request's own evidence, written below per request (e.g. "slowly" must slow HER down and never tell the CHILD
//     to speak slowly: F14; "Hindi mein" must switch the language and keep it on the following turn: F12);
//   - with --judge model, the model audit too (ignores_child / talks_to_wrong_person), strict OR.
//
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/owner-4-steering.mjs [--base URL] [--seed N] [--lanes both|typed|spoken] [--judge model]
import { arg, withTestAccount, ok, warn, done, BASE, SEED, PERSONAS, GREET, freshChild, openLesson, openingOf, ordinaryTurn, RX, rubric, modelJudge, floorContentOf,
  jaccard, hindiShare, enShare, DEVANAGARI, norm, compact, save, tally } from "./_owner.mjs";

const lanes = arg("lanes", "both");
const prevOf = (row) => row.prev?.teacherReply ?? row.prev?.teacherOpening ?? "";
const minusAsk = (t, ask) => (ask ? String(t ?? "").split(ask).join(" ") : String(t ?? "")).trim();

/**
 * The requests. `check(reply, ctx)` → null when acted on, else why not. ctx: { prev, r, next (the following turn's
 * response, for persistence), persona }.
 */
const REQUESTS = [
  { id: "talk_else", text: "can we talk about something else", persona: "meher",
    check: (rep, c) => (/\b(what would you like|what do you want to talk|kis (?:baare|cheez)|kya baat karna|something else|kuch aur|sure|of course|zaroor|theek hai|chalo)\b/i.test(rep) && jaccard(minusAsk(rep, c.r.ui?.ask?.text), c.prev) < 0.5 ? null
      : "no sign the topic change was taken up (no 'what would you like to talk about', or the same lesson turn again)") },
  { id: "topic_interest", text: "cricket ke baare mein baat karo", persona: "aarav",
    check: (rep) => (/\b(cricket|bat|batting|bowler|bowling|wicket|overs?|run|runs|six|four|kohli|dhoni|ipl|match|team)\b/i.test(rep) ? null : "cricket never came up: the request was ignored") },
  { id: "differently", text: "explain it differently", persona: "zoya",
    check: (rep, c) => { const fresh = minusAsk(rep, c.r.ui?.ask?.text); return fresh.split(/\s+/).length >= 8 && jaccard(fresh, minusAsk(c.prev, c.prevAsk)) < 0.4 ? null : "no new explanation (the same words, or only the question)"; } },
  { id: "slowly", text: "slowly please", persona: "golu",
    check: (rep, c) => (RX.childSlow.test(rep) ? "she told the CHILD to speak slowly (the request was for her: F14)"
      : !(minusAsk(rep, c.r.ui?.ask?.text).split(/\s+/).length >= 4) ? "no re-explanation at all (only the question)"
        : (/\b(dheere|dhire|slow|slowly|aaram se|step by step|ek ek|ek-ek|thoda thoda|chhote chhote|one by one)\b/i.test(rep) || String(rep).length <= String(c.prev).length * 0.9) ? null
          : "not slower: no slower, step-by-step re-say and no shorter turn") },
  { id: "example", text: "example do", persona: "kabir",
    check: (rep, c) => (/\b(example|jaise|maan lo|maano|suppose|for instance|imagine|udaharan|socho ki|agar)\b/i.test(rep) && jaccard(minusAsk(rep, c.r.ui?.ask?.text), minusAsk(c.prev, c.prevAsk)) < 0.6 ? null : "no example given") },
  { id: "hindi", text: "Hindi mein samjhao", persona: "meher",
    check: (rep, c) => {
      if (RX.thinkInHindi.test(rep)) return "told the child to 'think in Hindi' instead of switching (F12)";
      const hi = (t) => (String(t).match(DEVANAGARI) ?? []).length > 10 || (hindiShare(t) >= 0.5 && enShare(t) < 0.2);
      if (!hi(minusAsk(rep, c.r.ui?.ask?.text) || rep)) return "the reply is not in Hindi";
      if (c.next && !c.next.error && c.next.teacherReply && !hi(c.next.teacherReply)) return "switched for one turn only: the following turn is back in English";
      return null;
    } },
  { id: "english", text: "English mein batao please", persona: "ishaan",
    check: (rep, c) => {
      const en = (t) => (String(t).match(DEVANAGARI) ?? []).length === 0 && enShare(t) >= 0.2 && hindiShare(t) < 0.5;
      if (!en(minusAsk(rep, c.r.ui?.ask?.text) || rep)) return "the reply is not in English";
      if (c.next && !c.next.error && c.next.teacherReply && !en(c.next.teacherReply)) return "switched for one turn only: the following turn is back in Hindi";
      return null;
    } },
  { id: "story", text: "story ki tarah batao", persona: "golu",
    check: (rep) => (/\b(kahani|story|ek baar|ek din|once upon|one day|ek ladka|ek ladki|ek gaon|ek chhota sa|there was a|there once)\b/i.test(rep) && !/kahani ka agla/i.test(rep) ? null : "no story") },
];

const outcomes = [];
const transcripts = [];
await withTestAccount(async ({ api }) => {
  let i = 0;
  for (const q of REQUESTS) {
    const laneList = lanes === "both" ? [false, true] : [lanes === "spoken"];
    for (const spoken of laneList) {
      const persona = PERSONAS[q.persona];
      const child = await freshChild(api, persona);
      const tag = `${q.id} "${q.text}" (${spoken ? "spoken" : "typed"}, ${persona.name})`;
      let L;
      try { L = await openLesson(api, child, { topicId: persona.topics[i++ % persona.topics.length], spoken, persona }); } catch (e) { ok(false, `${tag}: lesson start failed: ${e.message}`); continue; }
      await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" });
      const o = ordinaryTurn(L, persona); await L.turn(o.text, { kind: o.kind });
      if (L.ended) { ok(false, `${tag}: the lesson ended on an ordinary turn`); await L.end(); continue; }
      const row = await L.turn(q.text, { kind: "steer" });
      const r = row.r;
      const rep = String(r.teacherReply ?? "");
      // the following turn: an ordinary child reply, for persistence (language) and to see that the lesson goes on
      const nextRow = !L.ended ? await L.turn(ordinaryTurn(L, persona).text, { kind: "answer" }) : null;
      const common = rubric(r, { kind: "steer", prevReply: prevOf(row), prevAsk: row.prev?.ui?.ask?.text ?? null, earlier: L.replies().slice(0, -2), askHistory: [], lane: L.mode,
        lang: q.id === "hindi" || q.id === "english" ? "switch" : persona.lang, langSwitched: true, floorContent: floorContentOf(L.item(r)), expectEnd: false });
      const why = r.error ? `the turn failed (${r.error.status})` : q.check(rep, { prev: prevOf(row), prevAsk: row.prev?.ui?.ask?.text ?? null, r, next: nextRow?.r, persona });
      const judged = await modelJudge({ previous: prevOf(row), child: row.child, reply: rep, verdict: r.ui?.verdict });
      const problems = [...(why ? [{ code: `S.${q.id}`, why }] : []), ...common, ...judged];
      ok(problems.length === 0, `${tag}: acted on in the next turn — ${problems.length ? problems.map((p) => `${p.code}: ${p.why}`).join("; ") : "yes"} | teacher (${r.move?.kind}${r.end ? ", end" : ""}): "${rep.slice(0, 120)}"`);
      outcomes.push({ id: q.id, spoken, persona: persona.name, ok: problems.length === 0, problems, reply: rep, kind: r.move?.kind, end: !!r.end });
      await L.end();
      transcripts.push({ tag, ...compact(L) });
    }
  }
}, { tag: "owner4", child: { firstName: "Riya" } });

const passed = outcomes.filter((x) => x.ok).length;
const path = save("owner-4.json", { base: BASE, seed: SEED, outcomes, transcripts });
console.log(`\nsteering requests acted on in the next turn: ${passed}/${outcomes.length}; problems: ${tally(outcomes.flatMap((x) => x.problems))}  → ${path}`);
ok(outcomes.length > 0 && passed === outcomes.length, `every steering request acted on within the next turn: ${passed}/${outcomes.length}`);
done();
