// The gate's page: the trusted studio-kit@1 runtime (LIVE-STUDIO D2, §5.1) + the build, under the production CSP
// (hash-only scripts, no network), at exactly the archetype's design size. The runtime here is the reference the
// in-lesson frame runtime (W2-H, src/studio/kit/runtime.js) mirrors; the two must agree on the API and its freezes.
//
// Truth stays in Node: Studio.answer posts to the host binding (Playwright exposeBinding) and the host's grader
// answers; the page never holds the key. The binding is captured into the runtime's closure and deleted from window
// before the build runs, so a build cannot forge host events (and G0 bans `__` names anyway).
import { createHash } from "node:crypto";

export const HOST_BINDING = "__studioHost";

const sha = (s) => createHash("sha256").update(s, "utf8").digest("base64");
/** The hash-only meta CSP for a page whose scripts are exactly `scripts` (LIVE-STUDIO §5.1). */
export function cspFor(scripts) {
  return ["default-src 'none'", `script-src ${scripts.map((s) => `'sha256-${sha(s)}'`).join(" ")}`, "style-src 'unsafe-inline'",
    "img-src data: blob:", "font-src 'none'", "connect-src 'none'", "media-src 'none'", "frame-src 'none'", "worker-src 'none'",
    "child-src 'none'", "form-action 'none'", "base-uri 'none'", "object-src 'none'", "manifest-src 'none'"].join("; ");
}

/** A seeded PRNG source (mulberry32) as code: Math.random becomes deterministic per build session (G10 by construction). */
const PRNG = "function(s){return function(){s=(s+0x6d2b79f5)>>>0;var t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}";

/**
 * The runtime source for one session. `params` is what the BUILD sees (hostOnly removed); `strings` the table.
 * @param {{ params: object, strings: Record<string,string>, lang?: string, seed?: number }} o
 */
export function runtimeSource({ params, strings, lang = "hinglish", seed = 1 }) {
  return `(function(){
"use strict";
var host = window.${HOST_BINDING}; try { delete window.${HOST_BINDING}; } catch (e) {}
var send = function (m) { try { return host(m); } catch (e) { return Promise.resolve(null); } };
var P = ${JSON.stringify(params)}, S = ${JSON.stringify(strings)};
var has = Object.prototype.hasOwnProperty;
function deep(o) { Object.freeze(o); Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === "object") deep(o[k]); }); return o; }
var cbs = [], readyOnce = false, doneOnce = false, evN = 0, evT = 0;
Math.random = (${PRNG})(${(seed >>> 0) || 1});
var Studio = {
  params: deep(JSON.parse(JSON.stringify(P))), lang: ${JSON.stringify(lang)},
  t: function (k) { if (typeof k !== "string" || !has.call(S, k)) { send({ type: "bad_key", key: String(k).slice(0, 40) }); return ""; } return S[k]; },
  answer: function (v) {
    var j = null; try { j = JSON.parse(JSON.stringify(v === undefined ? null : v)); } catch (e) {}
    send({ type: "answer", value: j }).then(function (r) {
      var c = !!(r && r.correct);
      setTimeout(function () { cbs.forEach(function (cb) { try { cb({ correct: c }); } catch (e) { send({ type: "cb_threw", message: String(e).slice(0, 120) }); } }); }, 30);
    });
  },
  onVerdict: function (cb) { if (typeof cb === "function" && cbs.length < 8) cbs.push(cb); },
  event: function (n, d) { var now = Date.now(); if (now - evT > 1000) { evT = now; evN = 0; } if (++evN > 10) return; var s = ""; try { s = JSON.stringify(d || {}); } catch (e) {} if (s.length > 1024) return; send({ type: "event", name: String(n).slice(0, 32) }); },
  ready: function () { if (readyOnce) return; readyOnce = true; send({ type: "ready" }); },
  done: function () { if (doneOnce) { send({ type: "done_again" }); return; } doneOnce = true; send({ type: "done" }); }
};
Object.freeze(Studio);
Object.defineProperty(window, "Studio", { value: Studio, writable: false, configurable: false });
[Object, Array, Function, String, Number, Boolean, Math, JSON, Promise, Map, Set].forEach(function (C) { try { Object.freeze(C); if (C.prototype) Object.freeze(C.prototype); } catch (e) {} });
window.addEventListener("securitypolicyviolation", function (e) { send({ type: "csp", directive: String(e.violatedDirective || "").slice(0, 40) }); });
window.addEventListener("error", function (e) { send({ type: "page_error", message: String(e.message || "").slice(0, 160) }); });
})();`;
}

/** The full gate document: viewport = the design size, the runtime first, the build's one script last. */
export function gateDocument({ fragment, script, runtime, stage }) {
  const body = fragment;
  const scripts = [runtime, ...(script != null ? [script] : [])];
  return {
    html: `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${cspFor(scripts)}">` +
      `<meta name="viewport" content="width=${stage.w},initial-scale=1"><style>html,body{margin:0;padding:0;width:${stage.w}px;height:${stage.h}px}</style>` +
      `<script>${runtime}</script></head><body>${body}</body></html>`,
    scripts,
  };
}
