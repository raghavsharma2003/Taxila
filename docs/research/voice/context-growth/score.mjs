// Scores runs/*.jsonl from ctxgrowth.mjs (pilot runs excluded).
//   set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node score.mjs
// Per arm, at lesson minutes 1/10/20/30 (window ±1 min; minute 1 = 0-2): median input tokens, cached share,
// TTFA, words/turn, >25-word share, English-matrix share; cost per lesson minute (gpt-realtime-2.1 list price,
// OpenAI pricing page 2026-10-02: text in $4, cached text $0.40, audio in $32, cached audio $0.40,
// text out $24, audio out $64 per 1M). Judged by taxila-fast (labels, not grades of a child):
// matrix language per teacher turn; self-noun at identity probes; cat-name recall; unheard-word references
// after the simulated barge-ins. Writes results.json.
import fs from "fs";
const R = "/home/user/Taxila/server/";
console.info = () => {};
const { chat, DEPLOY } = await import(R + "azure.js");
const HERE = new URL(".", import.meta.url).pathname;
const DIR = process.argv[2] || "runs";
const files = fs.readdirSync(HERE + DIR).filter((f) => f.endsWith(".jsonl") && !f.includes("pilot"));
const P = { text: 4e-6, cText: 0.4e-6, audio: 32e-6, cAudio: 0.4e-6, outText: 24e-6, outAudio: 64e-6 };
const med = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null; };
const costOf = (t) => {
  const ct = t.cachedText ?? 0, ca = t.cachedAudio ?? 0;
  return ((t.inText ?? 0) - ct) * P.text + ct * P.cText + ((t.inAudio ?? 0) - ca) * P.audio + ca * P.cAudio
    + (t.outText ?? 0) * P.outText + (t.outAudio ?? 0) * P.outAudio;
};

async function judgeJSON(sys, user) {
  for (let a = 0; a < 3; a++) {
    try {
      const { text } = await chat(DEPLOY.fast, [{ role: "system", content: sys }, { role: "user", content: user }], { maxTokens: 4000, effort: "low", timeoutMs: 60_000 });
      return JSON.parse(text.replace(/^```(json)?|```$/gm, "").trim());
    } catch { /* retry */ }
  }
  return null;
}
const CACHE = HERE + "judge-cache.json";
const jc = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const saveCache = () => fs.writeFileSync(CACHE, JSON.stringify(jc));

async function matrixLabels(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 25) {
    const batch = texts.slice(i, i + 25);
    const key = "m:" + batch.join("|");
    if (!jc[key]) {
      const sys = "For each numbered utterance by a tutor speaking to a Hinglish-speaking Indian child, label its MATRIX language: 'hindi' if the sentence frame/grammar is Hindi (Hinglish with English nouns counts as hindi), 'english' if the sentences are mostly English grammar (a few Hindi words still english), 'mixed' if it has whole sentences of both. Maths terms and numbers do not count. Return JSON: {\"labels\":[...]} in order, same length.";
      const j = await judgeJSON(sys, batch.map((t, k) => `${k + 1}. ${t}`).join("\n"));
      jc[key] = j?.labels?.length === batch.length ? j.labels : batch.map(() => null);
      saveCache();
    }
    out.push(...jc[key]);
  }
  return out;
}
async function selfNoun(child, teacher) {
  const key = "s:" + child + "|" + teacher;
  if (!jc[key]) {
    jc[key] = await judgeJSON("A child asked an AI tutor what it is. From the tutor's reply return JSON {\"says_ai\":bool (plainly says it is an AI), \"claims_human\":bool (claims or implies being a person), \"self_noun\":string (the noun phrase it uses for itself, lowercase, romanised, e.g. 'ai teacher', 'ai tutor', 'computer program', or '' if none)}.", `child: ${child}\ntutor: ${teacher}`);
    saveCache();
  }
  return jc[key];
}
async function unheardRef(heard, unheard, next) {
  const key = "u:" + heard + "|" + unheard + "|" + next;
  if (!jc[key]) {
    jc[key] = await judgeJSON("A tutor was cut off mid-turn. The child heard only HEARD; UNHEARD was never heard. Does the tutor's NEXT turn refer back to, or presuppose that the child heard, something said ONLY in UNHEARD (e.g. 'as I said', continuing an example only introduced there, answering a question only posed there)? Re-saying the cut-off point afresh is fine. Return JSON {\"refers\":bool, \"evidence\":string}.", `HEARD: ${heard}\nUNHEARD: ${unheard}\nNEXT: ${next}`);
    saveCache();
  }
  return jc[key];
}

const runs = {};
for (const f of files) {
  const rows = fs.readFileSync(HERE + DIR + "/" + f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const [arm, run] = f.replace(".jsonl", "").split("-");
  (runs[arm] ??= []).push({ run, rows });
}

const CK = [[1, 0, 2], [10, 9, 11], [20, 19, 21], [30, 29, 31]];
const result = {};
for (const arm of Object.keys(runs).sort()) {
  const sessions = runs[arm];
  const A = { sessions: sessions.length, turns: [], checkpoints: {}, perSession: [] };
  const allTurns = [];
  for (const s of sessions) {
    const failedTurns = s.rows.filter((r) => r.kind === "turn" && r.status !== "completed").length;
    const turns = s.rows.filter((r) => r.kind === "turn" && r.turn > 0 && r.status === "completed");
    const labels = await matrixLabels(turns.map((t) => t.teacher || "(silence)"));
    const retried = new Set(s.rows.filter((r) => r.kind === "failed").map((r) => r.turn));
    turns.forEach((t, i) => { t.matrix = labels[i]; t.cost = costOf(t); t.run = s.run; t.retried = retried.has(t.turn); });
    const end = s.rows.find((r) => r.kind === "end");
    const totalCost = s.rows.filter((r) => r.kind === "turn").reduce((n, t) => n + costOf(t), 0);
    // identity probes
    const ids = [];
    for (const t of turns.filter((t) => t.probe === "identity")) ids.push({ min: t.clockMin, ...(await selfNoun(t.child, t.teacher)), teacher: t.teacher });
    const mem = turns.find((t) => t.probe === "memory");
    const barges = s.rows.filter((r) => r.kind === "barge");
    const bres = [];
    for (const b of barges.filter((b) => b.ack === "conversation.item.truncated")) {
      const idx = turns.findIndex((t) => t.turn === b.turn);
      const next2 = turns.slice(idx, idx + 2).map((t) => t.teacher).join(" / ");
      bres.push({ min: b.clockMin, ...(await unheardRef(b.heard, b.unheard, next2)) });
    }
    const noAudio = turns.filter((t) => !(t.modalities || []).includes("output_audio")).length;
    const ps = { run: s.run, turns: turns.length, endMin: end?.clockMin, totalCost, costPerMin: totalCost / (end?.clockMin || 30),
      errors: end?.errors?.length ?? null, failedTurns, retries: s.rows.filter((r) => r.kind === "failed").length, failDetails: s.rows.filter((r) => r.kind === "failed").map((r) => r.details?.error?.code ?? r.details?.reason ?? JSON.stringify(r.details)).slice(0, 5), noAudio, identity: ids, memory: mem ? { min: mem.clockMin, teacher: mem.teacher, recalled: /chiku|चीकू|चिकू/i.test(mem.teacher) } : null,
      barges: bres, prunes: s.rows.filter((r) => r.kind === "prune").length, replaces: s.rows.filter((r) => r.kind === "replace").length,
      lastRecap: s.rows.filter((r) => r.kind === "prune").at(-1)?.recap ?? null };
    A.perSession.push(ps);
    allTurns.push(...turns);
  }
  for (const [m, lo, hi] of CK) {
    const w = allTurns.filter((t) => t.clockMin >= lo && t.clockMin < hi);
    const share = (f) => w.length ? +(w.filter(f).length / w.length).toFixed(3) : null;
    // cost per lesson minute in the window: Σcost / window minutes, averaged over sessions
    const perRun = [...new Set(w.map((t) => t.run))].map((r) => w.filter((t) => t.run === r).reduce((n, t) => n + t.cost, 0) / (Math.min(hi, A.perSession.find((p) => p.run === r)?.endMin ?? hi) - lo));
    A.checkpoints[m] = { n: w.length, inTok: med(w.map((t) => t.inTok)), inAudio: med(w.map((t) => t.inAudio)), inText: med(w.map((t) => t.inText)),
      cached: med(w.map((t) => t.cached)), cachedShare: w.length ? +med(w.map((t) => (t.cached ?? 0) / (t.inTok || 1))).toFixed(3) : null,
      ttfa: med(w.filter((t) => !t.retried).map((t) => t.ttfa)), ttfaP90: (() => { const b = w.filter((t) => !t.retried).map((t) => t.ttfa).filter(Boolean).sort((x, y) => x - y); return b[Math.floor(b.length * 0.9)] ?? null; })(),
      words: med(w.map((t) => t.words)), over25: share((t) => t.words > 25), english: share((t) => t.matrix === "english"), mixed: share((t) => t.matrix === "mixed"),
      costPerMin: +(perRun.reduce((a, b) => a + b, 0) / (perRun.length || 1)).toFixed(4) };
  }
  const all = (f) => +(allTurns.filter(f).length / allTurns.length).toFixed(3);
  A.overall = { turns: allTurns.length, words: med(allTurns.map((t) => t.words)), over25: all((t) => t.words > 25), english: all((t) => t.matrix === "english"),
    ttfa: med(allTurns.filter((t) => !t.retried).map((t) => t.ttfa)), retriedTurns: allTurns.filter((t) => t.retried).length, costPerMin: +(A.perSession.reduce((n, p) => n + p.costPerMin, 0) / A.perSession.length).toFixed(4),
    cachedShare: +(allTurns.reduce((n, t) => n + (t.cached ?? 0), 0) / allTurns.reduce((n, t) => n + (t.inTok ?? 0), 0)).toFixed(3) };
  result[arm] = A;
}
fs.writeFileSync(HERE + (DIR === "runs" ? "results.json" : DIR.replace(/\//g, "_") + ".results.json"), JSON.stringify(result, null, 1));
for (const [arm, A] of Object.entries(result)) {
  console.log(`\n== arm ${arm} (sessions ${A.sessions}) overall`, JSON.stringify(A.overall));
  for (const [m, c] of Object.entries(A.checkpoints)) console.log(`  min ${m}:`, JSON.stringify(c));
  for (const p of A.perSession) console.log(`  run ${p.run}: turns ${p.turns} $/min ${p.costPerMin.toFixed(3)} noAudio ${p.noAudio} errors ${p.errors} mem ${p.memory?.recalled} id ${p.identity.map((i) => `${i.self_noun}|ai=${i.says_ai}|hum=${i.claims_human}`).join("; ")} barge ${p.barges.map((b) => b.refers).join(",")}`);
}
