// tgk-lite@2 — the TRUSTED Forge G2 frame kit (browser code; inlined into every G2 bundle by ../bundle.js).
// FACTORY.md §4.2-4.4 in the smallest form that keeps the laws: agent code is one `defineMechanic({...})` call that
// owns only the mechanic (pure init/reduce, targets, render, facts). The KIT owns everything a grade depends on:
//   - the bridge (ModuleToHost / HostToModule, shared/contracts.ts): page-level "ready", then init + MessagePort;
//   - values: agent code never holds a value, only OPAQUE refs from ctx.refs ({item, slot: "o:<per-mount nonce>"}); the
//     token → slot map (key / d:N / u:K) lives in this closure only, and the option order is shuffled with
//     crypto randomness per mount, so neither a ref nor a position says which option is the key; the kit resolves refs, draws
//     every numeral and every bound target label itself (label ≡ bound value by construction, §4.3 item 4);
//   - the observation: choice = the last accepted `choose` ref; build = a kit-owned shadow of unit counts that must
//     agree with facts(model) after every accepted action (§4.3 item 3, else state_diverged);
//   - grading against the item key the server expanded from the verified kit (a model never grades);
//   - the item cursor, goal_met (once), stuck, reveal/highlight, feel (CSS) and the 30-ish ms call budget.
// Runtime refusals (ForgeContract) are the boundary; the Q1 lint (../lint.js) is only a first net. Before agent code runs
// the kit FREEZES the shared intrinsics (Object/Array/String/… and their prototypes, iterator prototypes, MessagePort):
// agent code runs in the kit's realm, so a patched Array.prototype.filter could otherwise change what the kit posts.
// The QA seam: if the harness defined `__forgeSeamInstall` before this script ran (page.addInitScript), the kit
// hands it a frozen read-only view. Production never defines it, and agent code cannot name it (lint + shadowing).
/* eslint-disable no-var */
function __tgkBoot(agentFactory, DESIGN) {
  "use strict";
  var KIT_VERSION = "tgk-lite@2";
  var W = 360, H = 400;
  var seamInstall = typeof window.__forgeSeamInstall === "function" ? window.__forgeSeamInstall : null;
  var post0 = window.parent.postMessage.bind(window.parent);
  var jsonStr = JSON.stringify, now = performance.now.bind(performance);
  var cryptoFill = crypto.getRandomValues.bind(crypto);
  /** A fresh opaque token (never derived from the slot). Mutation probes in scripts/forge-g2-mutants.mjs anchor on this line. */
  function tokenFor(internal) { var a = new Uint32Array(2); cryptoFill(a); return "o:" + a[0].toString(36) + a[1].toString(36); }
  function randBelow(n) { var a = new Uint32Array(1); cryptoFill(a); return a[0] % n; }
  try { delete window.RTCPeerConnection; delete window.webkitRTCPeerConnection; delete window.RTCDataChannel; delete window.WebTransport; } catch (e) { /* non-configurable */ }
  var MODULE_ID = decodeURIComponent(location.hash.slice(1));
  var port = null, initMsg = null, announced = false;
  var findings = [], sent = [], violations = [];
  document.addEventListener("securitypolicyviolation", function (e) { violations.push({ dir: e.violatedDirective, uri: String(e.blockedURI || "").slice(0, 120) }); });

  // ───── exact values (ints, fractions, decimals; else text) ─────
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function rat(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function parseNum(s) {
    var t = String(s == null ? "" : s).trim().replace(/[−–]/g, "-").replace(/,/g, "");
    var m;
    if ((m = t.match(/^(-?\d{1,6}) (\d{1,4})\/(\d{1,4})$/))) return +m[3] ? rat((+m[1] < 0 ? -1 : 1) * (Math.abs(+m[1]) * +m[3] + +m[2]), +m[3]) : null;
    if ((m = t.match(/^(-?\d{1,6})\s*\/\s*(\d{1,6})$/))) return +m[2] ? rat(+m[1], +m[2]) : null;
    if ((m = t.match(/^(-?\d{1,9})$/))) return rat(+m[1], 1);
    if ((m = t.match(/^(-?\d{1,6})\.(\d{1,4})$/))) return rat(+(m[1] + m[2]), Math.pow(10, m[2].length));
    return null;
  }
  function addR(a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fold(s) { return String(s == null ? "" : s).replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().replace(/[.!?।]+$/u, ""); }
  function same(a, b) {
    var x = parseNum(a), y = parseNum(b);
    if (x && y) return x.n === y.n && x.d === y.d;
    if (x || y) return false;
    return fold(a) === fold(b);
  }
  function rstr(r) { return r.d === 1 ? String(r.n) : r.n + "/" + r.d; }

  // ───── seeded rng (mulberry32) ─────
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; var t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function post(msg) { if (port) { sent.push(msg); port.postMessage(msg); } }
  function finding(code, detail) {
    var f = { code: code, detail: String(detail || "").slice(0, 200), at: Math.round(now()) };
    findings.push(f);
    return f;
  }
  function contractError(code, detail) {
    finding("ForgeContract." + code, detail);
    if (!state.failed) { state.failed = true; post({ type: "error", moduleId: MODULE_ID, message: "contract:" + code }); renderFailed(); }
  }

  // ───── agent module (defined once, through the factory the bundle wraps around agent code) ─────
  var mechanic = null;
  var SAFE_MATH = Object.freeze(Object.assign(Object.create(null), (function () {
    var o = {}; ["abs", "ceil", "floor", "round", "max", "min", "pow", "sqrt", "sin", "cos", "atan2", "hypot", "sign", "trunc", "PI"].forEach(function (k) { o[k] = Math[k]; });
    o.random = function () { throw new Error("Math.random is not available: use ctx.rng()"); };
    return o;
  })()));
  (function hardenIntrinsics() {
    function fz(o) { if (o && (typeof o === "object" || typeof o === "function") && !Object.isFrozen(o)) Object.freeze(o); }
    ["Object", "Array", "Function", "String", "Number", "Boolean", "Symbol", "BigInt", "JSON", "Math", "Map", "Set", "WeakMap", "WeakSet",
      "Promise", "RegExp", "Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "EvalError", "URIError", "Reflect",
      "ArrayBuffer", "DataView", "Uint8Array", "Uint32Array", "Float64Array", "MessagePort", "EventTarget", "Iterator"].forEach(function (n) {
      var c = window[n]; if (!c) return; fz(c); if (c.prototype) fz(c.prototype);
    });
    var ai = Object.getPrototypeOf([][Symbol.iterator]()); fz(ai); fz(Object.getPrototypeOf(ai));
    fz(Object.getPrototypeOf(new Map()[Symbol.iterator]())); fz(Object.getPrototypeOf(new Set()[Symbol.iterator]()));
    fz(Object.getPrototypeOf(""[Symbol.iterator]())); fz(Object.getPrototypeOf(Uint8Array)); fz(Object.getPrototypeOf(Uint8Array.prototype));
  })();
  try {
    agentFactory(function defineMechanic(m) { if (mechanic) throw new Error("defineMechanic called twice"); mechanic = m; }, SAFE_MATH);
  } catch (e) { finding("Agent.define_threw", e && e.message); }

  // ───── palette and strings (closed; agent passes tokens and keys, never colours or text) ─────
  var PALETTE = { ink: "#1f2430", paper: "#fffaf2", chalk: "#ffffff", sky: "#5aa9e6", water: "#2f7fc1", leaf: "#3f9b5a", sun: "#f2b33d", berry: "#c8457a", stone: "#8a8f98", earth: "#a0673a", night: "#24315e", sand: "#e9d8a6" };
  var STRINGS = (DESIGN && DESIGN.strings) || {};
  function langKey(lang) { return lang === "english" ? "en" : lang === "hindi" ? "hi" : "hi_latn"; }
  function sayKey(key) { var row = STRINGS[key]; if (!row) return null; return row[langKey(state.lang)] || row.en || null; }
  var KIT_TEXT = {
    check: { en: "Check", hi: "जाँचो", hi_latn: "Check karo" },
    clear: { en: "Clear", hi: "मिटाओ", hi_latn: "Mitao" },
    great: { en: "Well done!", hi: "बहुत बढ़िया!", hi_latn: "Bahut badhiya!" },
    again: { en: "Try again", hi: "फिर से कोशिश करो", hi_latn: "Phir se try karo" },
    stopped: { en: "This activity stopped working. Your teacher will carry on.", hi: "यह गतिविधि रुक गई। टीचर आगे बढ़ेंगे।", hi_latn: "Yeh activity ruk gayi. Teacher aage chalenge." },
  };
  function kitSay(k) { return KIT_TEXT[k][langKey(state.lang)] || KIT_TEXT[k].en; }

  // ───── state ─────
  var state = { lang: "hinglish", ageBand: "10-15", levels: [], li: 0, ii: 0, model: null, selection: null, shadow: null,
    wrong: Object.create(null), stuckSent: Object.create(null), attempts: Object.create(null), tokens: Object.create(null), optRefs: [], unitRefs: [], won: false, failed: false, revealed: false, rng: rngOf(1), fx: [], goal: "complete", busy: false };
  function levelNow() { return state.levels[state.li]; }
  function itemNow() { var l = levelNow(); return l && l.items[state.ii]; }
  function minTarget() { return state.ageBand === "6-9" ? 56 : 44; }

  // ───── refs (the only source of values agent code may touch) ─────
  function resolve(ref) {
    if (!ref || typeof ref !== "object") return null;
    var it = itemNow();
    if (!it || ref.item !== it.id || typeof ref.slot !== "string") return null;
    var s = state.tokens[ref.slot];
    if (!s) return null;
    if (s === "key") return { slot: "key", id: "key", v: it.key.v, label: it.key.label };
    var m = s.match(/^d:(\d{1,2})$/);
    if (m) { var d = it.distractors[+m[1]]; return d ? { slot: "d", id: s, v: d.v, label: d.label, misc: d.misc || null } : null; }
    m = s.match(/^u:(\d{1,2})$/);
    if (m) { var u = (it.units || [])[+m[1]]; return u ? { slot: "u", id: s, k: +m[1], v: u.v, label: u.label } : null; }
    return null;
  }
  /** New opaque refs for the active item (called once per item start): token → slot stays in this closure. */
  function mintRefs() {
    var it = itemNow(), id = it ? it.id : "";
    state.tokens = Object.create(null);
    var slots = ["key"].concat((it ? it.distractors : []).map(function (_, i) { return "d:" + i; }));
    // crypto-shuffled per mount: the key's position carries nothing an agent (or a known seed) could reproduce
    for (var i = slots.length - 1; i > 0; i--) { var j = randBelow(i + 1); var t = slots[i]; slots[i] = slots[j]; slots[j] = t; }
    state.optRefs = it && it.mode !== "build" ? slots.map(function (sl) { var tk = tokenFor(sl); state.tokens[tk] = sl; return Object.freeze({ item: id, slot: tk }); }) : [];
    state.unitRefs = ((it && it.units) || []).map(function (_, k) { var tk = tokenFor("u:" + k); state.tokens[tk] = "u:" + k; return Object.freeze({ item: id, slot: tk }); });
  }
  function sameRef(a, b) { return !!(a && b && typeof a === "object" && typeof b === "object" && a.item === b.item && a.slot === b.slot && typeof a.slot === "string"); }
  function makeRefs() {
    var it = itemNow();
    var id = it ? it.id : "";
    var opts = state.optRefs, units = state.unitRefs;
    return Object.freeze({
      activeItem: function () { return id; },
      options: function () { return opts.slice(); },
      units: function () { return units.slice(); },
      count: function () { return opts.length; },
      /** The only way to compare two refs (reading `.slot` is a lint error; tokens are meaningless anyway). */
      same: function (a, b) { return sameRef(a, b); },
      indexOf: function (ref) { for (var i = 0; i < opts.length; i++) if (sameRef(opts[i], ref)) return i; for (var k = 0; k < units.length; k++) if (sameRef(units[k], ref)) return k; return -1; },
    });
  }
  function ctx() {
    var it = itemNow();
    return Object.freeze({ item: it ? it.id : "", itemIndex: state.ii, itemCount: levelNow() ? levelNow().items.length : 0, levelIndex: state.li,
      levelCount: state.levels.length, refs: makeRefs(), rng: state.rng, band: state.ageBand, lang: state.lang, W: W, H: H,
      mode: it ? it.mode : "choice", minTarget: minTarget(), shadow: state.shadow ? Object.freeze(state.shadow.slice()) : null });
  }
  function deepFreeze(o) { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); } return o; }
  function clone(o) { return o === undefined ? undefined : JSON.parse(jsonStr(o)); }
  /** One call into agent code: timed, exceptions become findings; a call over budget is a finding (loop guard lite). */
  function call(name, args) {
    if (!mechanic || typeof mechanic[name] !== "function") return { ok: false, err: "missing " + name };
    var t0 = now();
    try {
      var out = mechanic[name].apply(null, args);
      var ms = now() - t0;
      if (ms > 50) finding("Budget.slow_call", name + " " + Math.round(ms) + "ms");
      return { ok: true, out: out };
    } catch (e) { finding("Agent.threw", name + ": " + (e && e.message)); return { ok: false, err: e && e.message }; }
  }

  // ───── item lifecycle ─────
  function startItem() {
    var it = itemNow();
    state.selection = null;
    mintRefs();
    state.shadow = it && it.mode === "build" ? (it.units || []).map(function () { return 0; }) : null;
    var r = call("init", [ctx()]);
    if (!r.ok) return contractError("init_failed", r.err);
    try { state.model = deepFreeze(clone(r.out)); } catch (e) { return contractError("model_not_json", e.message); }
    checkShadow("init");
    draw();
  }
  function advance() {
    var l = levelNow();
    if (state.ii + 1 < l.items.length) { state.ii++; return startItem(); }
    if (state.li + 1 < state.levels.length) { state.li++; state.ii = 0; return startItem(); }
    if (!state.won) { state.won = true; post({ type: "goal_met", moduleId: MODULE_ID, goal: state.goal }); }
    draw();
  }

  // ───── shadow (build archetype) ─────
  function checkShadow(where) {
    if (!state.shadow) return true;
    var r = call("facts", [state.model]);
    var f = r.ok && r.out && typeof r.out === "object" ? r.out : {};
    for (var k = 0; k < state.shadow.length; k++) {
      if (f["n_" + k] !== state.shadow[k]) { contractError("state_diverged", where + " n_" + k + " facts=" + f["n_" + k] + " shadow=" + state.shadow[k]); return false; }
    }
    return true;
  }
  function shadowTotal() {
    var it = itemNow(); var tot = rat(0, 1);
    for (var k = 0; k < state.shadow.length; k++) { var v = parseNum(it.units[k].v); if (!v) return null; for (var c = 0; c < state.shadow[k]; c++) tot = addR(tot, v); }
    return tot;
  }

  // ───── targets: validated every time they are read ─────
  var targetsCache = null;
  function readTargets() {
    var r = call("targets", [state.model, ctx()]);
    if (!r.ok || !Array.isArray(r.out)) { contractError("targets_failed", r.err || "not an array"); return []; }
    var it = itemNow(), seen = Object.create(null), out = [], min = minTarget();
    for (var i = 0; i < r.out.length && i < 24; i++) {
      var t = r.out[i] || {};
      if (typeof t !== "object") t = {};
      if (typeof t.id !== "string" || !/^[a-z0-9_:-]{1,32}$/i.test(t.id) || seen[t.id]) { contractError("target_id", String(t.id)); return []; }
      seen[t.id] = 1;
      var rc = t.rect || {};
      if (![rc.x, rc.y, rc.w, rc.h].every(function (n) { return typeof n === "number" && isFinite(n); }) || rc.x < 0 || rc.y < 0 || rc.x + rc.w > W + 0.5 || rc.y + rc.h > H + 0.5) { contractError("target_offscreen", t.id); return []; }
      if (rc.w < min || rc.h < min) { contractError("target_too_small", t.id + " " + rc.w + "x" + rc.h + " < " + min); return []; }
      var spec = { id: t.id, kind: String(t.kind || "pad"), rect: { x: rc.x, y: rc.y, w: rc.w, h: rc.h }, action: String(t.action || "tap") };
      if (t.kind === "control") {
        if (t.valueRef !== undefined) { contractError("ref_on_control", t.id); return []; }
        if (["confirm", "clear"].indexOf(t.control) < 0) { contractError("bad_control", t.id); return []; }
        spec.control = t.control;
        if (t.labelKey !== undefined) { if (!STRINGS[t.labelKey]) { contractError("unknown_string", t.labelKey); return []; } spec.labelKey = t.labelKey; }
      } else {
        var ref = t.valueRef;
        if (!ref || typeof ref !== "object") { contractError("ref_missing", t.id); return []; }
        if (ref.item !== it.id) { contractError("ref_inactive_item", t.id); return []; }
        var res = resolve(ref);
        if (!res) { contractError("ref_unresolved", t.id + " " + jsonStr(ref)); return []; }
        var op = t.op || "choose";
        if ((op === "choose") !== (res.slot !== "u") || ["choose", "add", "remove"].indexOf(op) < 0) { contractError("ref_wrong_slot", t.id + " " + op + " " + ref.slot); return []; }
        if (it.mode === "build" && op === "choose") { contractError("ref_wrong_slot", t.id + " choose in build"); return []; }
        if (it.mode !== "build" && op !== "choose") { contractError("ref_wrong_slot", t.id + " " + op + " in choice"); return []; }
        spec.op = op; spec.ref = { item: ref.item, slot: ref.slot }; spec.res = res;
      }
      out.push(spec);
    }
    // overlapping targets are ambiguous to a finger
    for (var a = 0; a < out.length; a++) for (var b = a + 1; b < out.length; b++) {
      var p = out[a].rect, q = out[b].rect;
      var ox = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), oy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
      if (ox > 1 && oy > 1) { contractError("target_overlap", out[a].id + "/" + out[b].id); return []; }
    }
    if (it && it.mode !== "build" && !out.some(function (t) { return t.res && t.res.slot === "key"; })) { contractError("key_unreachable", it.id); return []; }
    if (it && it.mode === "build" && !out.some(function (t) { return t.control === "confirm"; })) { contractError("no_confirm", it.id); return []; }
    targetsCache = out;
    return out;
  }

  // ───── input: the ONLY path from a finger to reduce ─────
  function onTap(id) {
    if (state.failed || state.won || state.busy || !targetsCache) return;
    var t = targetsCache.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var action = Object.freeze({ type: t.action, target: t.id, ref: t.ref ? Object.freeze({ item: t.ref.item, slot: t.ref.slot }) : undefined, control: t.control });
    var r = call("reduce", [state.model, action, ctx()]);
    if (!r.ok) return contractError("reduce_failed", r.err);
    var o = r.out || {};
    if (o.reject) { pulse(t.id, "nudge"); return; }
    if (!("model" in o)) return contractError("reduce_shape", "no model");
    // kit-side observation, from the TargetSpec — never from the model
    if (t.op === "choose") state.selection = t.ref;
    if (state.shadow) {
      if (t.op === "add") state.shadow[t.res.k]++;
      else if (t.op === "remove") { if (state.shadow[t.res.k] === 0) return contractError("state_diverged", "remove at 0 accepted"); state.shadow[t.res.k]--; }
      else if (t.control === "clear") state.shadow = state.shadow.map(function () { return 0; });
    }
    try { state.model = deepFreeze(clone(o.model)); } catch (e) { return contractError("model_not_json", e.message); }
    if (!checkShadow("act")) return;
    state.fx = Array.isArray(o.fx) ? o.fx.slice(0, 4) : [];
    state.pendingFx = state.fx.filter(function (f) { return f && typeof f.target === "string" && ["pulse", "shake", "pop", "glow"].indexOf(f.kind) >= 0; });
    post({ type: "interaction", moduleId: MODULE_ID, name: "act", data: { item: itemNow().id, target: t.id, op: t.op || t.control || "tap" } });
    if (o.commit) return commit();
    draw();
  }
  function commit() {
    var it = itemNow(), value, ref = null, units = null;
    if (it.mode === "build") {
      var tot = shadowTotal();
      if (!tot) return contractError("bad_units", it.id);
      value = rstr(tot); units = state.shadow.slice();
    } else {
      if (!state.selection) return contractError("commit_without_selection", it.id);
      var res = resolve(state.selection);
      if (!res) return contractError("ref_unresolved", "selection");
      value = res.v; ref = { item: it.id, slot: res.id };       // the INTERNAL slot goes to the host; agent code never saw it
    }
    var correct = [it.key.v].concat(it.acceptable || []).some(function (k) { return same(k, value); });
    var d = correct ? null : it.distractors.filter(function (x) { return same(x.v, value); })[0];
    state.attempts[it.id] = (state.attempts[it.id] || 0) + 1;
    var payload = { kind: "g2.commit", item: it.id, value: value, attempt: state.attempts[it.id] };
    if (ref) payload.ref = { item: ref.item, slot: ref.slot };
    if (units) payload.units = units;
    if (d && d.misc) payload.misc = d.misc;
    post({ type: "answer", moduleId: MODULE_ID, value: payload, correct: correct });
    var fb = mechanic.feedback ? call("feedback", [state.model, Object.freeze({ correct: correct }), ctx()]) : { ok: true, out: state.model };
    if (fb.ok && fb.out !== undefined) { try { state.model = deepFreeze(clone(fb.out)); } catch (e) { return contractError("model_not_json", e.message); } }
    if (correct) {
      banner("great");
      state.busy = true; draw();
      setTimeout(function () { state.busy = false; banner(null); advance(); }, 700);
    } else {
      state.wrong[it.id] = (state.wrong[it.id] || 0) + 1;
      banner("again");
      if (state.wrong[it.id] >= 3 && !state.stuckSent[it.id]) { state.stuckSent[it.id] = 1; post({ type: "stuck", moduleId: MODULE_ID, reason: "wrong_x3" }); }
      if (!checkShadow("feedback")) return;
      draw();
    }
  }

  // ───── view: header (kit), world (agent draws through DrawApi), hit layer (kit) ─────
  var root = document.getElementById("root");
  root.innerHTML = "";
  var head = el("div", "tgk-head"), prompt = el("p", "tgk-prompt"), dots = el("div", "tgk-dots");
  head.appendChild(prompt); head.appendChild(dots);
  var stage = el("div", "tgk-stage");
  var SVGNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("class", "tgk-world"); svg.setAttribute("aria-hidden", "true");
  var hits = el("div", "tgk-hits"), msg = el("div", "tgk-banner");
  msg.setAttribute("role", "status");
  stage.appendChild(svg); stage.appendChild(hits);
  root.appendChild(head); root.appendChild(stage); root.appendChild(msg);     // the banner sits below the world, never over a target
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function banner(k) { msg.textContent = k ? kitSay(k) : ""; msg.dataset.kind = k || ""; }
  function renderFailed() { root.innerHTML = ""; var c = el("div", "tgk-card"); c.textContent = kitSay("stopped"); root.appendChild(c); }
  function color(tok, dflt) { return PALETTE[tok] || PALETTE[dflt] || PALETTE.ink; }
  function num(n, lo, hi) { n = +n; if (!isFinite(n)) n = 0; return Math.max(lo, Math.min(hi, n)); }
  function styleOf(node, s) {
    s = s || {};
    node.setAttribute("fill", s.fill === "none" ? "none" : color(s.fill, "sky"));
    if (s.stroke) { node.setAttribute("stroke", color(s.stroke, "ink")); node.setAttribute("stroke-width", String(num(s.width || 2, 0.5, 12))); }
    if (s.opacity !== undefined) node.setAttribute("opacity", String(num(s.opacity, 0.1, 1)));
    return node;
  }
  var drawCount = 0;
  function makeDraw(layer) {
    function add(tag, attrs, s, agent) { if (++drawCount > 600) return; var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, String(attrs[k])); styleOf(n, s); if (agent) n.setAttribute("data-a", "1"); layer.appendChild(n); }
    function textNode(str, x, y, s, kind) {
      if (++drawCount > 600) return;
      s = s || {};
      var n = document.createElementNS(SVGNS, "text");
      n.setAttribute("x", String(num(x, 0, W))); n.setAttribute("y", String(num(y, 0, H)));
      n.setAttribute("font-size", String(num(s.size || 18, 12, 64))); n.setAttribute("text-anchor", s.anchor === "start" || s.anchor === "end" ? s.anchor : "middle");
      n.setAttribute("dominant-baseline", "middle"); n.setAttribute("fill", color(s.fill, "ink")); n.setAttribute("font-weight", s.bold ? "700" : "500");
      n.textContent = str; n.setAttribute("data-k", kind || "w"); layer.appendChild(n);
    }
    return Object.freeze({
      rect: function (x, y, w, h, s) { add("rect", { x: num(x, -W, 2 * W), y: num(y, -H, 2 * H), width: num(w, 0, 2 * W), height: num(h, 0, 2 * H), rx: num((s || {}).r || 0, 0, 200) }, s, 1); },
      circle: function (cx, cy, r, s) { add("circle", { cx: num(cx, -W, 2 * W), cy: num(cy, -H, 2 * H), r: num(r, 0, 400) }, s, 1); },
      line: function (x1, y1, x2, y2, s) { s = Object.assign({ stroke: "ink", fill: "none" }, s || {}); add("line", { x1: num(x1, -W, 2 * W), y1: num(y1, -H, 2 * H), x2: num(x2, -W, 2 * W), y2: num(y2, -H, 2 * H) }, s, 1); },
      poly: function (pts, s) { if (!Array.isArray(pts) || pts.length > 64) return; add("polygon", { points: pts.map(function (p) { return num(p[0], -W, 2 * W) + "," + num(p[1], -H, 2 * H); }).join(" ") }, s, 1); },
      /** Words only by strings-table key; a missing key draws nothing (and is a finding). */
      text: function (key, x, y, s) { var t = sayKey(key); if (t == null) { finding("Agent.unknown_string", key); return; } textNode(t, x, y, s); },
      /** Numerals only through a ref (or the shadow readout), resolved and drawn by the kit. */
      numeral: function (ref, x, y, s) {
        if (ref && ref.readout === "shadow") { if (!state.shadow) return; var tot = shadowTotal(); if (tot) textNode(rstr(tot), x, y, s); return; }
        var res = resolve(ref); if (!res) { finding("ForgeContract.numeral_unresolved", jsonStr(ref)); return; }
        drawnSlots[res.id] = 1;
        textNode(res.label, x, y, s, "n");
      },
      /** A picture of a value, drawn by the KIT from the resolved ref (fraction → bar or pie, whole number ≤ 20 → dots).
       *  The only way a quantity picture may appear: a hand-drawn partition is unbound and a reviewer will reject it. */
      model: function (ref, x, y, w, h, o) {
        var res = resolve(ref); if (!res) { finding("ForgeContract.model_unresolved", jsonStr(ref)); return; }
        var v = parseNum(res.v); if (!v || v.n < 0) { finding("ForgeContract.model_not_numeric", res.label); return; }
        drawnSlots[res.id] = 1;
        x = num(x, 0, W); y = num(y, 0, H); w = num(w, 8, W); h = num(h, 8, H);
        var kind = (o && o.kind) || (v.d > 1 ? "bar" : "dots");
        if (v.d > 1) {
          var d = v.d, n = v.n;
          if (d > 24 || n > 2 * d) { finding("ForgeContract.model_range", res.label); return; }
          var lab = String(res.label).match(/^(\d+)\s*\/\s*(\d+)$/); if (lab) { n = +lab[1]; d = +lab[2]; }     // as written (2/4 stays 2/4)
          if (kind === "pie") {
            var r = Math.min(w, h) / 2, cx = x + w / 2, cy = y + h / 2;
            add("circle", { cx: cx, cy: cy, r: r }, { fill: "chalk", stroke: "ink" });
            for (var i = 0; i < Math.min(n, d); i++) { var a0 = 2 * Math.PI * i / d - Math.PI / 2, a1 = 2 * Math.PI * (i + 1) / d - Math.PI / 2;
              add("path", { d: "M" + cx + "," + cy + " L" + (cx + r * Math.cos(a0)) + "," + (cy + r * Math.sin(a0)) + " A" + r + "," + r + " 0 0 1 " + (cx + r * Math.cos(a1)) + "," + (cy + r * Math.sin(a1)) + " Z" }, { fill: "sun", stroke: "ink", width: 1 }); }
            for (var j = 0; j < d; j++) { var a = 2 * Math.PI * j / d - Math.PI / 2; add("line", { x1: cx, y1: cy, x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) }, { fill: "none", stroke: "ink", width: 1 }); }
          } else {
            var wholes = Math.max(1, Math.ceil(n / d)), bh = h / wholes;
            for (var b = 0; b < wholes; b++) for (var k = 0; k < d; k++) {
              add("rect", { x: x + k * w / d, y: y + b * bh, width: w / d, height: bh * 0.9 }, { fill: b * d + k < n ? "sun" : "chalk", stroke: "ink", width: 1 });
            }
          }
          return;
        }
        if (v.n > 20) { finding("ForgeContract.model_range", res.label); return; }
        var per = Math.ceil(Math.sqrt(Math.max(1, v.n))), cell = Math.min(w, h) / per;
        for (var q = 0; q < v.n; q++) add("circle", { cx: x + (q % per + 0.5) * cell, cy: y + (Math.floor(q / per) + 0.5) * cell, r: cell * 0.38 }, { fill: "berry" });
      },
    });
  }
  var drawnSlots = {};
  function pulse(id, kind) {
    var b = hits.querySelector('[data-tgk-target="' + id + '"]');
    if (!b) return;
    b.classList.remove("fx-" + kind); void b.offsetWidth; b.classList.add("fx-" + kind);
  }
  function draw() {
    if (state.failed) return;
    var it = itemNow();
    prompt.textContent = state.won ? kitSay("great") : it ? (state.lang === "english" ? it.prompt.en : it.prompt.hi || it.prompt.en) : "";
    dots.innerHTML = "";
    var l = levelNow();
    if (l) for (var i = 0; i < l.items.length; i++) { var d = el("span", "tgk-dot" + (i < state.ii || state.won ? " done" : i === state.ii ? " now" : "")); dots.appendChild(d); }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    drawCount = 0;
    var g = document.createElementNS(SVGNS, "g"); svg.appendChild(g);
    drawnSlots = {};
    if (!state.won) call("render", [state.model, makeDraw(g), ctx(), state.fx]);
    // a value the agent draws for the key but not for every option singles the key out (a leak by picture)
    if (it && it.mode !== "build" && drawnSlots.key) {
      for (var di = 0; di < it.distractors.length; di++) if (!drawnSlots["d:" + di]) { contractError("key_singled_out", "key drawn, d:" + di + " not"); return; }
    }
    state.fx = [];
    hits.innerHTML = "";
    var ts = state.won ? [] : readTargets();
    if (state.failed) return;
    ts.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tgk-target kind-" + t.kind.replace(/[^a-z]/g, "") + (t.control ? " control" : "");
      b.dataset.tgkTarget = t.id;
      b.style.left = (t.rect.x / W * 100) + "%"; b.style.top = (t.rect.y / H * 100) + "%";
      b.style.width = (t.rect.w / W * 100) + "%"; b.style.height = (t.rect.h / H * 100) + "%";
      var label;
      if (t.control) label = t.labelKey ? sayKey(t.labelKey) : kitSay(t.control === "confirm" ? "check" : "clear");
      else label = t.op === "add" ? "+" + t.res.label : t.op === "remove" ? "−" + t.res.label : t.res.label;
      b.textContent = label;
      b.setAttribute("aria-label", label);
      if (state.revealed && t.res && t.res.slot === "key") b.classList.add("fx-reveal");
      b.addEventListener("click", function () { onTap(t.id); });
      hits.appendChild(b);
    });
    (state.pendingFx || []).forEach(function (f) { pulse(f.target, f.kind); });
    state.pendingFx = [];
  }

  // ───── bridge ─────
  function handle(m) {
    if (!m || typeof m !== "object") return;
    if (m.type === "init") return start(m);
    if (m.type === "highlight" && typeof m.target === "string") return pulse(m.target, "glow");
    if (m.type === "reveal") { state.revealed = true; return draw(); }
    if (m.type === "reset" && initMsg) return start(initMsg);
  }
  function validLevels(p) {
    var lv = p && Array.isArray(p.levels) ? p.levels : null;
    if (!lv || !lv.length || lv.length > 6) return null;
    for (var i = 0; i < lv.length; i++) {
      var items = lv[i] && lv[i].items;
      if (!Array.isArray(items) || !items.length || items.length > 12) return null;
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        if (!it || typeof it.id !== "string" || !it.key || typeof it.key.v !== "string" || !Array.isArray(it.distractors) || !it.prompt) return null;
        if (it.mode === "build" && (!Array.isArray(it.units) || !it.units.length)) return null;
      }
    }
    return lv;
  }
  function start(m) {
    initMsg = m;
    var lv = validLevels(m.params);
    state.lang = m.lang || "hinglish"; state.ageBand = m.ageBand || "10-15"; state.goal = m.goal || "complete";
    if (!mechanic) { state.failed = true; post({ type: "error", moduleId: MODULE_ID, message: "mechanic not defined" }); return renderFailed(); }
    if (!lv) { state.failed = true; post({ type: "error", moduleId: MODULE_ID, message: "bad levels" }); return renderFailed(); }
    state.levels = lv; state.li = 0; state.ii = 0; state.won = false; state.failed = false; state.revealed = false;
    state.wrong = Object.create(null); state.stuckSent = Object.create(null); state.attempts = Object.create(null);
    state.seed = (m.params.seed >>> 0) || 1; state.rng = rngOf(state.seed);
    startItem();
  }
  window.addEventListener("message", function (e) {
    if (port || e.source !== window.parent || !e.ports || !e.ports[0]) return;
    if (!e.data || e.data.type !== "init" || e.data.moduleId !== MODULE_ID) return;
    port = e.ports[0];
    port.onmessage = function (ev) { handle(ev.data); };
    handle(e.data);
  });
  if (!announced) { announced = true; post0({ type: "ready", moduleId: MODULE_ID }, "*"); }

  if (seamInstall) {
    try {
      seamInstall(Object.freeze({
        version: KIT_VERSION,
        state: function () { var it = itemNow(); var sel = state.selection && resolve(state.selection); return clone({ li: state.li, ii: state.ii, item: it ? it.id : null, mode: it ? it.mode : null, won: state.won, failed: state.failed, shadow: state.shadow, selection: sel ? sel.id : null, model: state.model }); },
        targets: function () {
          return (targetsCache || []).map(function (t) {
            var b = hits.querySelector('[data-tgk-target="' + t.id + '"]'); var r = b ? b.getBoundingClientRect() : null;
            return { id: t.id, kind: t.kind, op: t.op || null, control: t.control || null, slot: t.res ? t.res.id : null, item: t.ref ? t.ref.item : null,
              value: t.res ? t.res.v : null, label: b ? b.textContent : null, bbox: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
              font: b ? parseFloat(getComputedStyle(b).fontSize) : null };
          });
        },
        findings: function () { return clone(findings); },
        sent: function () { return clone(sent); },
        violations: function () { return clone(violations); },
        textBoxes: function () {
          var vb = svg.getBoundingClientRect(), sx = W / vb.width, sy = H / vb.height;
          return Array.prototype.map.call(svg.querySelectorAll("text"), function (n) { var r = n.getBoundingClientRect();
            return { text: n.textContent, k: n.getAttribute("data-k"), x: (r.x - vb.x) * sx, y: (r.y - vb.y) * sy, w: r.width * sx, h: r.height * sy }; });
        },
        targetRects: function () { return (targetsCache || []).map(function (t) { return { id: t.id, x: t.rect.x, y: t.rect.y, w: t.rect.w, h: t.rect.h }; }); },
        /** Agent-drawn marks (primitives + words) nearest each option target, as a position-free signature. QA uses it
         *  to find a key that is DECORATED differently from every distractor (leak.key_styled). */
        optionMarks: function () {
          var vb = svg.getBoundingClientRect(), sx = W / vb.width, sy = H / vb.height, pad = 16;
          var opts = (targetsCache || []).filter(function (t) { return t.op === "choose"; });
          var sig = opts.map(function () { return []; });
          Array.prototype.forEach.call(svg.querySelectorAll('[data-a="1"], text[data-k="w"]'), function (n) {
            var r = n.getBoundingClientRect(), x = (r.x - vb.x) * sx, y = (r.y - vb.y) * sy, w = r.width * sx, h = r.height * sy;
            if (w * h > 0.5 * W * H) return;                                       // backgrounds touch everything equally
            var best = -1, bd = Infinity;
            opts.forEach(function (t, i) {
              var q = t.rect;
              if (x > q.x + q.w + pad || x + w < q.x - pad || y > q.y + q.h + pad || y + h < q.y - pad) return;
              var d = Math.pow(x + w / 2 - (q.x + q.w / 2), 2) + Math.pow(y + h / 2 - (q.y + q.h / 2), 2);
              if (d < bd) { bd = d; best = i; }
            });
            if (best >= 0) sig[best].push([n.tagName, n.getAttribute("fill"), n.getAttribute("stroke"), n.getAttribute("opacity"), Math.round(w / 4), Math.round(h / 4), n.textContent || ""].join("|"));
          });
          return opts.map(function (t, i) { return { slot: t.res.id, sig: sig[i].sort().join(";") }; });
        },
        prePromptText: function () { return (prompt.textContent || "") + "\n" + Array.prototype.map.call(svg.querySelectorAll('text[data-k="w"]'), function (n) { return n.textContent; }).join("\n"); },
      }));
    } catch (e) { /* the seam is QA-only */ }
  }
}
