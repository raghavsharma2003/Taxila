// Q1 static gate for agent mechanics (FACTORY.md §5.2): an ALLOWLIST lint over the ESTree AST (rolldown's oxc
// parser). It is a first net, not the security boundary: the boundary is the opaque-origin sandbox, the hash-only
// meta CSP (no network, no eval), the shadowing wrapper (bundle.js) and the kit's runtime ref refusals.
// Rules: every free identifier must be on ALLOWED_FREE; banned member names anywhere; no computed member access on a
// free (ambient) object; no import/export/with/debugger/async/generators/classes/new of non-allowed ctors; no
// string literal with a digit or > 2 letters passed as a draw.text key that is not in the design's strings table;
// no ref-shaped object literal ({slot:…}, {item:…, slot:…}, {readout:…}); no READ of a ref's `.slot` (member, computed
// or destructured: refs are compared with ctx.refs.same); no computed member access on an ambient OR on a local that
// aliases one (`var A = Array; A[k]`); string concatenations of literals are folded before the banned-member check
// (`x['proto' + 'type']`); exactly one top-level defineMechanic call. Intrinsics are also frozen by the kit at runtime.
import { parseAst } from "rolldown/parseAst";

export const LINT_VERSION = "g2-lint@2";
export const ALLOWED_FREE = new Set(["defineMechanic", "Math", "Array", "Object", "Number", "String", "Boolean", "JSON", "Map", "Set",
  "undefined", "NaN", "Infinity", "isFinite", "parseInt", "parseFloat"]);
const BANNED_MEMBERS = new Set(["constructor", "__proto__", "prototype", "defineProperty", "defineProperties", "getPrototypeOf",
  "setPrototypeOf", "getOwnPropertyDescriptor", "innerHTML", "outerHTML", "insertAdjacentHTML", "random", "now", "eval", "call", "apply",
  "bind", "postMessage", "ownerDocument", "contentWindow", "parentNode", "sys", "game", "registry", "renderer", "canvas", "cache",
  "textures", "assign", "slot"]);
const BANNED_IDENT = /^(score|scores|coins?|points|streaks?)$/i;      // no points/coins/streaks machine (FACTORY §1.2)
const REQUIRED = ["init", "reduce", "targets", "render", "facts"];

/** Walk every node (ESTree), calling fn(node, parent, key). */
function walk(node, fn, parent = null, key = null) {
  if (!node || typeof node.type !== "string") return;
  fn(node, parent, key);
  for (const k of Object.keys(node)) {
    if (k === "type" || k === "start" || k === "end" || k === "range" || k === "loc") continue;
    const v = node[k];
    if (Array.isArray(v)) for (const c of v) { if (c && typeof c.type === "string") walk(c, fn, node, k); }
    else if (v && typeof v.type === "string") walk(v, fn, node, k);
  }
}

/** Names bound anywhere in the file (declarations, params, catch). Over-approximates locality; fine for a lint. */
function declaredNames(ast) {
  const names = new Set();
  const addPattern = (p) => {
    if (!p) return;
    if (p.type === "Identifier") names.add(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach((q) => addPattern(q.type === "RestElement" ? q.argument : q.value));
    else if (p.type === "ArrayPattern") p.elements.forEach(addPattern);
    else if (p.type === "RestElement") addPattern(p.argument);
    else if (p.type === "AssignmentPattern") addPattern(p.left);
  };
  walk(ast, (n) => {
    if (n.type === "VariableDeclarator") addPattern(n.id);
    if (n.type === "FunctionDeclaration" && n.id) names.add(n.id.name);
    if ((n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression")) n.params.forEach(addPattern);
    if (n.type === "CatchClause" && n.param) addPattern(n.param);
  });
  return names;
}

/** A computed key that is a string built ONLY from literals ('a' + 'b', `ab`) → its value; else null. */
function foldStatic(n) {
  if (!n) return null;
  if (n.type === "Literal" && (typeof n.value === "string" || typeof n.value === "number")) return String(n.value);
  if (n.type === "TemplateLiteral" && n.expressions.length === 0) return n.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
  if (n.type === "BinaryExpression" && n.operator === "+") { const a = foldStatic(n.left), b = foldStatic(n.right); return a != null && b != null ? a + b : null; }
  return null;
}

/** Root identifier of a member chain (a.b[c].d → a), else null. */
function rootOf(n) {
  while (n && (n.type === "MemberExpression" || n.type === "StaticMemberExpression" || n.type === "ComputedMemberExpression")) n = n.object;
  return n?.type === "Identifier" ? n.name : null;
}

/** Locals that alias an ambient object: `var A = Array`, `A = Object.keys`, `var B = A` (to a fixpoint). */
function ambientAliases(ast, local) {
  const pairs = [];
  walk(ast, (n) => {
    if (n.type === "VariableDeclarator" && n.id?.type === "Identifier" && n.init) pairs.push([n.id.name, n.init]);
    if (n.type === "AssignmentExpression" && n.left?.type === "Identifier") pairs.push([n.left.name, n.right]);
  });
  const ambient = (name) => name && !local.has(name) && ALLOWED_FREE.has(name) && !["undefined", "NaN", "Infinity"].includes(name);
  const aliases = new Set();
  for (let changed = true; changed;) {
    changed = false;
    for (const [name, init] of pairs) {
      if (aliases.has(name)) continue;
      let v = init;
      while (v && (v.type === "SequenceExpression" || v.type === "ParenthesizedExpression")) v = v.type === "SequenceExpression" ? v.expressions.at(-1) : v.expression;
      const cands = v?.type === "LogicalExpression" || v?.type === "ConditionalExpression" ? [v.left, v.right, v.consequent, v.alternate].filter(Boolean) : [v];
      if (cands.some((c) => { const r = rootOf(c); return r && (ambient(r) || aliases.has(r)); })) { aliases.add(name); changed = true; }
    }
  }
  return aliases;
}

/** Is this Identifier node a reference (not a property key / member name / label)? */
function isReference(n, parent, key) {
  if (!parent) return true;
  if ((parent.type === "MemberExpression" || parent.type === "StaticMemberExpression") && key === "property" && !parent.computed) return false;
  if ((parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") && key === "key" && !parent.computed) return false;
  if (parent.type === "LabeledStatement" || parent.type === "BreakStatement" || parent.type === "ContinueStatement") return false;
  return true;
}

/**
 * @param {string} src agent mechanic source
 * @param {{ stringKeys?: string[] }} [opts]
 * @returns {{ ok: boolean, errors: { code: string, detail: string, line: number }[] }}
 */
export function lintMechanic(src, { stringKeys = [] } = {}) {
  const errors = [];
  const lineOf = (pos) => (typeof pos === "number" ? src.slice(0, pos).split("\n").length : 0);
  const err = (code, detail, node) => errors.push({ code, detail: String(detail).slice(0, 160), line: lineOf(node?.start) });
  let ast;
  try { ast = parseAst(src); } catch (e) { return { ok: false, errors: [{ code: "Q1.parse", detail: String(e.message).split("\n")[0].slice(0, 200), line: 0 }] }; }
  const local = declaredNames(ast);
  const aliases = ambientAliases(ast, local);
  const keys = new Set(stringKeys);
  let defines = 0;
  walk(ast, (n, parent, key) => {
    switch (n.type) {
      case "ImportDeclaration": case "ImportExpression": case "ExportNamedDeclaration": case "ExportDefaultDeclaration": case "ExportAllDeclaration":
        return err("Q1.module_syntax", n.type, n);
      case "WithStatement": case "DebuggerStatement": case "ClassDeclaration": case "ClassExpression": case "AwaitExpression": case "YieldExpression":
      case "TaggedTemplateExpression": case "MetaProperty": case "ThisExpression":
        return err("Q1.banned_syntax", n.type, n);
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression":
        if (n.async || n.generator) err("Q1.banned_syntax", "async/generator function", n);
        return;
      case "NewExpression":
        if (!(n.callee.type === "Identifier" && ["Map", "Set", "Array"].includes(n.callee.name))) err("Q1.banned_new", n.callee.name || n.callee.type, n);
        return;
      case "Identifier":
        if (BANNED_IDENT.test(n.name)) err("Q1.points_machine", n.name, n);
        if (/^__/.test(n.name)) err("Q1.dunder", n.name, n);
        if (isReference(n, parent, key) && !local.has(n.name) && !ALLOWED_FREE.has(n.name)) err("Q1.free_identifier", n.name, n);
        return;
      case "MemberExpression": case "StaticMemberExpression": case "ComputedMemberExpression": {
        const prop = !n.computed && n.property?.type === "Identifier" ? n.property.name : n.computed ? foldStatic(n.property) : null;
        if (prop && BANNED_MEMBERS.has(prop)) err(prop === "slot" ? "Q1.ref_read" : "Q1.banned_member", prop, n);
        if (n.computed && n.object?.type === "Identifier" && !local.has(n.object.name)) err("Q1.computed_on_ambient", n.object.name, n);
        else if (n.computed && foldStatic(n.property) == null) {
          const r = rootOf(n.object);
          if (r && (aliases.has(r) || (!local.has(r) && ALLOWED_FREE.has(r)))) err("Q1.computed_on_ambient", `${r} (alias of an ambient)`, n);
        }
        return;
      }
      case "ObjectPattern": {
        if (n.properties.some((p) => p.type === "Property" && (p.computed ? foldStatic(p.key) : p.key?.name ?? p.key?.value) === "slot")) err("Q1.ref_read", "destructured slot", n);
        return;
      }
      case "ObjectExpression": {
        const ks = n.properties.filter((p) => p.type === "Property" && !p.computed).map((p) => p.key.name ?? p.key.value);
        if (ks.includes("slot") || ks.includes("readout") && !(ks.length === 1) || (ks.includes("item") && ks.includes("slot"))) err("Q1.forged_ref", ks.join(","), n);
        if (n.properties.some((p) => p.type === "SpreadElement")) {
          // a spread that could copy a ref into a target's valueRef is allowed only outside `valueRef:`
          if (parent?.type === "Property" && (parent.key?.name === "valueRef")) err("Q1.forged_ref", "spread into valueRef", n);
        }
        if (n.properties.some((p) => p.type === "Property" && (p.key?.name === "valueRef") && p.value?.type === "ObjectExpression")) err("Q1.forged_ref", "literal valueRef", n);
        return;
      }
      case "CallExpression": {
        const c = n.callee;
        if (c.type === "Identifier" && c.name === "defineMechanic") defines++;
        const isDrawText = (c.type === "MemberExpression" || c.type === "StaticMemberExpression") && !c.computed && c.property?.name === "text";
        if (isDrawText) {
          const a = n.arguments[0];
          if (a?.type === "Literal" && typeof a.value === "string" && !keys.has(a.value)) err("Q1.unknown_string_key", a.value, n);
          if (a?.type === "TemplateLiteral") err("Q1.text_key_template", "template literal as text key", n);
        }
        if ((c.type === "MemberExpression" || c.type === "StaticMemberExpression") && c.property?.name === "numeral") {
          const a = n.arguments[0];
          if (a?.type === "Literal" || (a?.type === "ObjectExpression" && !a.properties.every((p) => p.type === "Property" && (p.key.name ?? p.key.value) === "readout"))) err("Q1.forged_ref", "numeral argument", n);
        }
        return;
      }
      case "Literal":
        if (typeof n.value === "string" && /\d/.test(n.value) && parent?.type === "CallExpression" && parent.callee?.property?.name === "text") err("Q1.digit_in_text", n.value, n);
        if (n.regex) err("Q1.banned_syntax", "regex literal", n);
        return;
      case "TemplateLiteral":
        return;
      default:
    }
  });
  if (defines !== 1) err("Q1.define_count", `defineMechanic called ${defines} times`, null);
  // the defineMechanic argument must be an object literal carrying the required members
  const top = ast.body.find((s) => s.type === "ExpressionStatement" && s.expression.type === "CallExpression" && s.expression.callee.name === "defineMechanic");
  const obj = top?.expression.arguments[0];
  if (obj?.type === "ObjectExpression") {
    const names = obj.properties.filter((p) => p.type === "Property").map((p) => p.key.name ?? p.key.value);
    for (const r of REQUIRED) if (!names.includes(r)) err("Q1.missing_member", r, obj);
    const arch = obj.properties.find((p) => (p.key?.name ?? p.key?.value) === "archetype")?.value;
    if (!(arch?.type === "Literal" && ["choice", "build"].includes(arch.value))) err("Q1.archetype", "archetype must be 'choice' or 'build'", obj);
  } else if (top) err("Q1.define_shape", "defineMechanic({...}) with an object literal", top);
  return { ok: errors.length === 0, errors };
}
