// Whole-project audit 2026-11-09, platform: three migrations (PLAT-15 → 042, PLAT-17 → 043, PLAT-56 → 050) and the
// numbering README (PLAT-55). No database: each file splits into statements, every statement is idempotent (a re-run is a
// no-op), and the code's expectations match. Applied by hand on an empty Postgres 16, twice, on 2026-11-10 (the audit
// session); applying them to Neon or Azure is main's release step, not a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { splitSql } from "../scripts/migrate-core.mjs";

const dir = new URL("../db/migrations/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const stmts = (f) => splitSql(read(f)).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);

test("PLAT-15: 042 adds child_controls.play_verb, the column server/play/dress.js reads", () => {
  const s = stmts("042_child_controls_play_verb.sql");
  assert.equal(s.length, 1);
  assert.match(s[0], /^alter table child_controls add column if not exists play_verb text check \(play_verb in \('scan', 'fire'\)\)/);
  assert.match(readFileSync(new URL("../server/play/dress.js", import.meta.url), "utf8"), /select play_verb from child_controls where child_id = \$1/);
});

test("PLAT-17: 043 adds brain_trace.item_id and misconception_id for a database that ran the first 016", () => {
  const s = stmts("043_brain_trace_ids.sql");
  assert.deepEqual(s, ["alter table brain_trace add column if not exists item_id text", "alter table brain_trace add column if not exists misconception_id text"]);
});

test("PLAT-56: 050 drops the five unused tables, idempotently, and no code reads them", () => {
  const s = stmts("050_drop_unused_tables.sql");
  const names = s.map((x) => /^drop table if exists ([\w.]+)$/.exec(x)?.[1]);
  assert.deepEqual(names, ["module_run", "rate_bucket", "kt_params", "voicesig.calibration", "voicesig.population_norm"]);
  // no SQL in server/ names them (comments aside): from / into / update / join followed by the table
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === "node_modules" ? [] : walk(`${d}/${e.name}`)) : /\.(m?js|ts)$/.test(e.name) ? [`${d}/${e.name}`] : []);
  const root = new URL("..", import.meta.url).pathname;
  const used = [];
  for (const f of [...walk(`${root}server`), ...walk(`${root}scripts`).filter((x) => !x.includes("/m3"))]) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const n of names) if (new RegExp(`\\b(from|into|update|join|table)\\s+${n.replace(".", "\\.")}\\b`, "i").test(src)) used.push(`${f.replace(root, "")}: ${n}`);
  }
  assert.deepEqual(used, []);
  // the report also listed calendar; server/conductor/view.js reads it, so it stays
  assert.ok(!names.includes("calendar"));
});

test("PLAT-55: the numbering README lists the files that exist and the new allotments", () => {
  const readme = read("README.md");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  for (const n of ["042", "043", "050"]) assert.ok(files.some((f) => f.startsWith(n + "_")), n);
  assert.doesNotMatch(readme, /Applied so far: 034-040\./);
  assert.match(readme, /042 = child_controls\.play_verb/);
  assert.match(readme, /043 = brain_trace/);
  assert.match(readme, /050 = /);
  assert.match(readme, /No file: 014 and 027 \(gaps for good\), 032, 033, 048, 049/);
});
