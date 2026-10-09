// Round 3, stream relational-human: does the acknowledgement leak the VERDICT? (HV-16, docs/design/round3/relational-human
// RESEARCH.md §3.4). A child who hears her answer said back sooner, or more often, after a right answer than after a wrong
// one has been told the verdict before the teacher says it. This measures exactly that, on the real routes, with no audio:
//   - a cascade lesson against the in-process server (TAXILA_ACK=shadow: the decision without the clip);
//   - on every item turn the child's answer is RIGHT or WRONG by a seeded coin (the same items get both);
//   - the device's order: POST /api/lesson/turn-prefetch and POST /api/lesson/turn-ack on the same words at once, then
//     POST /api/lesson/turn on those words (it adopts the prefetch);
//   - per answer: did an ack come (P(ack | right) vs P(ack | wrong)) and when (route start → decision, ms).
// Typed words, no STT, no TTS: this isolates the decision's timing from transcription and synthesis (both identical for a
// right and a wrong answer of the same length by construction). Local server, US host, Neon TEST: label results so.
//
//   node <envrun> node evals/relational-human/ack-leak.mjs [--root DIR] [--answers 40] [--seed 7] [--out file.json] [--label text]
import http from "http";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const REPO = new URL("../..", import.meta.url).pathname;
const argv = process.argv;
const arg = (name, dflt) => { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : dflt; };
const ROOT = path.resolve(arg("--root", REPO)) + "/";
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
process.env.TAXILA_ACK ??= "shadow";
const ANSWERS = Number(arg("--answers", 40));
const MAX_TURNS = Number(arg("--max-turns", ANSWERS * 3));
const OUT = arg("--out");
const LABEL = arg("--label", "");
const TOPICS = String(arg("--topics", "c4-maths-ch01-t01,c4-maths-ch02-t01,c3-maths-ch01-t01")).split(",");
let seed = Number(arg("--seed", 7));
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const NUM_HL = ["shunya", "ek", "do", "teen", "chaar", "paanch", "chhe", "saat", "aath", "nau", "das", "gyaarah", "baarah", "terah", "chaudah", "pandrah", "solah", "satrah", "athaarah", "unnees", "bees"];
const spokenNums = (t) => String(t).replace(/\d+/g, (d) => (Number(d) <= 20 ? NUM_HL[Number(d)] : d));
/** A short answer to a kit item: the key, or a plausible wrong one (a number moved by 2, another option). null = no short answer. */
function itemAnswer(it, right) {
  const key = String(it.answer ?? "").trim();
  const short = key.split(/[;:.(]/)[0].trim();
  if (/\d/.test(short) && short.split(/\s+/).length <= 6) {
    if (right) return spokenNums(short.replace(/^an? /i, ""));
    return spokenNums(short.replace(/\d+/, (d) => String(Number(d) + (Number(d) > 2 ? -2 : 2))));
  }
  const opts = (it.options ?? []).map((o) => String(o.text ?? o)).filter(Boolean);
  if (short.split(/\s+/).length <= 3) {
    if (right) return short.replace(/^(an?|the) /i, "");
    const other = opts.find((o) => o.trim().toLowerCase() !== short.toLowerCase());
    return other ? other.replace(/^(an?|the) /i, "") : null;
  }
  return null;
}
function topicFacts(topicId) {
  const cls = topicId.match(/^c(\d+)-([a-z]+)-/);
  try { return JSON.parse(fs.readFileSync(`${REPO}data/kits/c${cls[1]}-${cls[2]}.json`, "utf8")).topics.find((t) => t.topicId === topicId) ?? null; }
  catch { return null; }
}

const { handle } = await import(pathToFileURL(ROOT + "server/index.js").href);
const server = http.createServer(handle);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
function client() {
  let cookie = "";
  async function api(method, p, body, expect = [200, 201]) {
    const res = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const j = res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!expect.includes(res.status)) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j).slice(0, 160)}`);
    return { ...j, __status: res.status, __why: res.headers.get("x-prefetch") };
  }
  return api;
}

const rows = [];
async function lessonOn(topicId) {
  const api = client();
  const st = Date.now(), r = Math.random().toString(36).slice(2, 8), password = `r3rh-leak-${st}-${r}`;
  await api("POST", "/api/auth/signup", { email: `r3rh-leak+${st}${r}@taxila.test`, password, name: "Leak", isGuardianAdult: true });
  const { child } = await api("POST", "/api/children", { firstName: "Aarav", classLevel: Number(topicId.match(/^c(\d+)/)[1]), languagePref: "hinglish" });
  try {
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade", topicId });
    const topic = topicFacts(topicId);
    let move = s.debug?.move;
    for (let t = 0; t < MAX_TURNS && rows.length < ANSWERS; t++) {
      const it = move?.itemId ? topic?.items?.find((i) => i.id === move.itemId) : null;
      const right = rnd() < 0.5;
      const a = it ? itemAnswer(it, right) : null;
      const text = a ? `${a[0].toUpperCase()}${a.slice(1)}.` : "Haan didi, samajh gaya.";
      const t0 = performance.now();
      const pf = api("POST", "/api/lesson/turn-prefetch", { lessonId: s.lessonId, text }, [200, 204]).catch((e) => ({ __status: 0, __why: e.message }));
      const ack = api("POST", "/api/lesson/turn-ack", { lessonId: s.lessonId, text }, [200, 204]).then((j) => ({ ...j, at: performance.now() - t0 })).catch((e) => ({ __status: 0, __why: e.message }));
      await pf;
      const turn = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText: text, typed: false, turnSeq: t + 1 });
      const k = await ack;
      if (a) {
        const cls = turn.debug?.classification;
        rows.push({ topicId, item: it.id, intended: right ? "right" : "wrong", text, outcome: cls?.outcome ?? null, source: cls?.source ?? null,
          ack: k.__status === 200, why: k.__status === 200 ? null : k.__why, phrase: k.ack?.phrase ?? null, decidedMs: k.ack?.decidedMs ?? null, routeMs: Math.round(k.at ?? 0),
          prefetched: !!turn.debug?.prefetch?.adopted });
        const x = rows.at(-1);
        console.log(`${rows.length}. ${it.id} ${x.intended} "${text}" → ${x.outcome}/${x.source} ack ${x.ack ? `"${x.phrase}" decided ${x.decidedMs} ms` : x.why} route ${x.routeMs} ms`);
      }
      move = turn.move;
      if (turn.end) break;
    }
  } finally {
    await api("DELETE", "/api/account", { password, confirm: true }).catch(() => {});
  }
}

try {
  for (const tp of TOPICS) { if (rows.length >= ANSWERS) break; await lessonOn(tp).catch((e) => console.log(`[${tp}] failed: ${e.message}`)); }
} finally { server.close(); }

// the verdict the CHILD would infer from is the graded outcome (the classify's), not the harness's intent
const graded = (o) => ["correct", "incorrect", "partial", "misconception"].includes(o);
const R = rows.filter((r) => r.outcome === "correct"), W = rows.filter((r) => graded(r.outcome) && r.outcome !== "correct");
const pct = (a, p) => { const s = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const dist = (a) => ({ n: a.filter(Number.isFinite).length, p10: pct(a, 0.1), p50: pct(a, 0.5), p90: pct(a, 0.9), max: pct(a, 1) });
// Wilson interval for a proportion
const wilson = (k, n) => { if (!n) return null; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [+((c - m) / d).toFixed(2), +((c + m) / d).toFixed(2)]; };
/** Standard normal CDF (Abramowitz & Stegun 7.1.26 erf, |error| < 1.5e-7). */
function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
// Mann-Whitney U (two-sided, normal approximation, no tie correction) on decision times
function mwu(a, b) {
  const xs = [...a.map((v) => ({ v, g: 0 })), ...b.map((v) => ({ v, g: 1 }))].sort((p, q) => p.v - q.v);
  let r1 = 0; for (let i = 0; i < xs.length; i++) if (xs[i].g === 0) r1 += i + 1;
  const n1 = a.length, n2 = b.length; if (!n1 || !n2) return null;
  const u = r1 - n1 * (n1 + 1) / 2, mu = n1 * n2 / 2, sd = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
  const z = (u - mu) / sd; const p = 2 * (1 - normCdf(Math.abs(z)));
  return { u, z: +z.toFixed(2), pApprox: +p.toFixed(3), aucRightFaster: +(1 - u / (n1 * n2)).toFixed(2) };
}
const rT = R.filter((r) => r.ack).map((r) => r.decidedMs), wT = W.filter((r) => r.ack).map((r) => r.decidedMs);
const summary = {
  label: LABEL, at: new Date().toISOString(), root: ROOT, ackMode: process.env.TAXILA_ACK, floorMs: process.env.TAXILA_ACK_FLOOR_MS ?? "default", ceilMs: process.env.TAXILA_ACK_CEIL_MS ?? "default",
  answers: rows.length, right: R.length, wrong: W.length,
  pAckRight: { k: R.filter((r) => r.ack).length, n: R.length, ci: wilson(R.filter((r) => r.ack).length, R.length) },
  pAckWrong: { k: W.filter((r) => r.ack).length, n: W.length, ci: wilson(W.filter((r) => r.ack).length, W.length) },
  decidedRight: dist(rT), decidedWrong: dist(wT), mannWhitney: mwu(rT, wT),
  refusals: rows.filter((r) => !r.ack).reduce((m, r) => ((m[`${r.outcome === "correct" ? "right" : "wrong"}:${r.why}`] = (m[`${r.outcome === "correct" ? "right" : "wrong"}:${r.why}`] ?? 0) + 1), m), {}),
  bySource: rows.reduce((m, r) => ((m[`${r.outcome}/${r.source}`] = (m[`${r.outcome}/${r.source}`] ?? 0) + 1), m), {}),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1));
process.exit(0);
