#!/usr/bin/env node
// The brand mark, hand-drawn (PRODUCT-DESIGN-V2 §12: favicon.svg is "redrawn by hand", never generated; the asset
// notes for brand/*: an open book seen from the front whose centre spine rises into a fountain-pen nib, paper cream
// on deep ink blue, flat, no letters, no lamp, no yellow, readable at 48 px). One glyph, every derived file:
//
//   node src/app/landing/brand.mjs        writes public/favicon.svg, public/brand/*.svg, the PNG icons, the
//                                         splashes and public/manifest.webmanifest (PNGs rendered in headless
//                                         Chromium: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers)
//
// The colours are the brand's two fixed values (--nib light, --paper light, src/styles/tokens.css); they are not
// themed, because an icon on a launcher has no theme. The dark splash uses the dark --paper.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const INK = "#24346E", CREAM = "#F6F3EC", NIGHT = "#121418";

/** The glyph on a 64-unit grid, centred on (32, 32), occupying about 44 x 46 units. */
export function glyph(fill = CREAM, cut = INK) {
  return [
    // the nib: point up, shoulders, then it narrows into the book's spine
    `<path d="M32 8.5C35.2 14.6 41.5 20.4 41.5 28c0 5-3.4 8.3-6.9 9.9V44h-5.2v-6.1c-3.5-1.6-6.9-4.9-6.9-9.9 0-7.6 6.3-13.4 9.5-19.5z" fill="${fill}"/>`,
    // the slit and the breather hole
    `<path d="M32 12.5v14" stroke="${cut}" stroke-width="2.2" stroke-linecap="round"/>`,
    `<circle cx="32" cy="29.4" r="2.6" fill="${cut}"/>`,
    // the open book: two pages meeting at the spine
    `<path d="M10 41.5c7.4-3.8 14.6-3.8 20.6.2V53c-6-4-13.2-4-20.6-.2z" fill="${fill}"/>`,
    `<path d="M54 41.5c-7.4-3.8-14.6-3.8-20.6.2V53c6-4 13.2-4 20.6-.2z" fill="${fill}"/>`,
  ].join("");
}

const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`;
/** Rounded-square tile (favicon, mark): the tile fills 88 % of the frame, transparent outside. */
export const markSvg = () => svg("0 0 64 64", `<rect x="3.84" y="3.84" width="56.32" height="56.32" rx="14" fill="${INK}"/>${glyph()}`);
/** Launcher icon: full-bleed ink square; the glyph inside the central 66 % safe zone (the OS applies the mask). */
const scaled = (s, body) => `<g transform="translate(32 32) scale(${s}) translate(-32 -32)">${body}</g>`;
export const appIconSvg = () => svg("0 0 64 64", `<rect width="64" height="64" fill="${INK}"/>${scaled(0.78, glyph())}`);
export const foregroundSvg = () => svg("0 0 64 64", scaled(0.62, glyph()));
const splash = (ground) => svg("0 0 2732 2732", `<rect width="2732" height="2732" fill="${ground}"/><g transform="translate(1046 1046) scale(10)">${markSvg().replace(/^<svg[^>]*>|<\/svg>\n$/g, "")}</g>`);

const OUT = {
  "public/favicon.svg": markSvg(),
  "public/brand/mark.svg": markSvg(),
  "public/brand/app-icon.svg": appIconSvg(),
  "public/brand/adaptive-foreground.svg": foregroundSvg(),
  "public/brand/adaptive-background.svg": svg("0 0 64 64", `<rect width="64" height="64" fill="${INK}"/>`),
  "public/brand/monochrome.svg": svg("0 0 64 64", scaled(0.62, glyph("#FFFFFF", "transparent")).replace(/<path d="M32 12\.5[^>]*>|<circle[^>]*>/g, "")),
  "public/brand/splash-light.svg": splash(CREAM),
  "public/brand/splash-dark.svg": splash(NIGHT),
};
/** PNGs: [out, source svg, px]. 2732 splashes are rendered at 1366 (the 2x of a 683 pt canvas is too big to ship). */
const PNG = [
  ["public/brand/icon-192.png", "public/brand/app-icon.svg", 192],
  ["public/brand/icon-512.png", "public/brand/app-icon.svg", 512],
  ["public/brand/icon-maskable-512.png", "public/brand/app-icon.svg", 512],
  ["public/brand/apple-touch-icon.png", "public/brand/app-icon.svg", 180],
  ["public/brand/favicon-48.png", "public/brand/mark.svg", 48],
  ["public/brand/adaptive-foreground-432.png", "public/brand/adaptive-foreground.svg", 432],
  ["public/brand/monochrome-432.png", "public/brand/monochrome.svg", 432],
  ["public/brand/splash-light-1366.png", "public/brand/splash-light.svg", 1366],
  ["public/brand/splash-dark-1366.png", "public/brand/splash-dark.svg", 1366],
];

/** The link-preview card (og:image, 1200 x 630: WhatsApp and Facebook crop to this ratio). The mark plus the name and
 *  the one-line promise as live text, rendered once; English, no dashes, no lamp. */
const SHARE_HTML = `<html><body style="margin:0"><div id="c" style="width:1200px;height:630px;background:${CREAM};display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box;font-family:'Noto Sans',system-ui,sans-serif;color:${INK}">
  ${appIconSvg().replace("<svg ", '<svg width="240" height="240" style="flex:none;border-radius:52px" ')}
  <div><div style="font-size:96px;font-weight:800;letter-spacing:-1px;line-height:1">Taxila</div>
  <div style="font-size:44px;font-weight:600;line-height:1.25;margin-top:24px">A personal AI teacher<br>for classes 1 to 9</div>
  <div style="font-size:30px;margin-top:20px;opacity:.85">Lessons by voice, in English, Hindi or both</div></div></div></body></html>`;

const MANIFEST = {
  name: "Taxila",
  short_name: "Taxila",
  description: "A personal AI teacher for classes 1 to 9.",
  start_url: "/who",
  scope: "/",
  display: "standalone",
  background_color: CREAM,
  theme_color: CREAM,
  icons: [
    { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/brand/monochrome-432.png", sizes: "432x432", type: "image/png", purpose: "monochrome" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
  ],
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(path.join(ROOT, "public/brand"), { recursive: true });
  for (const [f, s] of Object.entries(OUT)) fs.writeFileSync(path.join(ROOT, f), s);
  fs.writeFileSync(path.join(ROOT, "public/manifest.webmanifest"), JSON.stringify(MANIFEST, null, 2) + "\n");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [out, src, px] of PNG) {
    await page.setViewportSize({ width: px, height: px });
    const body = fs.readFileSync(path.join(ROOT, src), "utf8").replace("<svg ", `<svg width="${px}" height="${px}" `);
    await page.setContent(`<html><body style="margin:0;background:transparent">${body}</body></html>`);
    await page.locator("svg").screenshot({ path: path.join(ROOT, out), omitBackground: true });
    console.log(`${out} ${px}px ${fs.statSync(path.join(ROOT, out)).size} B`);
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(SHARE_HTML);
  await page.locator("#c").screenshot({ path: path.join(ROOT, "public/brand/share-1200x630.png") });
  console.log(`public/brand/share-1200x630.png ${fs.statSync(path.join(ROOT, "public/brand/share-1200x630.png")).size} B`);
  await browser.close();
  for (const f of Object.keys(OUT)) console.log(`${f} ${fs.statSync(path.join(ROOT, f)).size} B`);
}
