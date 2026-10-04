// G0, the static gate (LIVE-STUDIO §3.6): size, no URL, and an AST walk (oxc via rolldown/parseAst, not regex) over the
// build's script for network, eval, storage, frame escapes and host internals. It is a first net, not the boundary:
// the boundary is the opaque-origin frame, the hash-only CSP and the frozen runtime. Pure; < 20 ms on a 60 KB build.
import { parseAst } from "rolldown/parseAst";
import { splitFragment } from "../fixers.js";

/** Free identifiers a build may never name. */
const BANNED_FREE = new Set(["eval", "Function", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "localStorage", "sessionStorage",
  "indexedDB", "importScripts", "Worker", "SharedWorker", "ServiceWorker", "BroadcastChannel", "RTCPeerConnection", "top", "parent", "opener",
  "frames", "frameElement", "caches", "cookieStore", "open", "alert", "confirm", "prompt", "postMessage", "Request", "Image", "Audio"]);
/** Member names that are an escape or a channel whatever the object. */
const BANNED_MEMBER = new Set(["cookie", "sendBeacon", "postMessage", "contentWindow", "contentDocument", "opener", "frameElement", "serviceWorker",
  "registerProtocolHandler", "domain", "innerHTMLUnsafe", "setHTMLUnsafe", "importNode", "write", "writeln"]);
/** Members of window/self/globalThis/document that leave the frame. */
const BANNED_ON_GLOBAL = new Set(["top", "parent", "opener", "location", "open", "frames", "name", "history", "fetch", "eval", "Function"]);
const GLOBALS = new Set(["window", "self", "globalThis", "document"]);

function walk(node, fn, parent = null) {
  if (!node || typeof node.type !== "string") return;
  fn(node, parent);
  for (const k of Object.keys(node)) {
    if (k === "type" || k === "start" || k === "end" || k === "range" || k === "loc") continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === "string") walk(c, fn, node); }
    else if (v && typeof v.type === "string") walk(v, fn, node);
  }
}
const isMember = (n) => n && (n.type === "MemberExpression" || n.type === "StaticMemberExpression" || n.type === "ComputedMemberExpression");
const propName = (n) => (n.computed ? (n.property?.type === "Literal" ? String(n.property.value) : null) : n.property?.name ?? null);
const isLiteralOnly = (n) => {
  if (!n) return false;
  if (n.type === "Literal" || n.type === "TemplateLiteral" && n.expressions.length === 0) return true;
  if (n.type === "UnaryExpression") return isLiteralOnly(n.argument);
  if (n.type === "ObjectExpression") return n.properties.length > 0 && n.properties.every((p) => p.type === "Property" && !p.computed && isLiteralOnly(p.value));
  if (n.type === "ArrayExpression") return n.elements.length > 0 && n.elements.every(isLiteralOnly);
  return false;
};

/** Names declared anywhere (over-approximates scope; fine for a deny-list of free names). */
function declared(ast) {
  const names = new Set();
  const pat = (p) => {
    if (!p) return;
    if (p.type === "Identifier") names.add(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach((q) => pat(q.type === "RestElement" ? q.argument : q.value));
    else if (p.type === "ArrayPattern") p.elements.forEach(pat);
    else if (p.type === "RestElement") pat(p.argument);
    else if (p.type === "AssignmentPattern") pat(p.left);
  };
  walk(ast, (n) => {
    if (n.type === "VariableDeclarator") pat(n.id);
    if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id) names.add(n.id.name);
    if (n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") n.params.forEach(pat);
    if (n.type === "CatchClause" && n.param) pat(n.param);
  });
  return names;
}

/**
 * G0 over a fixed fragment. → checks [{ id, pass, detail }]
 * @param {string} html the fixed fragment (fixers.js)
 * @param {{ keys: string[], bytes?: number }} o the strings table's keys, the byte budget
 */
export function staticChecks(html, { keys = [], bytes = 60_000 } = {}) {
  const checks = [];
  const size = Buffer.byteLength(String(html));
  checks.push({ id: "G0.size", pass: size <= bytes, detail: size });
  // any http(s) URL (bar the SVG / XHTML namespace URIs), any protocol-relative //host in an attribute or url(), any bare www. host
  const urls = [...(String(html).match(/\bhttps?:\/\/[^\s"'<>)`]*/gi) ?? []).filter((u) => !/^https?:\/\/www\.w3\.org\//i.test(u)),
    ...(String(html).match(/(?:=\s*["']|url\(\s*["']?)\/\/[^\s"'<>)]+/gi) ?? []), ...(String(html).match(/(?<![\/\w.])www\.[a-z0-9-]+\.[a-z]{2,}/gi) ?? [])];
  checks.push({ id: "G0.no_url", pass: urls.length === 0, detail: urls.slice(0, 3) });
  const { scripts, markup } = splitFragment(html);
  const tags = markup.match(/<(?:script|link|iframe|object|embed|base|meta|frame|form|a\s[^>]*href\s*=\s*["'](?!#))[^>]*>/gi) ?? [];
  checks.push({ id: "G0.no_loading_tags", pass: tags.length === 0, detail: tags.slice(0, 3) });
  const inline = markup.match(/\son[a-z]+\s*=/gi) ?? [];
  checks.push({ id: "G0.no_inline_handlers", pass: inline.length === 0, detail: inline.slice(0, 3) });
  checks.push({ id: "G0.one_script", pass: scripts.length === 1, detail: scripts.length });
  const code = scripts.join("\n;\n");
  let ast;
  try { ast = parseAst(code, { lang: "js", sourceType: "script" }); }
  catch (e) { checks.push({ id: "G0.parses", pass: false, detail: String(e?.message ?? e).slice(0, 200) }); return checks; }
  checks.push({ id: "G0.parses", pass: true, detail: "" });
  const local = declared(ast);
  const bad = [];
  const keySet = new Set(keys);
  const badKeys = [], literalAnswers = [];
  walk(ast, (n, parent) => {
    if (n.type === "Identifier" && !local.has(n.name)) {
      const isProp = isMember(parent) && parent.property === n && !parent.computed;
      const isKey = parent?.type === "Property" && parent.key === n && !parent.computed;
      if (!isProp && !isKey && (BANNED_FREE.has(n.name) || n.name.startsWith("__"))) bad.push(n.name);
    }
    if (n.type === "Identifier" && n.name.startsWith("__")) bad.push(n.name);
    if (isMember(n)) {
      const p = propName(n);
      if (p && (BANNED_MEMBER.has(p) || p.startsWith("__"))) bad.push(`.${p}`);
      if (p && n.object?.type === "Identifier" && GLOBALS.has(n.object.name) && !local.has(n.object.name) && BANNED_ON_GLOBAL.has(p)) bad.push(`${n.object.name}.${p}`);
      if (n.computed && n.object?.type === "Identifier" && GLOBALS.has(n.object.name) && !local.has(n.object.name) && n.property?.type !== "Literal") bad.push(`${n.object.name}[computed]`);
    }
    if (n.type === "ImportExpression" || n.type === "ImportDeclaration" || n.type === "ExportNamedDeclaration") bad.push("import/export");
    if (n.type === "WithStatement") bad.push("with");
    if (n.type === "CallExpression" && isMember(n.callee) && n.callee.object?.type === "Identifier" && n.callee.object.name === "Studio") {
      const m = propName(n.callee);
      if (m === "t" && n.arguments[0]?.type === "Literal" && typeof n.arguments[0].value === "string" && !keySet.has(n.arguments[0].value)) badKeys.push(n.arguments[0].value);
      if (m === "answer" && isLiteralOnly(n.arguments[0])) literalAnswers.push(code.slice(n.start, Math.min(n.end, n.start + 60)));
    }
    if (n.type === "CallExpression" && n.callee?.type === "Identifier" && (n.callee.name === "setTimeout" || n.callee.name === "setInterval")
      && (n.arguments[0]?.type === "Literal" || n.arguments[0]?.type === "TemplateLiteral")) bad.push("string_timer");
  });
  checks.push({ id: "G0.no_banned_api", pass: bad.length === 0, detail: [...new Set(bad)].slice(0, 6) });
  checks.push({ id: "G0.table_keys_only", pass: badKeys.length === 0, detail: [...new Set(badKeys)].slice(0, 4) });
  checks.push({ id: "G0.no_literal_answer", pass: literalAnswers.length === 0, detail: literalAnswers.slice(0, 2) });
  return checks;
}
