// Round 7 whole-project audit, app area, batch 1 (APP-01, 02, 03, 04, 08, 09, 10, 12, 15): each fix runs its own logic where
// the logic is pure, and reads the source only where the part is a React screen.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isRequestChip, isAnswerTray, helpAskedKey } from "../src/child/lesson/answers.ts";
import { findPlaying, patchSummaries } from "../src/child/madeMatch.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("APP-01: a ?made= link carrying the intent id opens the card whose row id differs", () => {
  const cards = [{ id: "41", intentId: "intent-a", replay: { k: 1 } }, { id: "42", intentId: "intent-b", replay: null }];
  assert.equal(findPlaying(cards, "intent-a")?.id, "41");
  assert.equal(findPlaying(cards, "41")?.id, "41");
  assert.equal(findPlaying(cards, "intent-b"), null, "a card with no replay never plays");
  assert.equal(findPlaying(cards, null), null);
});

test("APP-02: a late summaries read patches summaries onto the server's pages and keeps their boards", () => {
  const pages = [
    { lessonId: "a", topic: "Server title", summary: null, topicId: "t1", boards: 2, first: { x: 1 } },
    { lessonId: "b", topic: "device topic", summary: null },
  ];
  const out = patchSummaries(pages, { a: { shortTitle: "Short A" }, b: { title: "Title B" } });
  assert.equal(out.length, 2);
  assert.equal(out[0].boards, 2);
  assert.deepEqual(out[0].first, { x: 1 });
  assert.equal(out[0].topic, "Server title");
  assert.deepEqual(out[0].summary, { shortTitle: "Short A" });
  assert.equal(out[1].topic, "Title B");
  assert.deepEqual(patchSummaries(null, {}), []);
});

test("APP-12: steer, later, stop, break, switch and safe chips are requests; a plain tile is an answer", () => {
  for (const id of ["steer:diagram", "steer:else", "later:q7", "stop:continue", "stop:end", "break:rest", "break:easier", "safe:continue", "safe:stop", "switch:fractions", "slower", "hint", "help_how"]) {
    assert.equal(isRequestChip(id), true, id);
  }
  for (const id of [undefined, "", "a", "opt-2", "3/4"]) assert.equal(isRequestChip(id), false, String(id));
  assert.ok(helpAskedKey("hint"));
});

test("APP-15: every language of the steer words is in its own script", () => {
  const src = read("src/child/lesson/useDesk.ts");
  const hi = /else: \["[^"]*", "([^"]*)", "[^"]*"\]/.exec(src.slice(src.indexOf("STEER_SAID")))?.[1] ?? "";
  assert.match(hi, /^[\u0900-\u097F ]+$/);
});

test("APP-04: an overlay over a module, Studio piece or board stays on the work tray (the work stays mounted)", () => {
  assert.equal(isAnswerTray({ kind: "module", overlay: "help_menu" }), false);
  assert.equal(isAnswerTray({ kind: "studio", overlay: "no_mic" }), false);
  assert.equal(isAnswerTray({ kind: "board", overlay: "help_menu" }), false);
  assert.equal(isAnswerTray({ kind: "tiles" }), true);
  assert.equal(isAnswerTray({ kind: "pad" }), true);
  assert.equal(isAnswerTray({ kind: "tiles", overlay: "help_menu" }), true);
  assert.equal(isAnswerTray({ kind: "module" }), false);
});

test("APP-03: the break chip carries words (the runtime drops a turn with none)", () => {
  const ud = read("src/child/lesson/useDesk.ts");
  assert.doesNotMatch(ud, /id: "break:rest", label: ""/);
  assert.match(ud, /id: "break:rest", label: REQUESTS\.rest\[/);
  assert.match(ud, /rest: \["[^"]+", "[^"]+", "[^"]+"\]/);
});

test("APP-08: /who never draws the error's own text, and offers Try again", () => {
  const w = read("src/app/Who.tsx");
  assert.doesNotMatch(w, /errText/);
  assert.match(w, /data-testid="who-retry"/);
  assert.match(read("src/copy/en.ts"), /"who\.err": "[^"]+"/);
});

test("APP-09: the .v3.kx root re-points the shared ink names at the Kaksha tokens", () => {
  const css = read("src/ui-v3/kaksha/tokens.css");
  assert.match(css, /\.v3\.kx\[data-ktheme\] \{[^}]*--bg: var\(--k-void\)[^}]*--ink: var\(--k-ink\)/s);
});

test("APP-10: the parent gate shows Loading while the account loads", () => {
  assert.doesNotMatch(read("src/app/ParentOnly.tsx"), /me === undefined\) return null/);
  assert.match(read("src/app/ParentOnly.tsx"), /me === undefined\) return <Loading \/>/);
});
