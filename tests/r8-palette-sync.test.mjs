// Round 8 (main 2026-11-11, ruling 2): one source for the board's meaning colours. Studio's src/theme/palette.ts is the
// source; src/styles/tx-tokens.css carries the same role values under the matching names, and this test fails when
// they differ. Studio's file is read-only here: a difference is fixed by a patch to Studio
// (docs/patches/to-studio/009-palette-roles/), or by changing the token file.
//
// What is compared:
//   theme A (paper)  PAPER.roles and PAPER.board.paper.role  against the tokens on `:root, [data-tx="a"]`
//   theme B (night)  NIGHT.board.chalk.role (the r8 night board roles) against the tokens on `[data-tx="b"]`
//                    (NIGHT.roles and the night grounds are today's live look and do not change in this work)
//
// PENDING lists the differences a sent patch will remove. It must equal the measured differences exactly: a new
// difference fails, and so does a pending one that has landed (take it off the list).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(new URL(".", import.meta.url).pathname, "..");
const CSS = fs.readFileSync(path.join(ROOT, "src/styles/tx-tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function block(selectorStart) {
  const i = CSS.indexOf(selectorStart);
  assert.ok(i >= 0, `no block ${selectorStart}`);
  const body = CSS.slice(CSS.indexOf("{", i) + 1, CSS.indexOf("}", i));
  const out = {};
  for (const m of body.matchAll(/--(tx-[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim().toUpperCase();
  return out;
}
const A = block(':root, [data-tx="a"]');
const B = { ...A, ...block('[data-tx="b"], :root:where(:has') };

// Studio's role name → the token that carries it
const BOARD_ROLE = { focus: "tx-focus", slot: "tx-ans", answer: "tx-ans", mixup: "tx-mix", muted: "tx-board-soft" };
const PAPER_ROLE = { ground: "tx-board", ink: "tx-board-ink", inkQuiet: "tx-ink-2", focus: "tx-focus", answer: "tx-ans", mixup: "tx-mix", child: "tx-move-text", right: "tx-ans", wrong: "tx-mix" };

// Sent to Studio as patch 009 (2026-11-11). Remove each line as Studio lands it. The seven theme A lines went at
// integration 50: Studio's d3ad0daac took answer #0B736A and mix-up #8A5A00. The four theme B lines went at
// integration 51: Studio's c122d4c30 took Design's night chalk values. Nothing is pending.
const PENDING = new Set([
]);

async function differences() {
  const { PAPER, NIGHT } = await import("../src/theme/palette.ts");
  const out = [];
  const cmp = (theme, where, studio, tokens, token) => {
    const s = String(studio).toUpperCase(), t = tokens[token];
    assert.ok(t, `${theme}: tx-tokens.css has no --${token}`);
    if (s !== t) out.push(`${theme} ${where} ${s} ≠ --${token} ${t}`);
  };
  for (const [k, tok] of Object.entries(BOARD_ROLE)) cmp("A", `board.paper.role.${k}`, PAPER.board.paper.role[k], A, tok);
  for (const [k, tok] of Object.entries(PAPER_ROLE)) cmp("A", `roles.${k}`, PAPER.roles[k], A, tok);
  for (const [k, tok] of Object.entries(BOARD_ROLE)) cmp("B", `board.chalk.role.${k}`, NIGHT.board.chalk.role[k], B, tok);
  return out;
}

test("the board's role colours in tx-tokens.css equal Studio's palette.ts (pending patch differences listed, and only those)", async () => {
  const diff = await differences();
  assert.deepEqual(diff.filter((d) => !PENDING.has(d)), [], "a role value differs from Studio's palette.ts: change the token or send Studio a patch");
  assert.deepEqual([...PENDING].filter((p) => !diff.includes(p)), [], "a pending difference is gone (Studio landed it): take it off PENDING");
});

test("negative control: a changed token value is caught", async () => {
  const { PAPER } = await import("../src/theme/palette.ts");
  assert.notEqual(PAPER.board.paper.role.focus.toUpperCase(), "#3B47B1");
  assert.equal(PAPER.board.paper.role.focus.toUpperCase(), A["tx-focus"], "focus is the one role both files already share");
});
