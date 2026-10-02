// Model bake-off across the Azure-billed Foundry catalogue (owner: "use open models where they win").
// Three Taxila tasks, every model on the same inputs, scored by code (and a vision judge for diagrams):
//   A. interactive diagram generation (self-contained HTML/SVG/JS, rendered offline in Chromium)
//   B. live teacher reply (Hinglish, turn-shape rule last) — latency, words, language mirroring
//   C. answer classification against a verified key (JSON) — accuracy vs hand labels
// Usage: NODE_USE_ENV_PROXY=1 node evals/model-bakeoff.mjs [A|B|C|all] [n]
// Writes evals/results/model-bakeoff-<date>.json and screenshots under evals/results/bakeoff-shots/.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const E = process.env.AZURE_OPENAI_ENDPOINT, K = process.env.AZURE_OPENAI_API_KEY;
const which = process.argv[2] || "all", N = Number(process.argv[3] || 2);
const OUT = ROOT + "evals/results/"; mkdirSync(OUT + "bakeoff-shots", { recursive: true });

// gpt-5.x family need max_completion_tokens; codex only speaks the Responses API.
const MODELS = {
  "taxila-fast": "gpt5", "taxila-brain": "gpt5", "taxila-codex": "responses",
  "DeepSeek-V4-Flash": "chat", "taxila-ds41": "chat", "DeepSeek-V4-Pro": "chat",
  "taxila-kimi-code": "chat", "taxila-oss120": "chat", "taxila-grok46": "chat",
  "grok-4-1-fast-non-reasoning": "chat", "Mistral-Large-3": "chat",
};

async function call(model, messages, { maxTokens = 2000, json = false, timeoutMs = 180000 } = {}) {
  const kind = MODELS[model]; const t0 = performance.now();
  const ctl = AbortSignal.timeout(timeoutMs);
  try {
    if (kind === "responses") {
      const r = await fetch(`${E}/responses`, { method: "POST", signal: ctl, headers: { "api-key": K, "content-type": "application/json" },
        body: JSON.stringify({ model, input: messages.map((m) => ({ role: m.role, content: m.content })), max_output_tokens: maxTokens, ...(json ? { text: { format: { type: "json_object" } } } : {}) }) });
      const d = await r.json();
      const text = (d.output || []).flatMap((o) => o.content || []).filter((c) => c.type === "output_text").map((c) => c.text).join("");
      return { text, ms: Math.round(performance.now() - t0), outTok: d.usage?.output_tokens, err: d.error?.message };
    }
    const body = { model, messages, ...(kind === "gpt5" ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }), ...(json ? { response_format: { type: "json_object" } } : {}) };
    const r = await fetch(`${E}/chat/completions`, { method: "POST", signal: ctl, headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    return { text: d.choices?.[0]?.message?.content || "", ms: Math.round(performance.now() - t0), outTok: d.usage?.completion_tokens, err: d.error?.message };
  } catch (e) { return { text: "", ms: Math.round(performance.now() - t0), err: String(e.message || e) }; }
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

// ─── A. interactive diagrams ───
const DIAGRAMS = [
  { id: "water-cycle", cls: 4, ask: "the water cycle (evaporation, condensation, precipitation, collection) with sun, sea, clouds, rain, river" },
  { id: "equiv-fractions", cls: 4, ask: "equivalent fractions: two identical bars, one split into 2 parts with 1 shaded, one split into 4 parts with 2 shaded, showing 1/2 = 2/4" },
  { id: "plant-parts", cls: 3, ask: "parts of a plant (root, stem, leaf, flower, fruit) and what each does" },
];
const vizPrompt = (d) => `Create ONE self-contained HTML file (inline SVG and inline JavaScript only; no external URLs, no CDN, no images, no fonts from the web) that shows an interactive, colourful, child-friendly diagram of ${d.ask} for an Indian class ${d.cls} child. Requirements: fits a 360px-wide phone screen; every part has a visible text label; tapping/clicking a labelled part shows a one-line explanation in simple Hinglish in a box on screen; large tap targets; no scrolling needed. Output ONLY the HTML, starting with <!doctype html>.`;

async function judgeShot(png, d) {
  const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({
    model: "taxila-brain", max_completion_tokens: 300, response_format: { type: "json_object" },
    messages: [{ role: "user", content: [
      { type: "text", text: `You are judging an educational diagram for an Indian class ${d.cls} child. Topic: ${d.ask}. Score 1-5 each: correctness (science/maths right, labels in right places), legibility (readable labels at phone size, no overlaps), appeal (would a child enjoy it). JSON: {"correctness":n,"legibility":n,"appeal":n,"issue":"short"}` },
      { type: "image_url", image_url: { url: `data:image/png;base64,${png.toString("base64")}` } }] }] }) });
  const j = await r.json(); try { return JSON.parse(j.choices[0].message.content); } catch { return null; }
}

async function taskA(browser) {
  const rows = [];
  for (const model of Object.keys(MODELS)) for (const d of DIAGRAMS) for (let k = 0; k < N; k++) {
    const res = await call(model, [{ role: "user", content: vizPrompt(d) }], { maxTokens: 9000 });
    let html = res.text.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    const row = { task: "A", model, diagram: d.id, k, ms: res.ms, outTok: res.outTok, bytes: html.length, err: res.err };
    if (!/<html|<svg/i.test(html)) { row.render = "no-html"; rows.push(row); console.log(model, d.id, "no html", res.err || ""); continue; }
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, offline: true });
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message))); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    try {
      await page.setContent(html, { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(600);
      row.consoleErrors = errors.length;
      row.textLabels = await page.evaluate(() => [...document.querySelectorAll("text, button, [role=button], label, span, div")].filter((e) => e.children.length === 0 && e.textContent.trim().length > 1 && e.getBoundingClientRect().width > 0).length);
      row.hasSvg = await page.evaluate(() => !!document.querySelector("svg, canvas"));
      row.overflowX = await page.evaluate(() => document.documentElement.scrollWidth > 380);
      const before = await page.evaluate(() => document.body.innerText);
      const target = await page.$("svg [onclick], svg g[id], svg text, [data-part], .part, button");
      if (target) { await target.click({ timeout: 3000, force: true }).catch(() => {}); await page.waitForTimeout(300); }
      row.interactive = (await page.evaluate(() => document.body.innerText)) !== before;
      const png = await page.screenshot(); const shot = `${OUT}bakeoff-shots/${model}-${d.id}-${k}.png`; writeFileSync(shot, png);
      row.judge = await judgeShot(png, d);
      row.render = "ok";
    } catch (e) { row.render = "fail: " + String(e.message).slice(0, 80); }
    await ctx.close();
    rows.push(row);
    console.log(model.padEnd(28), d.id.padEnd(16), `${row.ms}ms`, row.render, `err=${row.consoleErrors} labels=${row.textLabels} interactive=${row.interactive} judge=${JSON.stringify(row.judge || {})}`);
  }
  return rows;
}

// ─── B. teacher reply ───
const TEACHER_SYS = `You are Asha, a warm Hinglish-speaking AI teacher for a 9-year-old girl in class 4 (CBSE). Live voice lesson on comparing fractions 3/4 and 2/3.
Never give the final answer before the child tries. Encourage reasoning.
Language: mirror the child — if she speaks Hindi/Hinglish, answer in Hinglish (Hindi grammar, English maths words). Never full English unless she does.
LAST AND MOST IMPORTANT — turn shape: max 25 words. One idea. End by handing the floor back with a small question.`;
const CHILD = ["Didi mujhe fractions samajh nahi aate.", "To 3/4 bada hai ya 2/3?", "Ummm 2/3 kyunki 2 chhota hai?", "Pizza ke 4 piece mein se 3 maine kha liye", "pata nahi didi", "Achha ek aur example do na"];
const hindiish = (t) => { const w = t.toLowerCase().match(/[a-zऀ-ॿ]+/g) || []; const hi = w.filter((x) => /[ऀ-ॿ]/.test(x) || /^(hai|ho|kya|nahi|matlab|toh|to|aur|ke|ki|ka|mein|ko|se|chalo|socho|batao|dekho|achha|bilkul|tum|tumhe|apne|ek|do|hum|yeh|woh|kitne|kaun|kaise|kyun|bada|chhota|na|ji|haan|sahi|beta)$/.test(x)); return w.length ? hi.length / w.length : 0; };
async function taskB() {
  const rows = [];
  for (const model of Object.keys(MODELS)) for (const c of CHILD) {
    const res = await call(model, [{ role: "system", content: TEACHER_SYS }, { role: "user", content: c }], { maxTokens: 400 });
    const words = res.text.trim().split(/\s+/).filter(Boolean).length;
    const leak = /3\/4\s*(bada|bigger|zyada)|3 by 4 bada/i.test(res.text) && /bada hai ya/.test(c);
    rows.push({ task: "B", model, child: c, ms: res.ms, words, hinglish: +hindiish(res.text).toFixed(2), endsQuestion: /\?\s*$/.test(res.text.trim()), leak, text: res.text.slice(0, 220), err: res.err });
  }
  for (const model of Object.keys(MODELS)) { const r = rows.filter((x) => x.model === model && !x.err); console.log(model.padEnd(28), `p50 ${median(r.map((x) => x.ms))}ms  words ${median(r.map((x) => x.words))}  hinglish ${median(r.map((x) => x.hinglish))}  q-end ${r.filter((x) => x.endsQuestion).length}/${r.length}  leaks ${r.filter((x) => x.leak).length}`); }
  return rows;
}

// ─── C. classification against a verified key ───
const ITEM = { prompt: "Kaunsa bada hai: 1/4 ya 1/2?", answer: "1/2", acceptable: ["1/2", "half", "aadha", "one half", "ek by do"], misconceptions: [{ id: "bigger-denominator-bigger", belief: "a fraction with a bigger denominator is bigger" }] };
const CASES = [
  ["1/2 bada hai", "correct", null], ["aadha", "correct", null], ["1/4 kyunki 4 bada hai", "misconception", "bigger-denominator-bigger"],
  ["one fourth", "incorrect", null], ["pata nahi", "no_attempt", null], ["half wala", "correct", null],
  ["chaar wala bada hota hai na", "misconception", "bigger-denominator-bigger"], ["ek by do", "correct", null], ["didi mujhe bhook lagi hai", "no_attempt", null],
  ["dono same hai", "incorrect", null], ["1/4 bada hai", "incorrect", null], ["neeche wala number bada hai isliye 1/4", "misconception", "bigger-denominator-bigger"],
];
async function taskC() {
  const rows = [];
  const sys = `Classify a child's answer against a VERIFIED key. Item: ${JSON.stringify(ITEM)}. Output JSON {"outcome":"correct|incorrect|misconception|no_attempt","misconceptionId":string|null}. "misconception" only when the child's words show the listed belief. Never grade freely; compare to the key.`;
  for (const model of Object.keys(MODELS)) for (const [said, gold, goldMc] of CASES) {
    const res = await call(model, [{ role: "system", content: sys }, { role: "user", content: `Child said: "${said}"` }], { maxTokens: 300, json: true });
    let p = null; try { p = JSON.parse(res.text.replace(/^```(?:json)?|```$/g, "").trim()); } catch {}
    rows.push({ task: "C", model, said, gold, ms: res.ms, got: p?.outcome, ok: p?.outcome === gold && (gold !== "misconception" || p?.misconceptionId === goldMc), err: res.err });
  }
  for (const model of Object.keys(MODELS)) { const r = rows.filter((x) => x.model === model); console.log(model.padEnd(28), `acc ${r.filter((x) => x.ok).length}/${r.length}  p50 ${median(r.map((x) => x.ms))}ms`); }
  return rows;
}

const results = { at: new Date().toISOString(), n: N, models: Object.keys(MODELS) };
if (which === "B" || which === "all") { console.log("=== B teacher reply"); results.B = await taskB(); }
if (which === "C" || which === "all") { console.log("=== C classification"); results.C = await taskC(); }
if (which === "A" || which === "all") {
  console.log("=== A diagrams");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  results.A = await taskA(browser); await browser.close();
}
const file = `${OUT}model-bakeoff-${results.at.slice(0, 10)}-${which}.json`;
writeFileSync(file, JSON.stringify(results, null, 1));
console.log("wrote", file);
