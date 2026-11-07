// r7 app-pwa-install (never shipped): renders the Volt app icons from one SVG with the installed Chromium.
//   node src/child/dev/app-icons.mjs → public/site/app/{icon-192,icon-512,icon-maskable-512,apple-touch-180,monochrome-432}.png + icon.svg
// The mark is the app's own (futurist.css .kx[data-klook=volt] .kx-mark): a rounded square turned 45° with the ion edge and
// her violet dot, on the night void (--k-void, the manifest and boot-paint ground). Maskable keeps the mark inside the 60% safe circle.
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../../../public/site/app/", import.meta.url).pathname;
const svg = ({ bg = "#05060A", scale = 1, mono = false } = {}) => {
  const s = 46 * scale, c = 100, w = 6 * Math.max(0.8, scale);
  const edge = mono ? "#FFFFFF" : "#7FA6FF", dot = mono ? "#FFFFFF" : "#A98CFF", glow = mono ? "none" : "url(#g)";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7FA6FF" stop-opacity=".28"/><stop offset="1" stop-color="#7FA6FF" stop-opacity="0"/></radialGradient></defs>
  ${bg ? `<rect width="200" height="200" fill="${bg}"/>` : ""}
  ${mono ? "" : `<circle cx="${c}" cy="${c}" r="${78 * scale}" fill="${glow}"/>`}
  <rect x="${c - s / 2}" y="${c - s / 2}" width="${s}" height="${s}" rx="${7 * scale}" fill="none" stroke="${edge}" stroke-width="${w}" transform="rotate(45 ${c} ${c})"/>
  <circle cx="${c}" cy="${c - s * 0.707 - 2 * scale}" r="${8.5 * scale}" fill="${dot}"/>
</svg>`;
};

mkdirSync(OUT, { recursive: true });
writeFileSync(OUT + "icon.svg", svg({ scale: 1.55 }));
const browser = await chromium.launch();
const page = await browser.newPage();
const shoot = async (name, size, markup, transparent = false) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: OUT + name, omitBackground: transparent });
};
await shoot("icon-192.png", 192, svg({ scale: 1.55 }));
await shoot("icon-512.png", 512, svg({ scale: 1.55 }));
await shoot("icon-maskable-512.png", 512, svg({ scale: 1.2 }));
await shoot("apple-touch-180.png", 180, svg({ scale: 1.45 }));
await shoot("monochrome-432.png", 432, svg({ bg: null, mono: true, scale: 1.5 }), true);
await browser.close();
console.log("icons →", OUT);
