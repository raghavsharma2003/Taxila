// The futurist direction pass (owner directive 2026-10-10: "don't go too Indian; modern, futuristic, engaging and cool"):
// the REAL Kaksha screens in each look, for both families, at 360x800 (phone) and 1366x768 (laptop). Not part of `npm test`
// (it needs a browser and a vite dev server; ?look= is honoured in dev builds only, src/ui-v3/kaksha/look.ts).
//   node tests/prod/r4-kaksha-futurist-shots.mjs
//     → docs/design/round4/build/kaksha/futurist/shots/<look>-<family>-<state>__<w>x<h>.webp, contact sheets
//       futurist/sheet-<look>__<w>x<h>.webp, and futurist/lint-futurist.json; exit 1 on any finding in a futurist look
// Screens: Home (Start), World (orbit), World (base), Hangar, the lesson Desk (your turn), the Debrief with a real crossing.
// Per page: the U1 in-page lint (text ≥ 14 px, Devanagari ≥ 16 px, targets ≥ 44 px, WCAG contrast on the composited
// ground, no horizontal overflow) and the floors the look must not move: AI-1 (her name with "AI"), HELP-1 (Pause one tap
// away on the Desk), TRUTH-1 (the Debrief names exactly the skill that crossed), EARN-1 (the earned moment shows only then).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { inPage, startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const DIR = path.join(ROOT, "docs/design/round4/build/kaksha/futurist");
const OUT = path.join(DIR, "shots");
const PORT = 5197;
const HOST = `http://localhost:${PORT}/src/ui-v3/kaksha/dev`;
const LOOKS = (process.env.LOOKS ?? "classic,holo,volt").split(",");
const FAMILIES = [["older", "night", 7], ["young", "dawn", 4]];
const VIEWS = [[360, 800], [1366, 768]];
const STATES = [
  ["home", (t) => `index.html?screen=home&state=start&theme=${t}`],
  ["world", (t) => `index.html?screen=world&theme=${t}`],
  ["base", (t) => `index.html?screen=world&theme=${t}`],
  ["hangar", (t) => `index.html?screen=hangar&theme=${t}`],
  ["desk", (_t, c) => `desk.html?class=${c}&fixture=your_turn`],
  ["debrief", (_t, c) => `desk.html?class=${c}&fixture=summary-secure`],
];

function checks(st) {
  const out = [];
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const text = document.body.innerText;
  if (st.name === "home" && !/AI teacher/.test(text)) out.push("AI-1 Home without AI teacher");
  if (st.name === "desk") {
    const pause = document.querySelector('[data-testid="pause"]');
    if (!vis(pause) || pause.disabled) out.push("HELP-1 pause not reachable");
    const ai = [...document.querySelectorAll("[data-ai-tag], [data-ai-label]")].filter(vis);
    if (!ai.some((a) => /\bAI\b/.test(a.textContent))) out.push("AI-1 no AI label by her face");
  }
  if (st.name === "debrief") {
    const s = document.querySelector('[data-testid="summary"]');
    if (!s || !/AI teacher/.test(s.textContent)) out.push("AI-1 Debrief without AI teacher");
    const sec = document.querySelector('[data-testid="now-secure"]');
    if (!sec || !/Equivalent fractions/.test(sec.textContent) || /Fractional units|Angles/.test(sec.textContent)) out.push("TRUTH-1");
    const earn = document.querySelector(".kx-earn");
    if (st.look !== "classic" && (!earn || !/Equivalent fractions/.test(earn.textContent))) out.push("EARN-1 no earned moment on a real crossing");
    if (st.look === "classic" && earn) out.push("EARN-1 classic changed");
  }
  if (st.name === "base" && st.look !== "classic" && !document.querySelector(".kx-settle .kx-ship")) out.push("BASE-1 no launch pad");
  if (st.name === "base" && document.querySelectorAll(".kx-settle svg *").length > 600) out.push("BASE-2 > 600 nodes");
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const stopVite = await startVite(ROOT, PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const report = [];
const tot = { small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, unresolved: 0, texts: 0, pages: 0, errors: 0, checks: 0, futuristFindings: 0 };
const shots = [];
try {
  for (const [w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    const p = await ctx.newPage();
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    for (const look of LOOKS) for (const [fam, theme, cls] of FAMILIES) for (const [name, url] of STATES) {
      await p.goto(`${HOST}/${url(theme, cls)}&look=${look}`);
      if (name === "base") await p.getByRole("radio", { name: look === "classic" ? "Settlement" : "Base" }).click();
      if (name === "desk" || name === "debrief") await p.waitForSelector('[data-testid="lesson"]');
      await p.waitForTimeout(name === "debrief" ? 1600 : 1900);
      const r = await p.evaluate(inPage);
      const c = await p.evaluate(checks, { name, look });
      const n = r.small.length + r.deva.length + r.targets.length + r.contrast.length + (r.overflow > 0 ? 1 : 0) + c.length;
      tot.pages++; tot.texts += r.texts; tot.overflow += r.overflow > 0 ? 1 : 0; tot.unresolved += r.unresolved; tot.checks += c.length;
      for (const k of ["small", "deva", "targets", "contrast"]) tot[k] += r[k].length;
      if (look !== "classic") tot.futuristFindings += n;
      report.push({ look, family: fam, state: name, view: `${w}x${h}`, ...r, checks: c });
      if (n) console.log(`${look} ${fam} ${name} ${w}`, JSON.stringify({ c, s: r.small, t: r.targets, k: r.contrast, o: r.overflow }).slice(0, 700));
      const png = path.join(OUT, `${look}-${fam}-${name}__${w}x${h}.png`);
      await p.screenshot({ path: png });
      shots.push({ look, fam, name, w, h, png });
    }
    tot.errors += errs.length; if (errs.length) console.log(`${w} page errors:`, errs.slice(0, 3));
    await ctx.close();
  }
} finally { await browser.close(); stopVite(); }

// contact sheets: one per look and viewport, families as rows, screens as columns (for a quick side-by-side read)
const py = `
import json, sys
from PIL import Image, ImageDraw, ImageFont
shots = json.load(open(sys.argv[1]))
order = ${JSON.stringify(STATES.map((s) => s[0]))}
for look in ${JSON.stringify(LOOKS)}:
  for (w, h) in ${JSON.stringify(VIEWS)}:
    rows = []
    for fam in ["older", "young"]:
      row = [Image.open(next(s["png"] for s in shots if s["look"] == look and s["fam"] == fam and s["name"] == n and s["w"] == w)).convert("RGB") for n in order]
      rows.append(row)
    tw = 300 if w < 500 else 520
    th = int(tw * rows[0][0].height / rows[0][0].width)
    pad, top = 14, 44
    sheet = Image.new("RGB", (pad + len(order) * (tw + pad), top + 2 * (th + pad + 26)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    try: f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except Exception: f = None
    d.text((pad, 12), f"{look}  ·  {w}x{h}  ·  older (top) / young (bottom)", fill=(235, 235, 240), font=f)
    for r, row in enumerate(rows):
      for c, im in enumerate(row):
        x, y = pad + c * (tw + pad), top + r * (th + pad + 26)
        d.text((x, y), order[c], fill=(200, 200, 210), font=f)
        sheet.paste(im.resize((tw, th)), (x, y + 24))
    sheet.save("${DIR}/sheet-%s__%dx%d.webp" % (look, w, h), "WEBP", quality=80, method=6)
for s in shots:
  Image.open(s["png"]).save(s["png"].replace(".png", ".webp"), "WEBP", quality=78, method=6)
`;
const list = path.join(OUT, "_shots.json");
fs.writeFileSync(list, JSON.stringify(shots));
execFileSync("python3", ["-c", py, list]);
for (const s of shots) fs.rmSync(s.png);
fs.rmSync(list);

fs.writeFileSync(path.join(DIR, "lint-futurist.json"), JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  method: `Playwright Chromium on the Kaksha dev pages (the real Home / World / Hangar views and the real Desk + Debrief with fixture models), ?look=${LOOKS.join("|")}; ${STATES.length} screens x 2 families x ${VIEWS.length} viewports`,
  totals: tot, pages: report,
}, null, 1));
console.log(JSON.stringify(tot));
process.exit(tot.futuristFindings + tot.errors ? 1 : 0);
