// The Studio stream guard (LIVE-STUDIO §1 item 2, §3.5; v0's "LLM Suspense"): a builder's tokens are rewritten AT TOKEN
// TIME, before anything reaches the veil frame or the gate, so the child's screen never shows a forbidden thing even for
// one partial paint. Deterministic, no model, no DOM. It removes (and records as a repair hint):
//   - URLs (http(s)://, protocol-relative src/href, CSS url() to anything but data: or #), except the SVG/XHTML
//     namespace URIs that inline SVG needs;
//   - network: fetch(, XMLHttpRequest, WebSocket, EventSource, sendBeacon, dynamic import(, importScripts(;
//   - eval / new Function / string timers;
//   - storage: localStorage, sessionStorage, indexedDB, document.cookie;
//   - tags that load or embed: <script src>, <link>, <iframe>, <object>, <embed>, <base>, <meta http-equiv>;
//   - Studio.t("<key>") with a key that is not in the strings table (→ "" : words come only from the table, G3).
// Replacements keep the code parseable (a forbidden call becomes an inert one), so the gate then judges behaviour; the
// hints go to the repair prompt so the next round is told what was removed.
//
// Streaming discipline: a rule can only fire on text it can see whole, so the guard COMMITS a prefix only up to a point
// no pattern can straddle: it holds back the last HOLD chars and, before that, any suspicious token that has not ended.
// Rules are local (no match spans a commit point), so guard(a) + guard(b) === guard(a + b) for every split (tested).

const HOLD = 96;

/** Namespace URIs inline SVG legitimately carries (xmlns). */
const NS_OK = /^https?:\/\/www\.w3\.org\/(2000\/svg|1999\/xhtml|1999\/xlink|XML\/1998\/namespace)["'\s>]?$/;

/** @typedef {{ rule: string, sample: string }} GuardHint */

/**
 * The rewrite rules, applied in order to committed text. Each: [rule id, regex (global), replacer].
 * @param {Set<string> | null} keys the strings table's keys (null = do not check keys)
 */
function rules(keys) {
  return [
    ["embed_tag", /<\/?(?:link|iframe|object|embed|base|frame|frameset|applet)\b[^>]*>/gi, () => ""],
    ["meta_tag", /<meta\b[^>]*>/gi, () => ""],
    ["script_src_attr", /(<script\b[^>]*?)\s+src\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (_m, a) => a],
    ["css_url", /url\(\s*(?!["']?\s*(?:data:|#))[^)]*\)/gi, () => "none"],
    ["proto_rel", /\b(src|href|xlink:href|action|formaction|poster|data)\s*=\s*(["'])\s*\/\/[^"']*\2/gi, (_m, a, q) => `${a}=${q}${q}`],
    ["url", /\bhttps?:\/\/[^\s"'<>()`\\]*/gi, (m) => (NS_OK.test(m) || NS_OK.test(m + '"') ? m : "")],
    ["www", /\bwww\.[a-z0-9-]+\.[a-z]{2,}[^\s"'<>()`\\]*/gi, () => ""],
    ["fetch", /\bfetch\s*\(/g, () => "(function(){return Promise.reject()})("],
    ["xhr", /\b(?:XMLHttpRequest|WebSocket|EventSource|SharedWorker|Worker|BroadcastChannel|RTCPeerConnection)\b/g, () => "Object"],
    ["beacon", /\bnavigator\s*\.\s*sendBeacon\s*\(/g, () => "(function(){return false})("],
    ["dynamic_import", /\bimport\s*\(/g, () => "Promise.reject("],
    ["import_scripts", /\bimportScripts\s*\(/g, () => "void("],
    ["eval", /\beval\s*\(/g, () => "String("],
    ["function_ctor", /\bnew\s+Function\s*\(/g, () => "String("],
    ["string_timer", /\b(setTimeout|setInterval)\s*\(\s*(["'`])/g, (_m, f, q) => `${f}(function(){},0,${q}`],
    ["storage", /\b(?:window\s*\.\s*)?(?:localStorage|sessionStorage)\b/g, () => "({getItem:function(){return null},setItem:function(){},removeItem:function(){},clear:function(){}})"],
    ["indexeddb", /\b(?:window\s*\.\s*)?indexedDB\b/g, () => "undefined"],
    ["cookie", /\bdocument\s*\.\s*cookie\b/g, () => "window.__noCookie"],
    ...(keys ? [["unknown_key", /\bStudio\s*\.\s*t\s*\(\s*(["'`])([^"'`\\]{0,40})\1\s*\)/g, (m, _q, k) => (keys.has(k) ? m : '""')]] : []),
  ];
}

/** Where a suspicious token starts that may still be growing (its end is not in the text yet): hold from there. */
const OPENERS = /<(?:link|iframe|object|embed|base|meta|script|frame|applet)\b[^>]*$|url\([^)]*$|\b(?:src|href|xlink:href|action|data|poster)\s*=\s*["'][^"']*$|\bhttps?:\/\/[^\s"'<>()`\\]*$|\bwww\.[^\s"'<>()`\\]*$|\bStudio\s*\.\s*t\s*\([^)]*$|\b(?:setTimeout|setInterval)\s*\(\s*$|\bnew\s+Function\s*$|\bnew\s*$|\bnavigator\s*\.?\s*$|\bdocument\s*\.?\s*$|\bwindow\s*\.?\s*$/i;

/**
 * Rewrite a complete text with every rule. Pure.
 * @returns {{ text: string, hints: GuardHint[] }}
 */
export function guardText(text, { keys = null } = {}) {
  const hints = [];
  let out = String(text ?? "");
  for (const [rule, re, rep] of rules(keys ? new Set(keys) : null)) {
    out = out.replace(re, (...a) => {
      const r = rep(...a);
      if (r !== a[0]) hints.push({ rule, sample: String(a[0]).slice(0, 60) });
      return r;
    });
  }
  return { text: out, hints };
}

/**
 * A streaming guard. `push(delta)` returns the newly COMMITTED guarded text (may be ""); `end()` flushes the rest.
 * `text` is everything committed so far; `hints` every rewrite (rule + a 60-char sample).
 * @param {{ keys?: string[] | null }} [opts]
 */
export function createStreamGuard({ keys = null } = {}) {
  let raw = "";          // received, not yet committed
  let text = "";         // committed (guarded) output
  const hints = [];
  const commit = (n) => {
    if (n <= 0) return "";
    const g = guardText(raw.slice(0, n), { keys });
    raw = raw.slice(n);
    text += g.text;
    hints.push(...g.hints);
    return g.text;
  };
  return {
    push(delta) {
      raw += String(delta ?? "");
      let n = raw.length - HOLD;
      if (n <= 0) return "";
      // never cut inside a suspicious token: move the cut back to where it starts
      const head = raw.slice(0, n);
      const m = OPENERS.exec(head.slice(-400));
      if (m) n = head.length - (head.slice(-400).length - m.index);
      // never cut a word or a tag name in two (a rule's \b anchors need the whole token)
      while (n > 0 && /[\w$.]/.test(raw[n - 1]) && /[\w$.(]/.test(raw[n])) n--;
      return commit(n);
    },
    end() { return commit(raw.length); },
    get text() { return text; },
    get hints() { return hints.slice(); },
    get pending() { return raw.length; },
  };
}

/** The repair hint lines for a set of guard hints (shapes, never the removed code). */
export function hintLines(hints) {
  const by = new Map();
  for (const h of hints) by.set(h.rule, (by.get(h.rule) ?? 0) + 1);
  return [...by].map(([rule, n]) => `stream_guard.${rule}: removed ${n}x (forbidden in the sandbox)`);
}
