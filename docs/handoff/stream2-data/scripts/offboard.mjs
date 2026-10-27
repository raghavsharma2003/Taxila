import fs from "node:fs"; import path from "node:path";
import { syncedWithLine } from "/home/user/Taxila/server/studio/request.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const STOP = new Set("the and with this that from have what kya hai hain aur mein main kaise kitne kitna dekho dekhiye socho batao bataiye boliye bolkar ab phir yeh woh iska uska aap tum apna aapka tumhara sahi bilkul haan".split(" "));
const content = (s) => (String(s).match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));
const N = Number(process.argv[2] ?? 6);
let rung = [0, 0], page = [0, 0]; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const turns = new Map((r.turns ?? []).map((t) => [t.n, t]));
  for (const t of r.turns ?? []) for (const c of t.moduleCommands ?? []) {
    if (c.op !== "mount" || c.engine !== "explainer@1" || !c.params?.script || !t.teacher) continue;
    if (content(t.teacher).length < N) continue;
    rung[0]++;
    if (!syncedWithLine(c.params.script, t.teacher)) { rung[1]++; ex.push({ src: "rung", f: path.basename(f).slice(0, 26), n: t.n, k: t.move?.kind, texts: c.params.script.ops.filter((o) => o.text).map((o) => o.text).join("|").slice(0, 60), line: t.teacher.slice(0, 120) }); }
  }
  for (const p of r.boardPages ?? []) {
    const n = Number(String(p.intentId ?? "").split(":wb:")[1]); const t = turns.get(n); if (!t?.teacher) continue;
    const texts = (String(p.board ?? "").match(/"([^"]*)"/g) ?? []).map((x) => x.slice(1, -1)); if (!texts.length) continue;
    if (content(t.teacher).length < N) continue;
    page[0]++;
    const script = { ops: texts.map((x, i) => ({ id: "t" + i, op: "text", text: x })) };
    if (!syncedWithLine(script, t.teacher)) { page[1]++; if (/2183c32|rel143/.test(f)) ex.push({ src: "page", f: path.basename(f).slice(0, 26), n, k: t.move?.kind, texts: texts.join("|").slice(0, 60), line: t.teacher.slice(0, 120) }); }
  }
}
console.log(JSON.stringify({ minContentWords: N, rung, studioPage: page }));
for (const e of ex) console.log(JSON.stringify(e));
