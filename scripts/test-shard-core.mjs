// The pure half of scripts/test-shard.mjs (round 7, platform-gate-speed): which group a suite belongs to, and the
// weighted partition of a group into shards. No fs, no process state: tests/test-shard.test.mjs runs it directly.

export const GROUPS = ["unit", "browser", "db"];

/**
 * A suite's group, from its source: "browser" when it drives Chromium (Playwright), "db" when it reads a test-branch
 * database url or pins Neon's driver, else "unit". Browser wins over db (a browser suite needs the CI browser install).
 * @param {string} name @param {string} body @returns {"unit"|"browser"|"db"}
 */
export function groupOf(name, body) {
  const b = String(body ?? "");
  if (/\bchromium\b|from ["']playwright["']|require\(["']playwright["']\)/.test(b)) return "browser";
  if (/TEST_DATABASE_URL|neonConfig|TAXILA_DB\s*[:=]+\s*["']test["']/.test(b) || /-db\.test\.mjs$/.test(name)) return "db";
  return "unit";
}

/** "2/4" → { i: 2, n: 4 }; throws on anything else. */
export function parseShard(s) {
  const m = /^(\d+)\/(\d+)$/.exec(String(s ?? ""));
  const i = m ? Number(m[1]) : NaN, n = m ? Number(m[2]) : NaN;
  if (!(n >= 1 && i >= 1 && i <= n)) throw new Error(`--shard ${s}: expected i/N with 1 ≤ i ≤ N`);
  return { i, n };
}

/**
 * Partition `files` into `n` shards, longest first onto the least-loaded shard (LPT). A file with no measurement weighs
 * the median of the measured ones (1 when none are). Deterministic: ties break by name, then by lowest shard index.
 * Every file lands in exactly one shard; each shard's list is sorted by name.
 * @param {string[]} files @param {Record<string, number>} weights seconds per file @param {number} n
 * @returns {string[][]}
 */
export function planShards(files, weights = {}, n = 1) {
  const known = files.map((f) => weights[f]).filter((w) => Number.isFinite(w) && w >= 0).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 1;
  const w = (f) => (Number.isFinite(weights[f]) && weights[f] >= 0 ? weights[f] : median);
  const order = [...new Set(files)].sort((a, b) => w(b) - w(a) || (a < b ? -1 : a > b ? 1 : 0));
  const shards = Array.from({ length: n }, () => ({ load: 0, files: [] }));
  for (const f of order) {
    let best = 0;
    for (let k = 1; k < n; k++) if (shards[k].load < shards[best].load) best = k;
    shards[best].files.push(f);
    shards[best].load += w(f);
  }
  return shards.map((s) => s.files.sort());
}

/**
 * Per-file results from `node --test --test-reporter=tap <files…>` (process isolation): the top-level test points are
 * the files themselves, with a duration_ms in their YAML block. → { "x.test.mjs": { s, ok } }
 * @param {string} tap
 */
export function tapFileDurations(tap) {
  const out = {};
  const lines = String(tap ?? "").split("\n");
  for (let k = 0; k < lines.length; k++) {
    const m = /^(not ok|ok) \d+ - (.*?)(\s+#.*)?$/.exec(lines[k]);   // top level: no indentation
    if (!m) continue;
    const name = m[2].trim().split("/").pop();
    if (!name.endsWith(".test.mjs")) continue;
    let ms = 0;
    for (let j = k + 1; j < Math.min(lines.length, k + 12); j++) {
      const d = /^\s+duration_ms:\s*([\d.]+)/.exec(lines[j]);
      if (d) { ms = Number(d[1]); break; }
      if (/^(ok|not ok) \d+/.test(lines[j])) break;
    }
    out[name] = { s: ms / 1000, ok: m[1] === "ok" };
  }
  return out;
}
