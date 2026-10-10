// Round 4 stream 5: the r8 CONTACT SHEET for the extended bilabial rule (the main session judges it; no model judge can
// score audio-video sync). Rendered by the PRODUCTION r8 stage (evals/face-puppet/harness, capture mode: scripted clock,
// Diya's stored lines), the same frames with the base rule (BEFORE, r8 today) and the extended rule (AFTER):
//   seals       12 lines; per line its bilabial words (the 10 the base rule leaves open first, then word-initial ones).
//               The frame is the AFTER arm's most-closed frame inside [word start - 80, word end] (lip gap from
//               stage.mouthProbe()); BEFORE is rendered at the same scripted instant.
//   neighbours  6 non-bilabial words next to an extended seal, at the most-closed frame INSIDE the word
//               ([start + 60, end - 60]: the neighbour's own sounds, not the bilabial next to it). An over-seal would
//               close a mouth BEFORE kept open.
//   strip       10 consecutive frames (1/60 s) around a word-internal bilabial the extended rule newly seals ("m"
//               preferred; none of this battery's new seals is a mid-word m, so it falls back to b / p), BEFORE over AFTER.
// Labels: line, word, the scripted ms in the line, the rendered lip gap (px at 720 px; 0 = sealed).
//   node evals/face-puppet/build-harness.mjs && node evals/face-puppet/bilabial-sheet.mjs [outDir]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { addBilabials, addBilabialsExtended } from "../../src/face-puppet/visemes.ts";
import { LINES } from "./lines.mjs";

const OUT = process.argv[2] ?? "docs/design/round4/build/asha/bilabial-sheet";
fs.mkdirSync(OUT, { recursive: true });
const DIR = "evals/face-puppet/out/diya/";
const PORT = 4733, FRAME = 1000 / 60, SPACING = 14_000;
const CROP = { x: 250, y: 390, w: 240, h: 160 }; // r8 mouth at 720 px (rest pose)
const meta = (k) => JSON.parse(fs.readFileSync(`${DIR}${String(k).padStart(2, "0")}.json`, "utf8"));
const roman = (t) => String(t).normalize("NFC");
const BIL_ROMAN = /(^|[^p])(?:b|m|p(?!h))/, BIL_DEV = /[पबभम]/u;
const isBil = (t) => (/[ऀ-ॿ]/u.test(t) ? BIL_DEV.test(t) : BIL_ROMAN.test(t.toLowerCase().replace(/[^a-z]/g, "")));
const seal21 = (vis, w) => vis.some((v) => v.id === 21 && v.ms >= w.ms - 60 && v.ms <= w.ms + w.durMs);

// ── pick the words ──
const lines = [];
for (let k = 0; k < LINES.length; k++) {
  const m = meta(k);
  const base = addBilabials(m.visemes, m.words), ext = addBilabialsExtended(m.visemes, m.words);
  const newly = m.words.filter((w) => isBil(w.text) && !seal21(base, w) && seal21(ext, w));
  const initial = m.words.filter((w) => seal21(base, w) && /^(?:bh|b|p(?!h)|m)/i.test(roman(w.text)));
  lines.push({ k, m, newly, initial });
}
const chosen = [...lines.filter((l) => l.newly.length), ...lines.filter((l) => !l.newly.length && l.initial.length)].slice(0, 12)
  .map((l) => ({ ...l, words: l.newly.length ? l.newly : l.initial.slice(0, 1) }));
const neighbours = [];
for (const l of chosen) for (const w of l.newly) {
  const i = l.m.words.indexOf(w);
  const n = [l.m.words[i + 1], l.m.words[i - 1]].find((x) => x && !isBil(x.text) && !/[pbm]/i.test(x.text));
  if (n && neighbours.length < 6 && !neighbours.some((x) => x.w === n)) neighbours.push({ k: l.k, w: n });
}
let strip = null;
const midBil = (t, re) => /^[a-z]+$/i.test(t) && re.test(t) && !/(mm|bb|pp)/i.test(t);
for (const re of [/[a-z]m[a-z]/i, /[a-z](?:b|p(?!h))[a-z]/i]) {
  for (const l of lines) { const w = l.newly.find((x) => midBil(x.text, re)); if (w) { strip = { k: l.k, w }; break; } }
  if (strip) break;
}

// ── render ──
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const lineAt = (k) => 3000 + chosen.findIndex((l) => l.k === k) * SPACING;
const allLines = [...new Set([...chosen.map((l) => l.k), ...neighbours.map((n) => n.k), ...(strip ? [strip.k] : [])])].sort((a, b) => a - b);
const t0Of = (k) => 3000 + allLines.indexOf(k) * SPACING;

/** One arm: open the harness, set the rule, play every line on the scripted clock; `plan` = sorted [{ t, key, shot }]. */
async function arm(extended, plan) {
  const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
  await page.goto(`http://127.0.0.1:${PORT}/h/index.html?mode=capture&px=720`);
  await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 60000 });
  const err = await page.evaluate("window.H.error || null");
  if (err) throw new Error(err);
  await page.evaluate((x) => { window.H.stage.driver.visemes.extendedBilabials = x; window.H.status("speaking"); }, extended);
  const out = await page.evaluate(async ({ lines, plan }) => {
    const H = window.H, res = {};
    let li = 0;
    for (const p of plan) {
      while (li < lines.length && lines[li].t0 - 500 <= p.t) { await H.line(lines[li].id, lines[li].t0); li++; }
      const img = p.shot ? H.shot(p.t) : (H.at(p.t), null);
      const gap = H.stage.mouthProbe()?.gap ?? null;
      (res[p.key] ??= []).push({ t: p.t, gap, img });
    }
    return res;
  }, { lines: allLines.map((k) => ({ id: String(k).padStart(2, "0"), t0: t0Of(k) })), plan });
  await page.close();
  return out;
}
const windowPlan = (key, k, w, shot, interior = false) => {
  const a = t0Of(k) + w.ms + (interior ? 60 : -80), b = t0Of(k) + w.ms + w.durMs - (interior ? 60 : 0);
  const ts = [];
  for (let t = Math.ceil(a / FRAME) * FRAME; t <= b; t += FRAME) ts.push({ t: Math.round(t * 1000) / 1000, key, shot });
  return ts;
};
// pass 1: the AFTER arm's most-closed frame per word (gaps only)
const targets = [...chosen.flatMap((l) => l.words.map((w) => ({ kind: "seal", k: l.k, w }))), ...neighbours.map((n) => ({ kind: "neighbour", ...n }))];
const plan1 = targets.flatMap((x, i) => windowPlan(`x${i}`, x.k, x.w, false, x.kind === "neighbour")).sort((a, b) => a.t - b.t);
const p1 = await arm(true, plan1);
const pick = targets.map((x, i) => { const fr = p1[`x${i}`] ?? []; const best = fr.reduce((m, f) => (f.gap !== null && (m === null || f.gap < m.gap) ? f : m), null); return { ...x, t: best?.t ?? fr[0]?.t }; });
// the strip: 10 frames centred on the extended rule's seal in that word (or its middle)
let stripTs = [];
if (strip) {
  const ext = addBilabialsExtended(meta(strip.k).visemes, meta(strip.k).words).find((v) => v.id === 21 && v.ms >= strip.w.ms - 60 && v.ms <= strip.w.ms + strip.w.durMs);
  const c = t0Of(strip.k) + (ext ? ext.ms + 40 : strip.w.ms + strip.w.durMs / 2);
  // the strip's line must be played too
  if (!allLines.includes(strip.k)) throw new Error("strip line not scheduled");
  for (let i = -5; i < 5; i++) stripTs.push(Math.round((Math.round(c / FRAME) + i) * FRAME * 1000) / 1000);
}
const plan2 = [...pick.map((x, i) => ({ t: x.t, key: `x${i}`, shot: true })), ...stripTs.map((t) => ({ t, key: "strip", shot: true }))].sort((a, b) => a.t - b.t);
const before = await arm(false, plan2), after = await arm(true, plan2);

// ── compose the sheets in the browser (canvas crops + labels) ──
const page = await browser.newPage();
async function sheet(file, title, rows) {
  const png = await page.evaluate(async ({ title, rows, CROP }) => {
    const S = 1.25, cw = CROP.w * S, ch = CROP.h * S, lab = 230, pad = 10, head = 54;
    const c = document.createElement("canvas");
    c.width = lab + 2 * (cw + pad) + pad; c.height = head + rows.length * (ch + pad) + pad;
    const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#111"; x.font = "bold 18px sans-serif"; x.fillText(title, pad, 24);
    x.font = "bold 15px sans-serif"; x.fillText("BEFORE (base rule, r8 today)", lab, 46); x.fillText("AFTER (extended rule)", lab + cw + pad, 46);
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    for (let r = 0; r < rows.length; r++) {
      const y = head + r * (ch + pad), row = rows[r];
      x.fillStyle = "#111"; x.font = "15px sans-serif";
      row.label.forEach((s, j) => x.fillText(s, pad, y + 20 + j * 19));
      for (const [j, cell] of [row.before, row.after].entries()) {
        if (!cell?.img) continue;
        const im = await load(cell.img);
        x.drawImage(im, CROP.x, CROP.y, CROP.w, CROP.h, lab + j * (cw + pad), y, cw, ch);
        x.fillStyle = cell.gap !== null && cell.gap < 0.5 ? "#0a7d32" : "#b00020"; x.font = "bold 14px sans-serif";
        x.fillText(`gap ${cell.gap === null ? "?" : cell.gap.toFixed(1)} px`, lab + j * (cw + pad) + 6, y + ch - 8);
      }
    }
    return c.toDataURL("image/png");
  }, { title, rows, CROP });
  fs.writeFileSync(`${OUT}/${file}`, Buffer.from(png.split(",")[1], "base64"));
}
const cell = (res, i) => res[`x${i}`]?.[0] ?? null;
const translit = (t) => (/[ऀ-ॿ]/u.test(t) ? `${t} (Devanagari)` : t);
const rowsOf = (kind) => pick.map((x, i) => ({ x, i })).filter(({ x }) => x.kind === kind).map(({ x, i }) => ({
  label: [`line ${String(x.k).padStart(2, "0")}: "${translit(x.w.text)}"`, `${x.kind === "seal" ? (lines[x.k].newly.includes(x.w) ? "single b/m/p: NEW seal" : "word-initial: base rule seals") : "no b/m/p (over-seal check)"}`, `at ${Math.round(x.t - t0Of(x.k))} ms in the line`],
  before: cell(before, i), after: cell(after, i),
}));
const seals = rowsOf("seal");
await sheet("seals-1.png", "r8 bilabial seals, before vs after the extended rule (1/2)", seals.slice(0, Math.ceil(seals.length / 2)));
await sheet("seals-2.png", "r8 bilabial seals, before vs after the extended rule (2/2)", seals.slice(Math.ceil(seals.length / 2)));
await sheet("neighbours.png", "r8 non-bilabial neighbours (an over-seal would close these)", rowsOf("neighbour"));
if (strip) {
  const rows = (before.strip ?? []).map((b, i) => ({ label: [`"${strip.w.text}" line ${String(strip.k).padStart(2, "0")}`, `frame ${i + 1} / 10`, `at ${Math.round(b.t - t0Of(strip.k))} ms`], before: b, after: after.strip?.[i] }));
  await sheet("strip-mid-word.png", `r8: 10 consecutive frames (1/60 s) around the mid-word bilabial in "${strip.w.text}"`, rows);
}
const summary = {
  date: new Date().toISOString().slice(0, 10),
  method: fs.readFileSync(new URL(import.meta.url)).toString().split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"),
  seals: seals.map((r) => ({ label: r.label.join(" · "), gapBefore: r.before?.gap ?? null, gapAfter: r.after?.gap ?? null })),
  neighbours: rowsOf("neighbour").map((r) => ({ label: r.label.join(" · "), gapBefore: r.before?.gap ?? null, gapAfter: r.after?.gap ?? null })),
  strip: strip ? { word: strip.w.text, line: strip.k, gapsBefore: (before.strip ?? []).map((f) => f.gap), gapsAfter: (after.strip ?? []).map((f) => f.gap) } : null,
};
fs.writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 1));
await browser.close();
srv.kill();
console.log(JSON.stringify({ seals: summary.seals.length, neighbours: summary.neighbours.length, strip: summary.strip?.word }, null, 0));
for (const s of summary.seals) console.log("seal", s.label, s.gapBefore?.toFixed(1), "->", s.gapAfter?.toFixed(1));
for (const s of summary.neighbours) console.log("nbr ", s.label, s.gapBefore?.toFixed(1), "->", s.gapAfter?.toFixed(1));
if (summary.strip) console.log("strip", summary.strip.word, summary.strip.gapsBefore.map((g) => g?.toFixed(1)).join(","), "|", summary.strip.gapsAfter.map((g) => g?.toFixed(1)).join(","));
