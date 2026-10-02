// End-to-end TEXT-MODE simulation of the Director against the real API + Neon + Azure.
//
//   NODE_USE_ENV_PROXY=1 node evals/director-sim.mjs [--base http://localhost:8790] [--turns 14] [--topic <id>] [--keep]
//
// Without --base it serves the real API in-process on a spare port (the dev-api code path: .env.local +
// server/index.js), so it never collides with a server someone else has running. It signs up a throwaway
// guardian, records consent, creates a class-4 child, starts a lesson on a fractions topic, and lets an
// LLM-played child (taxila-fast: a shy 9-year-old, Hinglish, holding "bigger denominator = bigger
// fraction", sometimes "pata nahi") answer each teacherReply. It prints the transcript with director
// moves, evidence and pKnown changes, then checks:
//   (a) the teacher never states the active item's key while the ladder is below rung 4
//   (b) every teacher reply is ≤ 40 words
//   (c) at least one probe move other than plain practice ran
//   (d) the misconception was flagged
// and exits non-zero if any check fails. Costs real Azure tokens (≈30 small calls).
import http from "http";
import { readFileSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const TURNS = Number(arg("turns", 14));
const TOPIC = arg("topic", "c4-maths-ch05-t01");
const KEEP = process.argv.includes("--keep");

const { chat, DEPLOY } = await import("../server/azure.js");
let base = arg("base"), server;
if (!base) {
  const { handle } = await import("../server/index.js");
  server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}

// ── a tiny cookie-carrying client ──
let cookie = "";
async function api(method, path, body) {
  const res = await fetch(base + path, {
    method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// ── the simulated child ──
const PERSONA = [
  "You are role-playing Riya, a shy 9-year-old girl in class 4 in Jaipur, on a live tutoring call with her AI teacher Asha didi.",
  "Reply ONLY with what Riya says next: one short line of speech, no actions, no quotes.",
  "How Riya talks: Hinglish in Roman script, usually 2-10 words, a little shy. About one reply in five is 'pata nahi', 'hmm' or 'nahi pata didi', especially when a question feels hard.",
  "What Riya believes about fractions, firmly at first: a fraction with a BIGGER bottom number is BIGGER — 1/3 is bigger than 1/2, 1/8 is bigger than 1/4 — 'kyunki 3 bada hai 2 se'. She uses this belief whenever she compares fractions or explains why.",
  "She does know that 1/2 means one of two equal pieces, and can name simple fractions like 1/2 or 1/4 of a roti.",
  "Only after the teacher has shown it with same-size rotis, bars or pictures at least twice does she start to doubt the belief. She is 9: never an expert, never long explanations.",
  "Never say you are an AI or that this is a simulation.",
].join("\n");

async function childSays(history) {
  const messages = [{ role: "system", content: PERSONA }, ...history.map((h) => ({ role: h.who === "teacher" ? "user" : "assistant", content: h.text }))];
  const { text } = await chat(DEPLOY.fast, messages, { maxTokens: 400, effort: "low", timeoutMs: 20_000 });
  return text.trim().replace(/^riya:\s*/i, "").replace(/^["“]|["”]$/g, "");
}

// ── independent checks (not the server's own leak guard) ──
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const lower = (t) => String(t || "").toLowerCase();
const VERDICT = /(bada|badi|bade|zyada|jyada|bigger|larger|greater|more|chhota|chhoti|smaller|sahi|correct|right|answer|jawab|uttar)/;
/** (a): the reply states the key — anywhere if the question does not name it, else in a non-question verdict sentence. */
function statesKey(reply, item, childText) {
  const forms = [item.answer, ...(item.acceptable || [])].map(lower).filter((f) => f.length >= 2 || /\d/.test(f));
  const prompt = lower(`${item.prompt_en} ${item.prompt_hi}`);
  for (const f of forms) {
    if (!lower(reply).includes(f)) continue;
    if (lower(childText).includes(f)) continue;            // echoing the child's own words reveals nothing
    if (!prompt.includes(f)) return f;
    for (const sentence of reply.split(/(?<=[.!?।])\s+/)) {
      const s = lower(sentence);
      if (s.trim().endsWith("?") || !s.includes(f)) continue;
      const after = s.slice(s.indexOf(f) + f.length).split(/\s+/).slice(0, 4).join(" ");
      if (VERDICT.test(after)) return f;
    }
  }
  return null;
}

const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`   ✗ ${msg}`); };
const fmtSkills = (skills = {}) => Object.entries(skills).map(([id, s]) => `${id.split("-").pop()} ${s.before}→${s.after} ${s.status}`).join(", ");

try {
  const stamp = Date.now();
  await api("POST", "/api/auth/signup", { email: `sim+${stamp}@taxila.test`, password: `sim-${stamp}-pw`, name: "Sim Guardian", isGuardianAdult: true });
  const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 4, languagePref: "hinglish", interests: ["cricket", "drawing"] });
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  const t0 = Date.now();
  const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId: TOPIC, mode: "text" });
  if (!start.debug) throw new Error("the API returned no debug payload (it must run on loopback or with TAXILA_DEBUG=1)");
  console.log(`lesson ${start.lessonId} · ${start.topic.title} (${start.topic.chapter}) · teacher ${start.teacher.name}/${start.teacher.voice} · kit ${start.debug.kitVerified ? "verified" : "mini (unverified)"} · start ${Date.now() - t0} ms\n`);

  const history = [{ who: "teacher", text: start.teacherOpening }];
  const moves = [start.debug.move];
  let flagged = false, probes = 0;
  console.log(`[00] T (${start.debug.move.kind}): ${start.teacherOpening}`);
  if (words(start.teacherOpening) > 40) fail(`(b) opening is ${words(start.teacherOpening)} words`);

  for (let i = 1; i <= TURNS; i++) {
    const childText = await childSays(history);
    history.push({ who: "child", text: childText });
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, typed: true });
    const d = r.debug;
    const c = d.classification;
    console.log(`[${String(i).padStart(2, "0")}] C: ${childText}`);
    console.log(`     cls ${c.outcome}${c.misconceptionId ? `(${c.misconceptionId.split("-").pop()})` : ""} via ${c.source}${c.flags.dontKnow ? " · dont-know" : ""}`
      + `${d.evidence.length ? ` · evidence ${d.evidence.map((e) => `${e.probe} ${e.outcome} h${e.hintsUsed} w${e.weight}`).join("; ")}` : ""}`
      + `${Object.keys(d.skills).length ? ` · pKnown ${fmtSkills(d.skills)}` : ""} · ${d.ms} ms`);
    const m = r.move;
    console.log(`     T (${m.kind}${m.probe ? ` ${m.probe}` : ""}${m.hintLevel !== undefined ? ` rung ${m.hintLevel}` : ""}${d.guard?.rewritten ? " · guard rewrote" : ""}): ${r.teacherReply}`);
    history.push({ who: "teacher", text: r.teacherReply });
    moves.push(m);
    if (d.evidence.some((e) => e.outcome === "misconception") || c.misconceptionId) flagged = true;
    if ((m.kind === "probe" && m.probe !== "P15") || m.kind === "teachback") probes++;
    if (words(r.teacherReply) > 40) fail(`(b) turn ${i} reply is ${words(r.teacherReply)} words`);
    if (d.item && (m.hintLevel ?? 0) < 4 && m.probe !== "P2") {
      const leaked = statesKey(r.teacherReply, d.item, childText);
      if (leaked) fail(`(a) turn ${i} states the key "${leaked}" at rung ${m.hintLevel ?? 0}`);
    }
    if (r.end) { console.log("     (lesson reached its wrap)"); break; }
  }
  if (!probes) fail("(c) no probe move other than plain practice ran");
  if (!flagged) fail("(d) the misconception was never flagged");

  const endR = await api("POST", "/api/lesson/end", { lessonId: start.lessonId });
  console.log(`\nsummary: ${endR.summary}\nparent note: ${endR.parentNote}\nmemories saved: ${endR.memoriesSaved} · sessions: ${endR.sessions}`);
  const kinds = moves.reduce((acc, mv) => ({ ...acc, [mv.kind]: (acc[mv.kind] ?? 0) + 1 }), {});
  console.log(`moves: ${JSON.stringify(kinds)} · probes other than practice: ${probes} · misconception flagged: ${flagged}`);
  if (!KEEP) await api("DELETE", "/api/children", { childId: child.id });
} catch (e) {
  fail(`run aborted: ${e.message}`);
} finally {
  server?.close();
}
console.log(failures.length ? `\nFAIL (${failures.length}):\n- ${failures.join("\n- ")}` : "\nPASS: (a) no key before rung 4 · (b) all replies ≤ 40 words · (c) probe ran · (d) misconception flagged");
process.exit(failures.length ? 1 : 0);
