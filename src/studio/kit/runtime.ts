// The studio-kit@1 runtime for the child's frame (LIVE-STUDIO D2, §5.1; BUILD-PLAN W2-H #1). It mirrors the gate's
// reference runtime (server/studio/qa/page.js runtimeSource) API for API and freeze for freeze, so a build behaves in a
// lesson exactly as it did when the gate played it: Studio.params / t / answer / onVerdict / event / ready / done, the
// seeded Math.random (G10), frozen intrinsics, and the CSP violation and error reports.
//
// The only difference is the bridge. The gate captures a Playwright binding; the lesson captures a MessagePort that
// the host transfers in ONE page-level `init` message. The port lives only inside this closure, the window listener is
// removed once it has the port, and the build's script runs after all of that, so a build cannot reach the host except
// through Studio.*: a forged postMessage to the parent is ignored by the host (it listens on the port only), and
// Studio.answer carries only the child's claimed value: the host grades it (AT-10, AT-11).
//
// Pure string builder: no DOM, no imports (tests run it under node).

/** A seeded PRNG (mulberry32) as source text: the same one the gate uses. */
const PRNG = "function(s){return function(){s=(s+0x6d2b79f5)>>>0;var t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}";

export interface RuntimeInput {
  params: Record<string, unknown>;
  strings: Record<string, string>;
  lang?: string;
  seed?: number;
}

/** `{child}` is the only slot a host may fill in a string (LIVE-STUDIO §5.4); anything else is left as written. */
export function fillStrings(strings: Record<string, string>, slots: { child?: string } = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(strings ?? {})) {
    if (typeof v !== "string") continue;
    out[k] = slots.child ? v.split("{child}").join(slots.child) : v.split("{child}").join("");
  }
  return out;
}

/** JSON safe to place inside an inline <script> (no `</script`, no `<!--`, no U+2028/9). */
export function scriptJson(v: unknown): string {
  return JSON.stringify(v ?? null).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/** The runtime source for one mount. */
export function frameRuntimeSource({ params, strings, lang = "hinglish", seed = 1 }: RuntimeInput): string {
  return `(function(){
"use strict";
var port = null, queue = [];
var send = function (m) { if (port) { try { port.postMessage(m); } catch (e) {} } else if (queue.length < 64) queue.push(m); };
var onInit = function (e) {
  if (port || !e || e.source !== window.parent || !e.data || e.data.type !== "studio:init" || !e.ports || !e.ports[0]) return;
  // the init (and its port) is the runtime's alone: no listener the build adds ever sees it (capture phase, registered
  // before the build runs, and stopped here), so a build cannot answer through the port around Studio.answer's limits
  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
  port = e.ports[0];
  window.removeEventListener("message", onInit, true);
  port.onmessage = function (ev) { var m = ev && ev.data; if (m && m.type === "verdict") deliver(!!m.correct); };
  var q = queue; queue = []; q.forEach(send);
};
window.addEventListener("message", onInit, true);
var P = ${scriptJson(params)}, S = ${scriptJson(strings)};
var has = Object.prototype.hasOwnProperty;
function deep(o) { Object.freeze(o); Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === "object") deep(o[k]); }); return o; }
var cbs = [], readyOnce = false, doneOnce = false, evN = 0, evT = 0, pending = 0;
function deliver(c) { if (pending > 0) pending--; setTimeout(function () { cbs.forEach(function (cb) { try { cb({ correct: c }); } catch (e) { send({ type: "cb_threw", message: String(e).slice(0, 120) }); } }); }, 30); }
Math.random = (${PRNG})(${(seed >>> 0) || 1});
var Studio = {
  params: deep(JSON.parse(JSON.stringify(P))), lang: ${scriptJson(lang)},
  t: function (k) { if (typeof k !== "string" || !has.call(S, k)) { send({ type: "bad_key", key: String(k).slice(0, 40) }); return ""; } return S[k]; },
  answer: function (v) {
    var j = null; try { j = JSON.parse(JSON.stringify(v === undefined ? null : v)); } catch (e) {}
    var s = ""; try { s = JSON.stringify(j); } catch (e) {}
    if (s.length > 512) j = null;
    if (pending > 4) return;
    pending++;
    send({ type: "answer", value: j });
  },
  onVerdict: function (cb) { if (typeof cb === "function" && cbs.length < 8) cbs.push(cb); },
  event: function (n, d) { var now = Date.now(); if (now - evT > 1000) { evT = now; evN = 0; } if (++evN > 10) return; var s = ""; try { s = JSON.stringify(d || {}); } catch (e) {} if (s.length > 1024) return; send({ type: "event", name: String(n).slice(0, 32) }); },
  ready: function () { if (readyOnce) return; readyOnce = true; send({ type: "ready" }); },
  done: function () { if (doneOnce) return; doneOnce = true; send({ type: "done" }); }
};
Object.freeze(Studio);
Object.defineProperty(window, "Studio", { value: Studio, writable: false, configurable: false });
[Object, Array, Function, String, Number, Boolean, Math, JSON, Promise, Map, Set].forEach(function (C) { try { Object.freeze(C); if (C.prototype) Object.freeze(C.prototype); } catch (e) {} });
window.addEventListener("securitypolicyviolation", function (e) { send({ type: "csp", directive: String(e.violatedDirective || "").slice(0, 40) }); });
window.addEventListener("error", function (e) { send({ type: "error", message: String(e.message || "").slice(0, 160) }); });
})();`;
}
