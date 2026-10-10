// r4-latency (main-session ask): regression test for the one-process clock freeze. A virtual-clock test file that read
// "the real performance.now" at IMPORT could be imported while another file's virtual clock was installed (tests/index.js
// imports files while earlier files' tests run), save that fake, and restore it for good: every later test then ran on a
// frozen clock (studio-qa's gate hung to its 240 s timeout on CI). The runner (tests/fixtures/clock-order) forces that
// load order deterministically in a child process; the probe after it must see the clock run. Negative control: the
// import-time voice-player-clock of bedb2ce (main's describe-scoped version) fails the same runner after today's p2-face-player.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUNNER = new URL("./fixtures/clock-order/runner.mjs", import.meta.url).pathname;
const run = (first, second) => spawnSync(process.execPath, ["--test", RUNNER], {
  // NODE_TEST_CONTEXT (set by the parent runner) would switch the child's reporter off TAP
  env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")), CLOCK_ORDER_FILES: JSON.stringify({ first, second }) },
  encoding: "utf8", timeout: 120_000 });
const fails = (r) => Number(/^# fail (\d+)/m.exec(r.stdout)?.[1] ?? NaN);

test("p2-face-player's clock installed while voice-player-clock is imported: the clock still runs afterwards", () => {
  const r = run(new URL("./p2-face-player.test.mjs", import.meta.url).href, new URL("./voice-player-clock.test.mjs", import.meta.url).href);
  assert.equal(fails(r), 0, r.stdout.split("\n").filter((l) => /^not ok|error:/.test(l.trim())).join("\n") || r.stderr);
  assert.match(r.stdout, /^ok \d+ - probe: performance\.now is the real clock/m);
});

test("negative control: bedb2ce's voice-player-clock (clock read at import) freezes the clock in the same order", (t) => {
  let src;
  try { src = execFileSync("git", ["show", "bedb2ce4:tests/voice-player-clock.test.mjs"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return t.skip("bedb2ce4 not in this checkout's history"); }
  const dir = mkdtempSync(join(new URL(".", import.meta.url).pathname, ".clock-order-"));
  try {
    const vpc = join(dir, "voice-player-clock.mjs");
    writeFileSync(vpc, src.replaceAll('"../', '"../../'));
    const r = run(new URL("./p2-face-player.test.mjs", import.meta.url).href, `file://${vpc}`);
    assert.match(r.stdout, /^not ok \d+ - probe: performance\.now is the real clock/m, "the import-time file must freeze the clock here (else this runner no longer reproduces the bug)");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
