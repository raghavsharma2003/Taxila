// Drives the real interactions: lesson (both paths, chip barge-in, typing), game (refusals, undo, early done, solve, doors).
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
import { execFileSync } from "child_process";
import fs from "fs";
const D = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-kinetic";
const OUT = process.argv[2] || D + "/flow"; fs.mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const cache = new Map();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async (r) => { const u = r.request().url(); if (!cache.has(u)) cache.set(u, execFileSync("curl", ["-sS", "--fail", "-A", UA, u])); await r.fulfill({ status: 200, body: cache.get(u), contentType: u.includes("googleapis") ? "text/css" : "font/woff2" }); });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto("file://" + D + "/preview.html#lesson"); await p.waitForTimeout(800);
let f = 0; const shot = async (tag) => { await p.screenshot({ path: `${OUT}/${String(++f).padStart(2, "0")}-${tag}.png` }); };
// lesson main path
await p.click("#lReplay"); await p.waitForTimeout(1600); await shot("lesson-hero-speaking");
await p.waitForTimeout(2200); await shot("lesson-72-landed");
await p.waitForSelector("[data-demo=no]", { timeout: 20000 }); await shot("lesson-your-move");
await p.click("[data-demo=no]"); await p.waitForTimeout(1200); await shot("lesson-heard-no");
await p.waitForTimeout(2600); await shot("lesson-look-again");
await p.waitForSelector("[data-demo=yes]", { timeout: 20000 });
await p.click("#kbd"); await p.fill("#typeIn", "4 aata hai"); await p.click("#typer button[type=submit]"); await p.waitForTimeout(1500); await shot("lesson-typed");
await p.waitForTimeout(4500); await shot("lesson-splitting");
await p.click("[data-chip='0']"); await p.waitForTimeout(900); await shot("lesson-bargein");
await p.waitForSelector("#rail .slab", { timeout: 40000 }); await shot("lesson-end");
// language chip
await p.click("#lReplay"); await p.waitForTimeout(2500); await p.click("[data-chip='3']"); await p.waitForTimeout(3800); await shot("lesson-switched-english");
// game
await p.evaluate(() => window.taal.setLang("hinglish"));
await p.evaluate(() => window.taal.go("game")); await p.waitForTimeout(900); await shot("game-start");
const tapN = async (n) => { await p.evaluate((n) => { const el = [...document.querySelectorAll("#gameSlot .nd")].find((x) => x.textContent.trim() === String(n) && !x.classList.contains("spent")); el && el.click(); }, n); await p.waitForTimeout(250); };
const key = async (d) => { await p.click(`[data-div='${d}']`); await p.waitForTimeout(650); };
await tapN(84); await shot("game-selected"); await key(5); await shot("game-refused-5");
await key(1); await shot("game-by-1");
await key(4); await shot("game-split-4x21");
await p.click("#gDone"); await p.waitForTimeout(500); await shot("game-done-too-early");
await p.click("#gUndo"); await p.waitForTimeout(600); await shot("game-undo");
await tapN(84); await key(2); await tapN(42); await key(6); await tapN(6); await key(2); await tapN(7); await shot("game-prime-tapped");
await p.click("#gDone"); await p.waitForTimeout(500); await shot("game-solving"); await p.waitForTimeout(1600); await shot("game-doors");
await p.click("[data-level='360']"); await p.waitForTimeout(800);
await tapN(360); await key(10); await tapN(36); await key(6); await tapN(10); await key(2); await tapN(6); await key(2); await tapN(6); await key(3);
await shot("game-360-tree"); await p.click("#gDone"); await p.waitForTimeout(2500); await shot("game-360-solved");
console.log(errs.length ? errs : "no errors", f, "frames");
await b.close();
