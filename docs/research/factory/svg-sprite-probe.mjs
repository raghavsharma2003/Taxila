// svg-sprite-probe.mjs — can the text models on Azure draw usable flat SVG sprites in the house style? (2026-10-02)
// 4 models x 6 Indian-context props x n=1. Measures: wall time, validity (parses, renders, no <text>/<script>/href),
// bytes, element count, palette adherence (fills/strokes outside the token list). Renders a contact sheet for eyeballing.
// Usage: node --env-file=.env.local docs/research/factory/svg-sprite-probe.mjs
import fs from "node:fs"; import path from "node:path"; import { chromium } from "playwright";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const ANTH = BASE.replace(/\.openai\.azure\.com.*$/, ".services.ai.azure.com") + "/anthropic/v1/messages";
const OUT = process.env.OUT || "/tmp/svg-probe"; fs.mkdirSync(OUT, { recursive: true });
const PALETTE = ["#3A2A1E", "#F6F1E8", "#C2410C", "#0B5E50", "#2A72C6", "#3F2272", "#E0A526", "#F59E0B", "#C99366", "#8A5634", "#9CA3AF", "#FFFFFF", "none"];
const PROPS = {
  mango: "a ripe mango with one leaf",
  roti: "a steel plate (thali) with two rotis",
  coin: "a generic golden coin with a raised rim and a blank centre (no numerals, no symbols)",
  auto: "a three-wheeler auto-rickshaw, side view, yellow and green",
  matka: "a clay water pot (matka) with a small lid",
  kite: "a diamond kite (patang) with a tail",
};
const SYS = `You draw single game sprites as SVG. Output ONLY one <svg> element, nothing else.
Rules: viewBox="0 0 256 256"; subject centred, fills ~80% of the box; flat fills only (no gradients, filters, patterns, masks, images);
every shape has stroke="#3A2A1E" stroke-width between 6 and 10, stroke-linejoin="round"; at most 40 elements;
colours ONLY from this list: ${PALETTE.join(" ")}; no <text>, no <script>, no href, no style attributes or <style>; rounded friendly shapes for 6-9 year olds.`;
const MODELS = [
  { id: "luna", call: (p) => responses("taxila-fast", p) },
  { id: "sol", call: (p) => responses("taxila-brain", p) },
  { id: "codex", call: (p) => responses("taxila-codex", p) },
  { id: "sonnet", call: (p) => anthropic("taxila-sonnet", p) },
  { id: "opus", call: (p) => anthropic("taxila-opus", p) },
];
async function responses(model, prompt) {
  const r = await fetch(`${BASE}/responses`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model, instructions: SYS, input: prompt, max_output_tokens: 6000 }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  const text = (j.output || []).flatMap((o) => o.content || []).filter((c) => c.type === "output_text").map((c) => c.text).join("");
  return { text, usage: j.usage };
}
async function anthropic(model, prompt) {
  const r = await fetch(ANTH, { method: "POST", headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 6000, system: SYS, messages: [{ role: "user", content: prompt }] }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { text: j.content.filter((c) => c.type === "text").map((c) => c.text).join(""), usage: j.usage };
}
function lint(svg) {
  const issues = [];
  if (!/^<svg[\s>]/.test(svg.trim())) issues.push("not-bare-svg");
  if (/<text|<script|href=|<style|style=|<image|<filter|Gradient|<pattern|<mask/i.test(svg)) issues.push("forbidden-element");
  const cols = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1].toUpperCase());
  const off = [...new Set(cols.filter((c) => !PALETTE.map((p) => p.toUpperCase()).includes(c)))];
  if (off.length) issues.push(`off-palette:${off.join(",")}`);
  const els = (svg.match(/<(path|circle|ellipse|rect|polygon|polyline|line|g)\b/g) || []).length;
  if (els > 40) issues.push(`elements:${els}`);
  return { issues, els, off };
}
const rows = [];
const browser = await chromium.launch({ executablePath: process.env.PWX || undefined });
const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
for (const m of MODELS) for (const [pid, desc] of Object.entries(PROPS)) {
  const t0 = Date.now(); let row = { model: m.id, prop: pid };
  try {
    const { text, usage } = await m.call(`Draw: ${desc}.`);
    row.ms = Date.now() - t0; row.usage = usage;
    const svg = (text.match(/<svg[\s\S]*<\/svg>/) || [""])[0];
    row.bytes = svg.length; Object.assign(row, lint(svg)); row.extracted = svg.length > 0; row.wrapped = text.trim() !== svg.trim();
    fs.writeFileSync(path.join(OUT, `${m.id}-${pid}.svg`), svg);
    await page.setContent(`<html><body style="margin:0;background:#fff">${svg.replace(/<svg/, '<svg width="256" height="256"')}</body></html>`);
    const errs = await page.evaluate(() => { const s = document.querySelector("svg"); if (!s) return "no-svg"; const b = s.getBBox(); return b.width < 20 ? "tiny-bbox" : null; });
    row.render = errs || "ok";
    await page.screenshot({ path: path.join(OUT, `${m.id}-${pid}.png`) });
  } catch (e) { row.ms = Date.now() - t0; row.err = String(e).slice(0, 240); }
  rows.push(row); console.log(JSON.stringify(row));
}
await browser.close();
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "svg-sprite-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", palette: PALETTE, rows }, null, 2));
