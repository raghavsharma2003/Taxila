// Harnesses (tests/prod, evals, scripts, infra/probes) must never fall back to a production URL. A run once went to
// live production because TAXILA_BASE was unset and tests/prod/lib.mjs defaulted to it.
// This suite never runs a harness: it checks the shared guard, imports lib.mjs with a STUBBED fetch (the import must
// refuse and must not touch the network), and scans the harness source for a production URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveBase } from "./prod/base.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

test("resolveBase: empty, blank, relative and non-http values all refuse; a real URL is cleaned", () => {
  for (const bad of [undefined, null, "", "   ", "taxila.dev", "/api", "ftp://x.example", "javascript:1"]) {
    assert.throws(() => resolveBase(bad), /base URL|no base URL/, `refuses ${JSON.stringify(bad)}`);
  }
  assert.equal(resolveBase("http://127.0.0.1:5190/"), "http://127.0.0.1:5190");
  assert.equal(resolveBase(" https://staging.example.test// "), "https://staging.example.test");
});

test("tests/prod/lib.mjs refuses to load from an empty environment, and makes no network call doing so", async () => {
  const realFetch = globalThis.fetch, saved = process.env.TAXILA_BASE;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("network must not be touched"); };
  delete process.env.TAXILA_BASE;
  try {
    await assert.rejects(import("./prod/lib.mjs?empty-env"), /no base URL/);
    process.env.TAXILA_BASE = "   ";
    await assert.rejects(import("./prod/lib.mjs?blank-env"), /no base URL/);
    process.env.TAXILA_BASE = "http://127.0.0.1:1";
    const lib = await import("./prod/lib.mjs?set-env");
    assert.equal(lib.BASE, "http://127.0.0.1:1");
    assert.equal(lib.isLocal, true);
    assert.equal(lib.PROD_BASE, undefined, "no exported production default");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = realFetch;
    if (saved === undefined) delete process.env.TAXILA_BASE; else process.env.TAXILA_BASE = saved;
  }
});

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n === "results" || n.startsWith(".")) continue;
    const p = join(dir, n), st = statSync(p);
    if (st.isDirectory()) walk(p, out); else if (/\.(mjs|js|cjs|sh)$/.test(n)) out.push(p);
  }
  return out;
}

test("no harness source carries a production URL (a fallback, a default argument or a hard-coded call)", () => {
  const PROD_URL = /https?:\/\/[A-Za-z0-9.-]*(taxila\.dev|azurecontainerapps\.io|vercel\.app)\b/;
  const hits = [];
  for (const dir of ["evals", "scripts", "tests/prod", "tests/e2e", "infra"]) {
    for (const f of walk(join(ROOT, dir))) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*(\/\/|#|\*)/.test(line)) return; // a comment documenting history is not a fallback
        if (PROD_URL.test(line)) hits.push(`${f.slice(ROOT.length)}:${i + 1}: ${line.trim().slice(0, 110)}`);
      });
    }
  }
  assert.deepEqual(hits, [], "a harness names production in code; make the base explicit (tests/prod/base.mjs resolveBase)");
});

test("every harness that imports tests/prod/lib.mjs sets no base of its own beyond the caller's value", () => {
  // A literal fallback after || / ?? / ||= for TAXILA_BASE may only be empty or a loopback address.
  const bad = [];
  for (const dir of ["evals", "scripts", "tests/prod", "infra"]) {
    for (const f of walk(join(ROOT, dir))) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/TAXILA_BASE\s*(?:\|\||\?\?|\|\|=)\s*(?:[\w.]*\()?\s*(?:"base"\s*,\s*)?"([^"]*)"/g)) {
        if (m[1] && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(m[1])) bad.push(`${f.slice(ROOT.length)}: ${m[0]}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
