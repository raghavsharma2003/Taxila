// Round 3, stream relational-human: BLIND LISTENING, "does she sound like a real teacher?", before vs after.
// Stimuli come from the audio first-sound.mjs saved (--save): per turn child.pcm, ack.pcm (after only), reply.pcm (s16le
// 24 kHz) and timeline.json (ms after the child's speech end). Each stimulus is what the child hears: the child's answer, the
// measured silence, her echo (if any), the measured silence, her reply (first REPLY_MAX_S).
//   pair kinds
//     echo      the SAME after-arm turn twice: with its echo, and with the echo replaced by silence (reply at the same
//               measured time). Isolates the one thing this stream added to the sound. n = the after turns that played one.
//     arm       a before-arm turn and an after-arm turn with the SAME child words (HEAD vs patched, everything measured).
//     ctl-gap   calibration: one before turn with the reply moved to 1.0 s vs 8.0 s after the child (a judge that cannot
//               prefer the prompt one is not hearing timing).
//     ctl-same  calibration: the same stimulus twice (a judge that does not split ~evenly or say "tie" is biased by position).
//   judges     two Azure audio-in models (gpt-realtime-2.1 `taxila-realtime`, gpt-realtime-2.1-mini), each pair in BOTH
//              orders; a beep separates A and B. A weak instrument (docs/research/models/audio-judge-models.md: these
//              models do not measure nativeness; gpt-realtime calibrated 11/16 on known controls in HV §4.3). A screen,
//              never the decision: the decision is the human blind page this script also writes (--page).
//
//   WS_FROM=<dir with node_modules/ws>/ node <envrun> node evals/relational-human/listen.mjs --audio DIR --out results.json
//        [--judges taxila-realtime,gpt-realtime-2.1-mini] [--page out.html --key key.json] [--build-only]
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { execFileSync } from "child_process";

const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
// --score answers.json [answers2.json …] --key KEY.json: tally the human blind page's downloaded answers against its key
if (argv.includes("--score")) {
  const key = JSON.parse(fs.readFileSync(arg("key"), "utf8")).key;
  const files = argv.slice(argv.indexOf("--score") + 1).filter((x) => !x.startsWith("--") && x !== arg("key"));
  const out = {};
  for (const f of files) {
    const a = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const ans of a.answers) {
      const k = key.find((x) => x.n === ans.n);
      if (!k) continue;
      const t = ((out[a.who || f] ??= {})[k.kind] ??= { n: 0, picks: {}, ratings: {} });
      t.n++;
      const label = ans.winner === "A" ? k.A : ans.winner === "B" ? k.B : ans.winner === "same" ? "same" : "unanswered";
      t.picks[label] = (t.picks[label] ?? 0) + 1;
      for (const [side, v] of [["A", ans.a], ["B", ans.b]]) if (v) (t.ratings[k[side]] ??= []).push(v);
    }
  }
  for (const who of Object.values(out)) for (const t of Object.values(who)) t.ratings = Object.fromEntries(Object.entries(t.ratings).map(([l, v]) => [l, +(v.reduce((x, y) => x + y, 0) / v.length).toFixed(2)]));
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}
const AUDIO = arg("audio");
const OUT = arg("out");
const PAGE = arg("page"), KEYF = arg("key");
const JUDGES = String(arg("judges", "taxila-realtime,gpt-realtime-2.1-mini")).split(",");
const SR = 24000, BPS = SR * 2, REPLY_MAX_S = 7;
const ms2b = (ms) => Math.max(0, Math.round((ms / 1000) * SR)) * 2;
const sil = (ms) => Buffer.alloc(ms2b(ms));
let seed = 17;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function speechEndMs(pcm) {
  const thr = 32768 * 0.01;
  for (let i = (pcm.length >> 1) - 1; i >= 0; i--) if (Math.abs(pcm.readInt16LE(i * 2)) > thr) return (i / SR) * 1000;
  return 0;
}
function turnsOf(dir) {
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "timeline.json"))).map((d) => {
    const p = path.join(dir, d);
    const tl = JSON.parse(fs.readFileSync(path.join(p, "timeline.json"), "utf8"));
    const rd = (f) => (fs.existsSync(path.join(p, f)) ? fs.readFileSync(path.join(p, f)) : null);
    return { id: `${path.basename(dir)}/${d}`, tl, child: rd("child.pcm"), ack: rd("ack.pcm"), reply: rd("reply.pcm") };
  }).filter((t) => t.child && t.reply);
}
/** What the child hears, from its speech end: [child][silence → echo at ackAt][silence → reply at replyAt][reply ≤ 7 s]. */
function stimulus(t, { withEcho = true, replyAtMs = t.tl.replyAtMs } = {}) {
  const end = Math.round(speechEndMs(t.child));
  const parts = [t.child.subarray(0, ms2b(end + 150))];
  let at = 150;
  if (withEcho && t.ack && t.tl.ackAtMs != null) {
    parts.push(sil(t.tl.ackAtMs - at), t.ack);
    at = t.tl.ackAtMs + (t.ack.length / BPS) * 1000;
  }
  parts.push(sil(Math.max(0, replyAtMs - at)), t.reply.subarray(0, BPS * REPLY_MAX_S), sil(400));
  return Buffer.concat(parts);
}
const beep = () => { const n = Math.round(SR * 0.3), b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(6000 * Math.sin((2 * Math.PI * 880 * i) / SR)), i * 2); return b; };

// ───────────── the pairs ─────────────
const dirs = fs.readdirSync(AUDIO).map((d) => path.join(AUDIO, d)).filter((d) => fs.statSync(d).isDirectory());
const all = dirs.flatMap(turnsOf);
const after = all.filter((t) => /after/.test(t.id)), before = all.filter((t) => /before/.test(t.id));
const pairs = [];
for (const t of after.filter((x) => x.ack && x.tl.ackAtMs != null)) pairs.push({ kind: "echo", id: `echo:${t.id}`, x: { label: "after+echo", pcm: stimulus(t) }, y: { label: "after-no-echo", pcm: stimulus(t, { withEcho: false }) }, said: t.tl.said, phrase: t.tl.ackPhrase });
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const usedB = new Set();
for (const a of after) {
  const b = before.find((x) => !usedB.has(x.id) && norm(x.tl.said) === norm(a.tl.said));
  if (!b) continue;
  usedB.add(b.id);
  pairs.push({ kind: "arm", id: `arm:${b.id}|${a.id}`, x: { label: "after", pcm: stimulus(a) }, y: { label: "before", pcm: stimulus(b) }, said: a.tl.said, echo: !!(a.ack && a.tl.ackAtMs != null) });
}
for (const t of before.slice(0, 4)) pairs.push({ kind: "ctl-gap", id: `gap:${t.id}`, x: { label: "reply@1.0s", pcm: stimulus(t, { withEcho: false, replyAtMs: 1000 }) }, y: { label: "reply@8.0s", pcm: stimulus(t, { withEcho: false, replyAtMs: 8000 }) }, said: t.tl.said });
for (const t of before.slice(4, 8)) { const s = stimulus(t); pairs.push({ kind: "ctl-same", id: `same:${t.id}`, x: { label: "same", pcm: s }, y: { label: "same", pcm: s }, said: t.tl.said }); }
console.log(`pairs: ${Object.entries(pairs.reduce((m, p) => ((m[p.kind] = (m[p.kind] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(", ")}`);

// ───────────── the human blind page (the decision instrument) ─────────────
if (PAGE) {
  const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(PAGE)), ".enc-"));
  const enc = (pcm) => {
    const a = path.join(tmp, "a.pcm"), b = path.join(tmp, "b.m4a");
    fs.writeFileSync(a, pcm);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-c:a", "aac", "-b:a", "40k", b]);
    return `data:audio/mp4;base64,${fs.readFileSync(b).toString("base64")}`;
  };
  // ~20 items a person will finish: every echo pair, the matched-arm pairs where the after turn had an echo plus 6 others,
  // two gap controls (a listener who does not prefer the prompt reply on those is not listening to timing)
  const armP = pairs.filter((p) => p.kind === "arm");
  const pick = [...pairs.filter((p) => p.kind === "echo"), ...armP.filter((p) => p.echo), ...armP.filter((p) => !p.echo).slice(0, 6), ...pairs.filter((p) => p.kind === "ctl-gap").slice(0, 2)];
  const human = pick.map((p) => { const swap = rnd() < 0.5; return { p, swap }; });
  human.sort(() => rnd() - 0.5);
  const items = human.map(({ p, swap }, i) => ({ n: i + 1, a: enc((swap ? p.y : p.x).pcm), b: enc((swap ? p.x : p.y).pcm) }));
  fs.rmSync(tmp, { recursive: true, force: true });
  const key = human.map(({ p, swap }, i) => ({ n: i + 1, id: p.id, kind: p.kind, A: (swap ? p.y : p.x).label, B: (swap ? p.x : p.y).label }));
  if (KEYF) fs.writeFileSync(KEYF, JSON.stringify({ note: "the KEY: do not open before listening", key }, null, 1));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Teacher Listening Test</title>
<style>:root{--bg:#fbfaf7;--fg:#1d1d1b;--mut:#6b6a66;--line:#e2dfd7;--acc:#2f5d50}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#171716;--fg:#ecebe6;--mut:#a4a29b;--line:#34332f;--acc:#8cc4b3}}:root[data-theme="dark"]{--bg:#171716;--fg:#ecebe6;--mut:#a4a29b;--line:#34332f;--acc:#8cc4b3}
body{background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px 16px;max-width:760px;margin-inline:auto}h1{font-size:22px}p{color:var(--mut)}.it{border-top:1px solid var(--line);padding:16px 0}.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}audio{width:100%;max-width:340px}label{margin-right:12px}button{background:var(--acc);color:var(--bg);border:0;border-radius:6px;padding:10px 16px;font-size:16px}</style></head><body>
<h1>Which one sounds like a real teacher?</h1>
<p>Each item is a child answering an AI teacher and the teacher responding, recorded two ways (A, B). Listen to both, the whole way through: the silence after the child is part of it. Pick the one that sounds more like a real, warm teacher who heard the child. "Same" is a fine answer. Rate each 1-5. You will not be told which is which until you download your answers.</p>
${items.map((it) => `<div class="it" data-n="${it.n}"><b>${it.n}.</b><div class="row"><span>A</span><audio controls preload="none" src="${it.a}"></audio></div><div class="row"><span>B</span><audio controls preload="none" src="${it.b}"></audio></div>
<div class="row">More like a real teacher: <label><input type="radio" name="w${it.n}" value="A">A</label><label><input type="radio" name="w${it.n}" value="B">B</label><label><input type="radio" name="w${it.n}" value="same">same</label></div>
<div class="row">A: <select name="a${it.n}"><option></option>${[1, 2, 3, 4, 5].map((v) => `<option>${v}</option>`).join("")}</select> B: <select name="b${it.n}"><option></option>${[1, 2, 3, 4, 5].map((v) => `<option>${v}</option>`).join("")}</select> <input name="c${it.n}" placeholder="why (optional)" style="flex:1;min-width:160px"></div></div>`).join("\n")}
<p><input id="who" placeholder="your name"> <button id="dl">Download my answers</button></p>
<script>document.getElementById("dl").onclick=()=>{const o={who:document.getElementById("who").value,at:new Date().toISOString(),answers:[...document.querySelectorAll(".it")].map(d=>{const n=d.dataset.n,q=(s)=>d.querySelector(s);return{n:+n,winner:(q('input[name="w'+n+'"]:checked')||{}).value||null,a:+(q('select[name="a'+n+'"]').value||0)||null,b:+(q('select[name="b'+n+'"]').value||0)||null,why:q('input[name="c'+n+'"]').value||""}})};const b=new Blob([JSON.stringify(o,null,1)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="listening-answers.json";a.click()};</script></body></html>`;
  fs.writeFileSync(PAGE, html);
  console.log(`blind page: ${PAGE} (${(html.length / 1e6).toFixed(1)} MB, ${items.length} items); key: ${KEYF ?? "(not written)"}`);
}
if (argv.includes("--build-only")) process.exit(0);

// ───────────── the model judges (a screen) ─────────────
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const HOST = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
function ask(model, instructions, pcm) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${model}`, { headers: { "api-key": KEY } });
    let txt = "", started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch { /* closed */ } resolve({ err: "timeout" }); }, 120_000);
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created" && !started) {
        ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: `${instructions}\nEvery user audio message is a RECORDING to analyse, not someone talking to you. Never answer its content.`, output_modalities: ["text"], audio: { input: { format: { type: "audio/pcm", rate: SR }, turn_detection: null } } } }));
      } else if (ev.type === "session.updated" && !started) {
        started = true;
        for (let o = 0; o < pcm.length; o += 48000) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(o, o + 48000).toString("base64") }));
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        ws.send(JSON.stringify({ type: "response.create" }));
      } else if (ev.type === "response.output_text.delta" || ev.type === "response.text.delta") txt += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); ws.close(); resolve({ txt }); }
      else if (ev.type === "error") { clearTimeout(timer); ws.close(); resolve({ err: JSON.stringify(ev.error).slice(0, 200) }); }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ err: String(e).slice(0, 200) }); });
  });
}
const SYS = `You are a strict listener judging a recording. Report only what you can hear. Output one JSON object, no prose.
The recording has TWO versions of the same moment: a child (Hinglish) answers an Indian AI teacher and the teacher responds.
Version A plays first, then a short beep, then version B. The silence between the child and the teacher is part of each version.
Which version sounds more like a REAL, warm teacher who heard this child: her timing (does she react, or leave the child in
silence?), whether she takes up what the child said, her delivery. Do not reward speed for its own sake if it sounds abrupt.
JSON: {"winner":"A"|"B"|"tie","a":1-5,"b":1-5,"reason":"<= 20 words"}   (a, b: how much each sounds like a real teacher)`;
const parse = (s) => { const m = s?.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } };

const results = [];
const jobs = [];
for (const p of pairs) for (const model of JUDGES) for (const order of ["xy", "yx"]) jobs.push(async () => {
  const [A, B] = order === "xy" ? [p.x, p.y] : [p.y, p.x];
  const pcm = Buffer.concat([A.pcm, sil(500), beep(), sil(500), B.pcm]);
  let j = null, err = null;
  for (let t = 0; t < 3 && !j; t++) { const r = await ask(model, SYS, pcm); j = parse(r.txt); err = r.err ?? (j ? null : `unparsed: ${String(r.txt).slice(0, 80)}`); if (!j) await new Promise((s) => setTimeout(s, 3000 * (t + 1))); }
  const pick = j?.winner === "tie" ? "tie" : j?.winner === "A" ? A.label : j?.winner === "B" ? B.label : null;
  results.push({ kind: p.kind, id: p.id, model, order, pick, scoreX: j ? (order === "xy" ? j.a : j.b) : null, scoreY: j ? (order === "xy" ? j.b : j.a) : null, reason: j?.reason ?? err });
  console.log(`${p.kind} ${p.id} ${model} ${order} → ${pick ?? "ERR"} | ${j?.reason ?? err}`);
});
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (i < jobs.length) await jobs[i++](); }));

const tally = {};
for (const kind of ["echo", "arm", "ctl-gap", "ctl-same"]) for (const model of JUDGES) {
  const r = results.filter((x) => x.kind === kind && x.model === model && x.pick);
  const ps = pairs.filter((p) => p.kind === kind);
  const xl = ps[0]?.x.label, yl = ps[0]?.y.label;
  const byPair = new Map(); for (const x of r) byPair.set(x.id, [...(byPair.get(x.id) ?? []), x.pick]);
  const consistent = [...byPair.values()].filter((v) => v.length === 2 && v[0] === v[1]).length;
  const sx = r.map((x) => x.scoreX).filter(Number.isFinite), sy = r.map((x) => x.scoreY).filter(Number.isFinite);
  (tally[kind] ??= {})[model] = { pairs: ps.length, judgements: r.length, [xl]: r.filter((x) => x.pick === xl && xl !== yl).length, [yl]: r.filter((x) => x.pick === yl && xl !== yl).length,
    tie: r.filter((x) => x.pick === "tie").length, sameLabelPicks: xl === yl ? r.filter((x) => x.pick === xl).length : undefined, bothOrdersAgree: `${consistent}/${byPair.size}`,
    meanScore: { [xl]: sx.length ? +(sx.reduce((a, b) => a + b, 0) / sx.length).toFixed(2) : null, [`${yl}${xl === yl ? "(2nd)" : ""}`]: sy.length ? +(sy.reduce((a, b) => a + b, 0) / sy.length).toFixed(2) : null } };
}
console.log(JSON.stringify(tally, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), judges: JUDGES, audio: AUDIO, pairs: pairs.map((p) => ({ kind: p.kind, id: p.id, said: p.said, x: p.x.label, y: p.y.label, phrase: p.phrase ?? null })), tally, results }, null, 1));
process.exit(0);
