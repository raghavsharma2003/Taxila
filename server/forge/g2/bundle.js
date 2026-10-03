// One bundle (FACTORY.md §0.2 law 5): the bytes that ship are the bytes that were gated. A G2 module is ONE
// self-contained index.html: the trusted kit (kit/runtime.js + kit/kit.css) and the agent's mechanic, inlined, under
// a meta CSP that allows exactly these two inline blocks by sha256 and nothing else (no network, no eval, no fonts,
// no frames). The agent source is wrapped in a strict function whose parameters shadow every ambient capability, so
// `window`, `fetch`, `Date`, … are `undefined` inside it, and `Math` is the kit's copy without `random`. The lint
// (lint.js) and the CSP + opaque-origin sandbox are the boundary; the shadowing is defence in depth.
import { readFileSync } from "fs";
import { createHash } from "crypto";

const DIR = new URL("./kit/", import.meta.url);
export const KIT_JS = readFileSync(new URL("runtime.js", DIR), "utf8");
export const KIT_CSS = readFileSync(new URL("kit.css", DIR), "utf8");
export const KIT_HASH = createHash("sha256").update(KIT_JS).update("\0").update(KIT_CSS).digest("hex").slice(0, 16);
export const KIT_VERSION = "tgk-lite@1";

/** Every ambient name agent code could use to reach outside the mechanic; all are `undefined` inside the wrapper. */
export const SHADOWED = ["window", "self", "globalThis", "document", "parent", "top", "opener", "frames", "location", "navigator",
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "BroadcastChannel", "RTCPeerConnection",
  "WebTransport", "Function", "setTimeout", "setInterval", "requestAnimationFrame", "queueMicrotask", "Date", "performance",
  "crypto", "localStorage", "sessionStorage", "indexedDB", "caches", "postMessage", "Reflect", "Proxy", "Image", "open",
  "__forgeSeamInstall", "__tgkBoot", "alert", "importScripts"];

/** Budgets (FACTORY.md §4.11 [U] for this kit: measured sizes in context/measurements.md forge-g2-*). */
export const SIZE_BUDGET = { agentBytes: 24 * 1024, bundleBytes: 96 * 1024 };

export const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const b64sha = (s) => createHash("sha256").update(s, "utf8").digest("base64");

/** The design data the kit needs at runtime (strings table only: no child data, no keys). */
export function runtimeDesign(design) {
  const strings = {};
  for (const s of design?.strings || []) strings[s.key] = { en: s.en, hi: s.hi, hi_latn: s.hi_latn };
  return { id: design?.id, strings };
}

/**
 * @param {string} mechanicSrc agent code: one `defineMechanic({...})` call (plus local helpers)
 * @param {object} design MechanicDesign (strings table is embedded)
 * @returns {{ html: string, sha: string, bytes: number, agentBytes: number, csp: string, kitHash: string }}
 */
export function buildBundle(mechanicSrc, design, { title = "Taxila activity" } = {}) {
  const agent = String(mechanicSrc).replace(/<\/script/gi, "<\\/script");
  const designJson = JSON.stringify(runtimeDesign(design)).replace(/</g, "\\u003c");
  const script = `${KIT_JS}\n;(function(){var DESIGN=${designJson};\n__tgkBoot(function(defineMechanic, Math, ${SHADOWED.join(", ")}){"use strict";\n${agent}\n}, DESIGN);})();\n`;
  const csp = [`default-src 'none'`, `script-src 'sha256-${b64sha(script)}'`, `style-src 'sha256-${b64sha(KIT_CSS)}'`,
    `img-src data:`, `font-src 'none'`, `connect-src 'none'`, `media-src 'none'`, `frame-src 'none'`, `worker-src 'none'`,
    `base-uri 'none'`, `form-action 'none'`].join("; ");
  const safeTitle = String(title).replace(/[<>&"]/g, "");
  const html = `<!doctype html>\n<html lang="en"><head><meta http-equiv="Content-Security-Policy" content="${csp}">` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer">` +
    `<title>${safeTitle}</title><style>${KIT_CSS}</style></head><body><div id="root"></div><script>${script}</script></body></html>\n`;
  return { html, sha: sha256(html), bytes: Buffer.byteLength(html), agentBytes: Buffer.byteLength(mechanicSrc), csp, kitHash: KIT_HASH };
}

/** The EngineDef a G2 module answers to (shared/contracts.ts EngineDef): params are the kit's, not the agent's. */
export function engineDefFor(design, { subjects = ["maths"] } = {}) {
  return {
    id: `g2:${design.id}`,
    title: design.title?.en || design.id,
    subjects,
    params: {
      levels: { type: "array", doc: "server-expanded LevelSpecs from the verified kit (levels.js): items with key, distractors, units" },
      seed: { type: "number", default: 1, min: 0, doc: "seed for the kit rng and the option shuffle" },
    },
    emits: ["act", "goal_met", "stuck"],
  };
}
