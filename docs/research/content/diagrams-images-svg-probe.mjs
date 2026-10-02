// diagrams-images-svg-probe.mjs — Taxila content/diagrams-images: how accurate is FREE LLM-written SVG for exact school diagrams? (2026-10-02)
// 4 quantitative diagrams x 2 deployments (taxila-brain gpt-5.6-sol @ medium, taxila-fast gpt-5.6-luna @ low) x n=3.
// Each prompt pins machine-checkable ids/classes, so truth is measured in Chromium, not judged by a model (SVG-Score/SVGEval: VLM
// judges are weakest exactly on geometry and layout). Checks: parse, unsafe constructs, geometry truth, phone legibility
// (font px after fitting the drawing into a 380-dp column), text-text overlaps, text outside the drawing.
// Usage: node --env-file=.env.local docs/research/content/diagrams-images-svg-probe.mjs
import fs from "node:fs"; import path from "node:path"; import { chromium } from "playwright";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "diagrams-images-svg-probe-2026-10-02"); fs.mkdirSync(OUT, { recursive: true });
const MODELS = [{ id: "sol-medium", dep: process.env.DEPLOY_BRAIN || "taxila-brain", effort: "medium" }, { id: "luna-low", dep: process.env.DEPLOY_FAST || "taxila-fast", effort: "low" }];
const N = 3;
const SYS = `You draw exact school diagrams as SVG for an Indian learning app used on phones (the drawing is shown 380 px wide).
Output ONLY one <svg> element with a viewBox, nothing else. Rules: every text element has font-size so that it is at least 16 px when the
viewBox width is scaled to 380 px; labels never overlap each other; nothing outside the viewBox; no <script>, no event attributes, no
external href, no <foreignObject>; dark ink #1F1A14 on white.`;
const TASKS = {
  triangle: `Triangle ABC with angle A = 50°, angle B = 60°, angle C = 70°. Side AB is horizontal at the bottom, A on the left. Draw the
vertices as <circle id="A" r="4">, <circle id="B" r="4">, <circle id="C" r="4"> placed exactly at the corners. Label the vertices A, B, C
and write each angle's measure (50°, 60°, 70°) inside the triangle near its vertex.`,
  numberline: `A horizontal number line from 0 to 2 with a tick every 1/4. Each tick is <line class="tick" data-v="VALUE"> with x1 equal to x2
(VALUE as a decimal: 0, 0.25, ... 2). Label every tick with its fraction (0, 1/4, 1/2, 3/4, 1, 5/4, 3/2, 7/4, 2). Mark point P at 3/4 with
<circle id="P" r="6"> on the line and the letter P above it.`,
  bars: `A bar chart of rainfall in Pune (mm): Jan 12, Feb 30, Mar 45, Apr 80, May 150. Vertical bars that start at a common baseline, with a
y-axis starting at 0 and a few labelled gridlines. Each bar is <rect class="bar" data-v="VALUE"> (VALUE = the mm number). Month names under
the bars; the value written on top of each bar.`,
  clock: `An analogue clock face showing the time 3:40. Numbers 1 to 12 around the dial. The centre is <circle id="centre">. The hour hand is
<line id="hour"> and the minute hand is <line id="minute">, both with x1,y1 at the centre and x2,y2 at the tip. Hands must point exactly
where they would on a real clock at 3:40.`,
};
async function call(m, task) {
  const t0 = Date.now(); const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 240000);
  try {
    const r = await fetch(`${BASE}/chat/completions`, { method: "POST", signal: ctl.signal, headers: { "api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: m.dep, reasoning_effort: m.effort, max_completion_tokens: 16000, messages: [{ role: "system", content: SYS }, { role: "user", content: TASKS[task] }] }) });
    const j = await r.json(); const txt = j.choices?.[0]?.message?.content ?? "";
    return { http: r.status, ms: Date.now() - t0, svg: (txt.match(/<svg[\s\S]*<\/svg>/) || [""])[0], out_tokens: j.usage?.completion_tokens, reasoning_tokens: j.usage?.completion_tokens_details?.reasoning_tokens ?? 0, err: r.ok ? null : JSON.stringify(j).slice(0, 200) };
  } catch (e) { return { http: 0, ms: Date.now() - t0, svg: "", err: String(e).slice(0, 120) }; } finally { clearTimeout(to); }
}
const jobs = []; for (const m of MODELS) for (const task of Object.keys(TASKS)) for (let k = 0; k < N; k++) jobs.push({ m, task, k });
const gens = []; const q = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) { const j = q.shift(); const r = await call(j.m, j.task); gens.push({ ...j, m: j.m.id, ...r }); console.log(j.m.id, j.task, j.k, r.http, r.ms, r.svg.length, r.err ?? ""); } }));

const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
const scored = [];
for (const g of gens) {
  const name = `${g.task}-${g.m}-${g.k}`; if (g.svg) fs.writeFileSync(path.join(OUT, name + ".svg"), g.svg);
  const unsafe = /<script|\son[a-z]+\s*=|<foreignObject|href\s*=\s*["'](?!#)/i.test(g.svg);
  await page.setContent(`<!doctype html><body style="margin:0;padding:16px;background:#fff"><div id="h" style="width:380px"></div></body>`);
  const s = await page.evaluate(({ svgText, task }) => {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml"); if (!svgText || doc.querySelector("parsererror")) return { parse: false };
    const h = document.getElementById("h"); h.innerHTML = svgText; const svg = h.querySelector("svg");
    svg.setAttribute("width", "380"); svg.removeAttribute("height"); svg.style.width = "380px"; svg.style.height = "auto";
    const sb = svg.getBoundingClientRect();
    const P = (el, x, y) => { const m = el.getScreenCTM(); const p = new DOMPoint(+x, +y).matrixTransform(m); return { x: p.x, y: p.y }; };
    const C = (id) => { const el = svg.querySelector(`#${id}`); return el ? P(el, el.getAttribute("cx") ?? 0, el.getAttribute("cy") ?? 0) : null; };
    const texts = [...svg.querySelectorAll("text")].filter((t) => t.textContent.trim()); const boxes = texts.map((t) => t.getBoundingClientRect());
    const fontPx = texts.map((t) => { const fs = parseFloat(getComputedStyle(t).fontSize); const m = t.getScreenCTM(); return fs * Math.hypot(m.a, m.b); });
    let overlaps = 0; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j];
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ix > 2 && iy > 2) overlaps++; }
    const outside = boxes.filter((b) => b.left < sb.left - 1 || b.right > sb.right + 1 || b.top < sb.top - 1 || b.bottom > sb.bottom + 1).length;
    const r = { parse: true, texts: texts.length, min_font_px: fontPx.length ? +Math.min(...fontPx).toFixed(1) : null, text_overlaps: overlaps, text_outside: outside };
    const ang = (o, p) => (Math.atan2(p.x - o.x, -(p.y - o.y)) * 180 / Math.PI + 360) % 360; // clockwise from 12 o'clock, screen coords
    const inner = (a, b, c) => { const v1 = [b.x - a.x, b.y - a.y], v2 = [c.x - a.x, c.y - a.y]; return Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / Math.hypot(...v1) / Math.hypot(...v2)) * 180 / Math.PI; };
    if (task === "triangle") { const A = C("A"), B = C("B"), Cc = C("C");
      if (A && B && Cc) { const a = inner(A, B, Cc), b = inner(B, A, Cc), c = inner(Cc, A, B); r.angles = [a, b, c].map((x) => +x.toFixed(1)); r.max_angle_err = +Math.max(Math.abs(a - 50), Math.abs(b - 60), Math.abs(c - 70)).toFixed(1); r.ab_level_px = +Math.abs(A.y - B.y).toFixed(1); r.correct = r.max_angle_err <= 2 && r.ab_level_px <= 2; } else r.correct = false; }
    if (task === "numberline") { const ticks = [...svg.querySelectorAll("line.tick, .tick line, line[data-v]")].map((l) => ({ v: +l.getAttribute("data-v"), x: P(l, l.getAttribute("x1"), l.getAttribute("y1")).x })).filter((t) => !isNaN(t.v));
      const Pp = C("P"); r.ticks = ticks.length;
      if (ticks.length >= 2 && Pp) { const t0 = ticks.find((t) => t.v === 0), t2 = ticks.find((t) => t.v === 2);
        if (t0 && t2) { const unit = (t2.x - t0.x) / 2; const dev = Math.max(...ticks.map((t) => Math.abs(t.x - (t0.x + t.v * unit)))); r.tick_dev_frac_of_quarter = +(dev / (unit / 4)).toFixed(3);
          r.p_err_frac_of_quarter = +(Math.abs(Pp.x - (t0.x + 0.75 * unit)) / (unit / 4)).toFixed(3); r.correct = ticks.length === 9 && r.tick_dev_frac_of_quarter <= 0.05 && r.p_err_frac_of_quarter <= 0.1; } else r.correct = false; } else r.correct = false; }
    if (task === "bars") { const bars = [...svg.querySelectorAll("rect.bar, rect[data-v]")].map((b) => { const bb = b.getBoundingClientRect(); return { v: +b.getAttribute("data-v"), h: bb.height, bottom: bb.bottom }; });
      r.bars = bars.length; if (bars.length === 5) { const k = bars.map((b) => b.h / b.v); const med = [...k].sort((a, b) => a - b)[2]; r.max_height_rel_err = +Math.max(...k.map((x) => Math.abs(x / med - 1))).toFixed(3);
        r.baseline_spread_px = +(Math.max(...bars.map((b) => b.bottom)) - Math.min(...bars.map((b) => b.bottom))).toFixed(1); r.correct = r.max_height_rel_err <= 0.02 && r.baseline_spread_px <= 1.5; } else r.correct = false; }
    if (task === "clock") { const c = C("centre"); const hand = (id) => { const l = svg.querySelector(`#${id}`); if (!l || l.tagName !== "line") return null; return { o: P(l, l.getAttribute("x1"), l.getAttribute("y1")), t: P(l, l.getAttribute("x2"), l.getAttribute("y2")) }; };
      const hh = hand("hour"), mm = hand("minute");
      if (hh && mm) { const ha = ang(hh.o, hh.t), ma = ang(mm.o, mm.t); r.hour_deg = +ha.toFixed(1); r.minute_deg = +ma.toFixed(1);
        r.hour_err = +Math.min(Math.abs(ha - 110), 360 - Math.abs(ha - 110)).toFixed(1); r.minute_err = +Math.min(Math.abs(ma - 240), 360 - Math.abs(ma - 240)).toFixed(1);
        r.hour_at_3_flag = Math.abs(ha - 90) < 3; r.correct = r.hour_err <= 3 && r.minute_err <= 3; } else r.correct = false; }
    return r;
  }, { svgText: g.svg, task: g.task });
  await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: true });
  scored.push({ name, task: g.task, model: g.m, k: g.k, http: g.http, ms: g.ms, out_tokens: g.out_tokens, reasoning_tokens: g.reasoning_tokens, bytes: g.svg.length, unsafe, ...s, err: g.err });
}
await browser.close();
const summary = {};
for (const r of scored) { const key = `${r.model}/${r.task}`; summary[key] ??= { n: 0, correct: 0, parse: 0, min_font_ok: 0, no_overlap: 0, ms: [] };
  const s = summary[key]; s.n++; s.correct += r.correct ? 1 : 0; s.parse += r.parse ? 1 : 0; s.min_font_ok += r.min_font_px >= 16 ? 1 : 0; s.no_overlap += r.text_overlaps === 0 ? 1 : 0; s.ms.push(r.ms); }
fs.writeFileSync(path.join(HERE, "diagrams-images-svg-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", n_per_cell: N, models: MODELS.map((m) => ({ id: m.id, effort: m.effort })), summary, scored }, null, 2));
console.log(JSON.stringify(summary, null, 1));
