// diagrams-images-renderer-probe.mjs — Taxila content/diagrams-images, renderer bake-off (2026-10-02). $0, no API calls.
// Questions:
//  R1 payload: min+gzip bytes of KaTeX(+mhchem, css, woff2), Mermaid, Graphviz (viz.js wasm), ELK, dagre
//  R2 KaTeX on 26 class 1-9 expressions: errors, strict warnings, median render ms; Devanagari inside \text{}:
//     is a word kept in ONE text run (shaping intact) and does it render in Mukta when we override the font?
//  R3 Hindi + English flowchart (water cycle, 6 nodes) in Mermaid (htmlLabels on/off), Graphviz, ELK+own renderer, dagre+own:
//     render ms, and LABEL OVERFLOW = label ink width − node box width (px), (a) font loaded before render,
//     (b) font arrives AFTER render (the patchy-network race: layout measured with fallback, painted with Mukta)
// Usage: REND=<dir with node_modules + fonts/ + fonts.css> node docs/research/content/diagrams-images-renderer-probe.mjs
import fs from "node:fs"; import path from "node:path"; import zlib from "node:zlib"; import { chromium } from "playwright";
const REND = process.env.REND; if (!REND) throw new Error("set REND");
const NM = path.join(REND, "node_modules");
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "diagrams-images-renderer-probe-2026-10-02.json");
const gz = (f) => zlib.gzipSync(fs.readFileSync(f), { level: 9 }).length;
const size = (f) => ({ raw: fs.statSync(f).size, gz: gz(f) });

// ---------- R1 payload ----------
const katexFonts = fs.readdirSync(path.join(NM, "katex/dist/fonts")).filter((f) => f.endsWith(".woff2"));
const payload = {
  katex_js: size(path.join(NM, "katex/dist/katex.min.js")),
  katex_css: size(path.join(NM, "katex/dist/katex.min.css")),
  katex_mhchem: size(path.join(NM, "katex/dist/contrib/mhchem.min.js")),
  katex_woff2_all: katexFonts.reduce((a, f) => a + fs.statSync(path.join(NM, "katex/dist/fonts", f)).size, 0),
  katex_woff2_count: katexFonts.length,
  mermaid_iife: size(path.join(NM, "mermaid/dist/mermaid.min.js")),
  viz_global_wasm_inlined: size(path.join(NM, "@viz-js/viz/dist/viz-global.js")),
  elk_bundled: size(path.join(NM, "elkjs/lib/elk.bundled.js")),
  dagre: size(path.join(NM, "@dagrejs/dagre/dist/dagre.min.js").replace(/\.min\.js$/, fs.existsSync(path.join(NM, "@dagrejs/dagre/dist/dagre.min.js")) ? ".min.js" : ".js")),
  versions: Object.fromEntries(["katex", "mermaid", "@viz-js/viz", "elkjs", "@dagrejs/dagre"].map((p) => [p, JSON.parse(fs.readFileSync(path.join(NM, p, "package.json"))).version])),
};

// ---------- browser ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 }); // a 412-dp Android phone
const files = {
  "/katex.min.js": path.join(NM, "katex/dist/katex.min.js"), "/katex.min.css": path.join(NM, "katex/dist/katex.min.css"),
  "/mhchem.min.js": path.join(NM, "katex/dist/contrib/mhchem.min.js"), "/mermaid.min.js": path.join(NM, "mermaid/dist/mermaid.min.js"),
  "/viz.js": path.join(NM, "@viz-js/viz/dist/viz-global.js"), "/elk.js": path.join(NM, "elkjs/lib/elk.bundled.js"),
  "/dagre.js": fs.existsSync(path.join(NM, "@dagrejs/dagre/dist/dagre.min.js")) ? path.join(NM, "@dagrejs/dagre/dist/dagre.min.js") : path.join(NM, "@dagrejs/dagre/dist/dagre.js"),
  "/fonts.css": path.join(REND, "fonts.css"),
};
await ctx.route("http://probe.local/**", (route) => {
  const u = new URL(route.request().url()); let f = files[u.pathname];
  if (!f && u.pathname.startsWith("/fonts/")) f = path.join(REND, u.pathname);
  if (!f && u.pathname.startsWith("/kfonts/")) f = path.join(NM, "katex/dist/fonts", path.basename(u.pathname));
  if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: "" });
  const ct = f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : f.endsWith(".woff2") ? "font/woff2" : "text/html";
  let body = fs.readFileSync(f); if (f.endsWith("katex.min.css")) body = Buffer.from(body.toString().replace(/url\(fonts\//g, "url(/kfonts/"));
  return route.fulfill({ status: 200, contentType: ct, body });
});
await ctx.route("http://probe.local/", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><meta charset=utf-8><body></body>" }));
const page = await ctx.newPage(); const consoleMsgs = [];
page.on("console", (m) => consoleMsgs.push(m.text().slice(0, 200)));
await page.goto("http://probe.local/");

// ---------- R2 KaTeX ----------
const EXPR = [
  ["c3 fraction", "\\frac{3}{4}"], ["c4 mixed", "2\\tfrac{1}{3}"], ["c4 compare", "\\frac{3}{4} > \\frac{2}{3}"], ["c5 decimal", "0.75 = \\frac{75}{100}"],
  ["c3 times", "12 \\times 8 = 96"], ["c4 div", "144 \\div 12 = 12"], ["c8 identity", "(a+b)^2 = a^2 + 2ab + b^2"], ["c6 sqrt", "\\sqrt{49} = 7"],
  ["c9 quadratic", "x^2 - 5x + 6 = 0"], ["c7 angle", "\\angle ABC = 60^\\circ"], ["c9 congruence", "\\triangle ABC \\cong \\triangle PQR"],
  ["c7 circle", "A = \\pi r^2"], ["c6 integers", "-7 + 3 = -4"], ["c9 poly", "p(x) = 2x^3 - x + 1"], ["c9 motion", "v = u + at"],
  ["c9 lens", "\\dfrac{1}{v} + \\dfrac{1}{u} = \\dfrac{1}{f}"], ["c6 units", "10^{-3}\\,\\text{m} = 1\\,\\text{mm}"], ["c5 area en", "\\text{Area} = l \\times b"],
  ["c5 area hi", "\\text{क्षेत्रफल} = \\text{लंबाई} \\times \\text{चौड़ाई}"], ["c7 speed hi", "\\text{गति} = \\dfrac{\\text{दूरी}}{\\text{समय}}"],
  ["c3 rupee", "₹\\,250 + ₹\\,75 = ₹\\,325"], ["deva stress", "\\text{कि र्कि क्ष ङ्क्ष कृ कँ}"],
  ["c7 photosynthesis", "\\ce{6CO2 + 6H2O ->[\\text{sunlight}] C6H12O6 + 6O2}"], ["c8 water", "\\ce{2H2 + O2 -> 2H2O}"],
  ["c9 lime", "\\ce{CaCO3 ->[\\Delta] CaO + CO2 ^}"], ["c9 ion", "\\ce{Na+ + Cl- -> NaCl}"],
];
const katexRes = await page.evaluate(async (EXPR) => {
  const add = (tag, attrs) => new Promise((res, rej) => { const e = document.createElement(tag); Object.assign(e, attrs); e.onload = res; e.onerror = rej; document.head.appendChild(e); });
  await add("link", { rel: "stylesheet", href: "/katex.min.css" }); await add("link", { rel: "stylesheet", href: "/fonts.css" });
  await add("script", { src: "/katex.min.js" }); await add("script", { src: "/mhchem.min.js" });
  const st = document.createElement("style"); st.textContent = ".deva-fix .katex .mord.text, .deva-fix .katex .text { font-family: 'Mukta', KaTeX_Main, serif; }"; document.head.appendChild(st);
  await document.fonts.load("20px Mukta", "क"); await document.fonts.load("20px KaTeX_Main", "x"); await document.fonts.ready;
  const DEVA = /[ऀ-ॿ]/; const rows = [];
  for (const [id, tex] of EXPR) {
    for (const mode of ["default", "deva-fix"]) {
      if (mode === "deva-fix" && !DEVA.test(tex)) continue;
      const host = document.createElement("div"); host.className = mode === "deva-fix" ? "deva-fix" : ""; host.style.fontSize = "24px"; document.body.appendChild(host);
      const warns = []; let html = ""; const t0 = performance.now(); let err = null;
      try { html = katex.renderToString(tex, { throwOnError: true, strict: (code, msg) => { warns.push(code); return "ignore"; }, trust: false, maxExpand: 200, maxSize: 20, output: "htmlAndMathml" }); }
      catch (e) { err = String(e.message).slice(0, 120); }
      const ms = performance.now() - t0; host.innerHTML = html;
      const r = { id, mode, ms: +ms.toFixed(2), err, warns: [...new Set(warns)], bytes: html.length };
      if (DEVA.test(tex) && !err) {
        // shaping check: every Devanagari word must sit inside ONE text node (split runs break conjuncts/matras)
        const walker = document.createTreeWalker(host.querySelector(".katex-html"), NodeFilter.SHOW_TEXT); const runs = []; let n;
        while ((n = walker.nextNode())) if (DEVA.test(n.textContent)) runs.push(n.textContent);
        const words = (tex.match(/\\text\{([^}]*)\}/g) || []).flatMap((s) => s.slice(6, -1).split(/\s+/)).filter((w) => DEVA.test(w));
        r.deva_words = words.length; r.deva_text_runs = runs.length; r.runs_sample = runs.slice(0, 6);
        r.words_intact = words.every((w) => runs.some((x) => x.includes(w)));
        const el = [...host.querySelectorAll(".katex-html span")].find((s) => s.childNodes.length === 1 && s.firstChild.nodeType === 3 && DEVA.test(s.textContent));
        r.deva_font = el ? getComputedStyle(el).fontFamily.slice(0, 60) : null;
      }
      rows.push(r); host.remove();
    }
  }
  return rows;
}, EXPR);

// ---------- R3 flowcharts ----------
const NODES = {
  hi: [["a", "सूरज की गर्मी"], ["b", "वाष्पीकरण"], ["c", "जलवाष्प ऊपर उठती है"], ["d", "संघनन: बादल बनते हैं"], ["e", "वर्षा"], ["f", "नदियाँ और समुद्र"]],
  en: [["a", "Heat from the Sun"], ["b", "Evaporation"], ["c", "Water vapour rises"], ["d", "Condensation: clouds form"], ["e", "Rain"], ["f", "Rivers and the sea"]],
};
const EDGES = [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"], ["f", "b"]];
const flowRes = await page.evaluate(async ({ NODES, EDGES }) => {
  const add = (tag, attrs) => new Promise((res, rej) => { const e = document.createElement(tag); Object.assign(e, attrs); e.onload = res; e.onerror = rej; document.head.appendChild(e); });
  await add("script", { src: "/mermaid.min.js" }); await add("script", { src: "/viz.js" }); await add("script", { src: "/elk.js" }); await add("script", { src: "/dagre.js" });
  const viz = await Viz.instance(); const elk = new ELK();
  // Fonts: 'Mukta' is loaded now; 'MuktaLate' is the same files registered only AFTER render (the race).
  await document.fonts.load("16px Mukta", "क"); await document.fonts.load("16px Mukta", "a"); await document.fonts.load("16px NotoFB", "क");
  const lateCss = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).filter((r) => r.cssText.includes("Mukta") && r.cssText.startsWith("@font-face")).map((r) => r.cssText.replace(/'?Mukta'?/, "'MuktaLate'")).join("\n");
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", flowchart: { htmlLabels: true }, themeVariables: { fontFamily: "Mukta", fontSize: "16px" } });
  const canvas = document.createElement("canvas").getContext("2d");
  const measureNodes = (svg, nodeSel, labelSel) => {
    const out = [];
    for (const g of svg.querySelectorAll(nodeSel)) {
      const shape = g.querySelector("rect, polygon, ellipse, path, circle"); const lab = g.querySelector(labelSel);
      if (!shape || !lab) continue;
      const sw = shape.getBoundingClientRect().width;
      let lw; const inner = lab.querySelector("span, p, div");
      if (inner) { const rg = document.createRange(); rg.selectNodeContents(inner); lw = rg.getBoundingClientRect().width; } else lw = lab.getBoundingClientRect().width;
      out.push(+(lw - sw).toFixed(1));
    }
    return out;
  };
  const results = [];
  async function run(engine, lang, family, lateSwap) {
    const host = document.createElement("div"); host.style.width = "412px"; document.body.appendChild(host);
    const nodes = NODES[lang]; const t0 = performance.now(); let svg;
    if (engine.startsWith("mermaid")) {
      const html = engine === "mermaid-html";
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", flowchart: { htmlLabels: html }, htmlLabels: html, themeVariables: { fontFamily: family, fontSize: "16px" } });
      const src = "flowchart TD\n" + nodes.map(([i, l]) => `  ${i}["${l}"]`).join("\n") + "\n" + EDGES.map(([a, b]) => `  ${a} --> ${b}`).join("\n");
      const { svg: s } = await mermaid.render("m" + Math.random().toString(36).slice(2, 8), src); host.innerHTML = s; svg = host.querySelector("svg");
    } else if (engine === "graphviz") {
      const dot = `digraph G { rankdir=TB; node [shape=box, style=rounded, fontname="${family}", fontsize=16]; ` + nodes.map(([i, l]) => `${i} [label="${l}"];`).join(" ") + EDGES.map(([a, b]) => `${a} -> ${b};`).join(" ") + "}";
      svg = viz.renderSVGElement(dot); host.appendChild(svg);
    } else {
      // own renderer: measure with canvas in the SAME family the SVG paints with, then lay out
      canvas.font = `16px ${family}`; const pad = 12;
      const dims = nodes.map(([i, l]) => ({ id: i, l, w: Math.ceil(canvas.measureText(l).width) + 2 * pad, h: 40 }));
      let pos;
      if (engine === "elk+own") {
        const g = await elk.layout({ id: "root", layoutOptions: { "elk.algorithm": "layered", "elk.direction": "DOWN", "elk.spacing.nodeNode": "24" }, children: dims.map((d) => ({ id: d.id, width: d.w, height: d.h })), edges: EDGES.map(([a, b], k) => ({ id: "e" + k, sources: [a], targets: [b] })) });
        pos = Object.fromEntries(g.children.map((c) => [c.id, { x: c.x, y: c.y }]));
      } else {
        const g = new dagre.graphlib.Graph(); g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 32 }); g.setDefaultEdgeLabel(() => ({}));
        dims.forEach((d) => g.setNode(d.id, { width: d.w, height: d.h })); EDGES.forEach(([a, b]) => g.setEdge(a, b)); dagre.layout(g);
        pos = Object.fromEntries(dims.map((d) => { const n = g.node(d.id); return [d.id, { x: n.x - d.w / 2, y: n.y - d.h / 2 }]; }));
      }
      const NS = "http://www.w3.org/2000/svg"; svg = document.createElementNS(NS, "svg"); svg.setAttribute("width", "800"); svg.setAttribute("height", "900");
      for (const d of dims) { const g = document.createElementNS(NS, "g"); g.setAttribute("class", "node");
        const r = document.createElementNS(NS, "rect"); Object.entries({ x: pos[d.id].x, y: pos[d.id].y, width: d.w, height: d.h, rx: 10 }).forEach(([k, v]) => r.setAttribute(k, v));
        const t = document.createElementNS(NS, "text"); Object.entries({ x: pos[d.id].x + d.w / 2, y: pos[d.id].y + 26, "text-anchor": "middle", "font-family": family, "font-size": 16 }).forEach(([k, v]) => t.setAttribute(k, v)); t.textContent = d.l;
        g.append(r, t); svg.appendChild(g); }
      host.appendChild(svg);
    }
    const ms = +(performance.now() - t0).toFixed(1);
    if (lateSwap) { // the font arrives after layout: register MuktaLate now, and repaint every label in it
      const st = document.createElement("style"); st.textContent = lateCss; document.head.appendChild(st);
      await document.fonts.load("16px MuktaLate", "क"); await document.fonts.load("16px MuktaLate", "a");
      host.querySelectorAll("text, tspan, span, p, div").forEach((e) => { e.style.fontFamily = "MuktaLate"; if (e.tagName === "text" || e.tagName === "tspan") e.setAttribute("font-family", "MuktaLate"); });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    const sel = engine.startsWith("mermaid") ? ["g.node", ".label, text"] : engine === "graphviz" ? ["g.node", "text"] : ["g.node", "text"];
    const over = measureNodes(svg, sel[0], sel[1]);
    // phone fit: natural drawing width vs the 380-dp content column (412 dp − 2 × 16 gutter); label size after fit-to-width
    svg.style.maxWidth = "none"; svg.removeAttribute("style"); const bb = svg.getBBox ? svg.getBBox() : { width: 0, height: 0 };
    const fit = Math.min(1, 380 / bb.width);
    results.push({ engine, lang, font_at_layout: family, late_font: lateSwap, ms, nodes_measured: over.length, max_overflow_px: Math.max(...over), nodes_overflowing: over.filter((o) => o > 0).length,
      drawing_w: Math.round(bb.width), drawing_h: Math.round(bb.height), fit_scale: +fit.toFixed(2), label_px_after_fit: +(16 * fit).toFixed(1), svg_bytes: svg.outerHTML.length });
    host.remove();
  }
  for (const engine of ["mermaid-html", "mermaid-svgtext", "graphviz", "elk+own", "dagre+own"])
    for (const lang of ["en", "hi"]) {
      await run(engine, lang, "Mukta", false);
      await run(engine, lang, "NotoFB, sans-serif", true); // laid out with Noto Sans Devanagari (Android's system fallback), painted with Mukta afterwards
    }
  return results;
}, { NODES, EDGES });

await browser.close();
const out = { date: "2026-10-02", method: "headless Chromium " + "(playwright), viewport 412x915 @2.625, Mukta woff2 from Google Fonts; times are single-run wall ms in-page", payload, katex: katexRes, flowcharts: flowRes, console_sample: consoleMsgs.slice(0, 20) };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ payload }, null, 1));
for (const r of katexRes) console.log("katex", JSON.stringify(r));
for (const r of flowRes) console.log("flow", JSON.stringify(r));
