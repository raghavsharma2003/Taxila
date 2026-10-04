// Render SVG files to PNG with Chromium (for looking at whiteboard boards): node evals/live-studio/svg2png.mjs out.png a.svg b.svg ...
// Several inputs are stacked vertically into one PNG.
import fs from "node:fs";
import { chromium } from "playwright";
const [out, ...files] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 640, height: 480 } });
await p.setContent(`<body style="margin:0;background:#111">${files.map((f) => `<div style="margin:4px">${fs.readFileSync(f, "utf8")}</div>`).join("")}</body>`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
