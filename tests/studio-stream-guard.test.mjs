// W2-F (LIVE-STUDIO §3.5, test 4): the stream guard rewrites a builder's tokens at token time, and its output does not
// depend on where the stream was cut (guard(a) + guard(b) === guard(a + b) for every split), so a forbidden thing never
// reaches the veil even for one partial paint, and the SVG namespace URI inline SVG needs is never damaged (measured
// 2026-10-04: an earlier `www` rule removed it, and 10 of 17 failed bench arms were that bug, not the model).
import { test } from "node:test";
import assert from "node:assert/strict";
import { guardText, createStreamGuard, hintLines } from "../server/studio/stream-guard.js";
import { fixFragment, unfence } from "../server/studio/fixers.js";

const NASTY = `<style>.a{background:url(https://x.io/a.png)} .b{background:url(data:image/png;base64,AAA)}</style>
<link rel="stylesheet" href="https://cdn.x/s.css"><iframe src="https://evil"></iframe><meta http-equiv="refresh" content="0">
<svg xmlns="http://www.w3.org/2000/svg"><image href="//cdn.x/y"/><a href="#ok">k</a></svg>
<script src="https://cdn.x/lib.js"></script><script>
const ns='http://www.w3.org/2000/svg'; img.src="www.evil.com/x.png"; fetch(u); var u="https://evil.com/a";
localStorage.setItem(1,2); window.sessionStorage.x=1; indexedDB.open('d'); eval("x"); new Function("a"); setTimeout("alert(1)",5);
navigator.sendBeacon(u); import("x"); importScripts("y"); document.cookie=1; new WebSocket(u); new XMLHttpRequest();
Studio.t("nope"); Studio.t('title'); Studio.t(\`check\`);
</script>`;

test("every forbidden family is removed and recorded; the SVG namespace and data: urls survive", () => {
  const { text, hints } = guardText(NASTY, { keys: ["title", "check"] });
  for (const bad of ["https://x.io", "cdn.x", "https://evil", "www.evil", "<iframe", "<link", "<meta", "fetch(", "localStorage", "sessionStorage", "indexedDB",
    "eval(", "new Function", "setTimeout(\"alert", "sendBeacon", "import(", "importScripts(", "document.cookie", "WebSocket", "XMLHttpRequest", 'Studio.t("nope")']) {
    assert.ok(!text.includes(bad), `still contains ${bad}`);
  }
  assert.ok(text.includes("http://www.w3.org/2000/svg"), "namespace kept");
  assert.equal((text.match(/http:\/\/www\.w3\.org\/2000\/svg/g) ?? []).length, 2);
  assert.ok(text.includes("data:image/png"), "data: url kept");
  assert.ok(text.includes("Studio.t('title')") && text.includes("Studio.t(`check`)"), "table keys kept");
  const rules = new Set(hints.map((h) => h.rule));
  for (const r of ["css_url", "embed_tag", "meta_tag", "proto_rel", "url", "www", "fetch", "storage", "indexeddb", "eval", "function_ctor", "string_timer", "beacon",
    "dynamic_import", "import_scripts", "cookie", "xhr", "unknown_key", "script_src_attr"]) assert.ok(rules.has(r), `hint ${r}`);
  assert.ok(hintLines(hints).every((l) => /^stream_guard\.\w+: removed \d+x/.test(l)), "hint lines are shapes, never the removed code");
});

test("split invariance: every cut of a hostile stream, and 300 random chunkings, give the whole-text result", () => {
  const want = guardText(NASTY, { keys: ["title", "check"] }).text;
  for (let cut = 1; cut < NASTY.length; cut++) for (const pad of ["", "x;".repeat(120)]) {
    const g = createStreamGuard({ keys: ["title", "check"] });
    const out = g.push(pad + NASTY.slice(0, cut)) + g.push(NASTY.slice(cut)) + g.end();
    assert.equal(out.slice(pad.length), want, `cut ${cut} pad ${pad.length}`);
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let t = 0; t < 300; t++) {
    const g = createStreamGuard({ keys: ["title", "check"] });
    let out = "", i = 0;
    while (i < NASTY.length) { const k = 1 + Math.floor(rnd() * 30); out += g.push(NASTY.slice(i, i + k)); i += k; }
    out += g.end();
    assert.equal(out, want, `chunking ${t}`);
    assert.equal(g.text, want);
  }
});

test("partials never show a forbidden prefix: nothing is committed past an open URL / attribute / Studio.t(", () => {
  const g = createStreamGuard({ keys: ["title"] });
  const chunks = ["<div>".repeat(40), '<img src="https://ev', 'il.com/x.png">', ";".repeat(200), "Studio.t('no", "pe');", ";".repeat(200)];
  for (const c of chunks) { g.push(c); assert.ok(!/https?:\/\/ev|Studio\.t\('no/.test(g.text), `leaked at ${c.slice(0, 12)}`); }
  g.end();
  assert.ok(!g.text.includes("evil") && !g.text.includes("nope"));
});

test("fixers: unfence, unwrap, one script at the end, close a final script, seam spellings, add Studio.ready", () => {
  assert.equal(unfence("Here you go:\n```html\n<div>a</div>\n```\nEnjoy!"), "<div>a</div>");
  const raw = "```html\n<!doctype html><html><body><script>var a=1;</script><div data_part=\"0\" dataShaded=\"false\">x</div><style>.x{}</style><script>Studio.t('a')";
  const fx = fixFragment(raw, { seam: ["data-part", "data-shaded"] });
  assert.equal(fx.scriptError, null);
  for (const f of ["unfence", "unwrap", "close_script", "hoist_style", "one_script", "seam_spelling", "ready"]) assert.ok(fx.fixes.includes(f), f);
  assert.ok(fx.html.startsWith("<style>"), "style first");
  assert.ok(/data-part="0"/.test(fx.html) && /data-shaded="false"/.test(fx.html));
  assert.equal((fx.html.match(/<script>/g) ?? []).length, 1);
  assert.ok(/Studio\.ready\(\)\}catch\(e\)\{\}\n<\/script>$/.test(fx.html));
  // a script that does not parse is reported, never guessed at
  assert.match(fixFragment("<div></div><script>var x = ;</script>").scriptError, /./);
});
