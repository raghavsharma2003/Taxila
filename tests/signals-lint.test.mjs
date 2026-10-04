// G-SIG-LINT (SIGNALS-SPEC §3.1) and G-SIG-PURE (§3.4): the signal layer names actions and evidence, never feelings, and
// server/signals is pure. The allowlist below is FIXED: adding to it is a visible diff a reviewer must accept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, dirname, resolve } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const AFFECT = /frustrat|bored|anxi|sad\b|happy|arous|valence|mood|stress|tired|fatigue|confus|delight|emotion|feel|upset|angry|vibe/i;
/** Input field names the layer READS from other modules (never emits), and the TeacherAffect type import. */
const ALLOW = new Set(["frustration_words", "pride_words", "tiredSays", "tiredSaid", "TeacherAffect"]);

function files(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(js|mjs|ts)$/.test(n)) out.push(p);
  }
  return out;
}
const SCOPE = [...files(join(ROOT, "server/signals")), ...files(join(ROOT, "src/signals")), join(ROOT, "shared/signals.ts")];

/** Strip comments (line and block) while keeping string and regex literals intact enough for a token scan. */
function stripComments(src) {
  let out = "", i = 0, q = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) { out += c; if (c === "\\") { out += n ?? ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

test("G-SIG-LINT: no affect word in any identifier, key or string literal under the signal layer", () => {
  const hits = [];
  for (const f of SCOPE) {
    const code = stripComments(readFileSync(f, "utf8"));
    for (const m of code.matchAll(/[\p{L}_$][\p{L}\p{N}_$]*/gu)) {
      const w = m[0];
      if (ALLOW.has(w)) continue;
      if (AFFECT.test(w)) hits.push(`${f.slice(ROOT.length)}: ${w}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("G-SIG-LINT self-check: the scanner catches an affect word and honours the allowlist", () => {
  const scan = (src) => [...stripComments(src).matchAll(/[\p{L}_$][\p{L}\p{N}_$]*/gu)].map((m) => m[0]).filter((w) => !ALLOW.has(w) && AFFECT.test(w));
  assert.deepEqual(scan('const x = { childBored: 1 }; // a frustrated comment is fine'), ["childBored"]);
  assert.deepEqual(scan('emit("fatigueHigh")'), ["fatigueHigh"]);
  assert.deepEqual(scan('if (act === "frustration_words") ok()'), []);
  assert.deepEqual(scan("/* mood */ const tiredSaid = true"), []);
});

test("G-SIG-PURE: server/signals has no clock, randomness, network, env or database access", () => {
  const banned = /Date\.now|new Date\(|Math\.random|performance\.now|\bfetch\(|process\.env|from\s+["'][^"']*(?:db\.js|pg|@neondatabase|azure\.js|http\.js|net\.js)["']|require\(/;
  for (const f of files(join(ROOT, "server/signals"))) {
    const code = stripComments(readFileSync(f, "utf8"));
    assert.ok(!banned.test(code), `${f.slice(ROOT.length)}: ${code.match(banned)?.[0]}`);
    for (const m of code.matchAll(/from\s+["']([^"']+)["']/g)) {
      const target = resolve(dirname(f), m[1]);
      const inside = target.startsWith(join(ROOT, "server/signals/")) || target === join(ROOT, "server/learner/affect.js");
      assert.ok(inside, `${f.slice(ROOT.length)} imports ${m[1]}`);
    }
  }
});

test("G-SIG-NOPROSE (static half): nothing in server/signals builds prompt prose from a frame", () => {
  for (const f of files(join(ROOT, "server/signals"))) {
    const code = stripComments(readFileSync(f, "utf8"));
    assert.ok(!/compile\(\s*\{|instructions|systemPrompt|messages\s*:/.test(code), f);
  }
});
