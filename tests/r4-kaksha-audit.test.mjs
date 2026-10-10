// Stream 5's journey audit, Kaksha rows (claude/r4-asha docs/design/round4/build/journey/AUDIT.md, B02 / B04-04 / B05 /
// B06 and #1), fixed in stream K on 2026-10-10. Pure and source checks; no browser, no network.
//   B04-04  the Desk's topic in the top bar is sans and may wrap on a phone, never cut ("Multiplying f")
//   B05     the Debrief never leads with her open prompt (a question, a fill-in blank, or the question still on the card)
//   B06     Kaksha's Finish goes to the child's Home; a 2-child account switches from Home ("Not {name}?")
//   B02     Kaksha's Hello promises what happens next, not "find what you already know"
//   #1      Kaksha's Start sends no topic: the server decides (session-first for 4A's cohort)
// Flag off, every one of these files renders today's behaviour (the conditions below).
// Run: node --test tests/r4-kaksha-audit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { closingLine } from "../src/ui-v3/kaksha/lesson/debrief.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("B05: her open prompt is never the Debrief's closing line", () => {
  const b05 = "Aapne fractions ke examples diye; ab multiplication ka meaning fill kijiye: Khaali jagah bhariye: 'Of' means __: 3/5 × 2/3.";
  assert.equal(closingLine(b05, null), "", "a fill-in blank is a prompt");
  assert.equal(closingLine("Chalo, 3/4 ka aadha kya hoga?", null), "", "a question");
  assert.equal(closingLine("Ab bataiye, 6/15 ko kis chhote fraction mein badlenge.", "ab bataiye, 6/15 ko kis chhote fraction mein badlenge"), "", "the question still on the card");
  assert.equal(closingLine("Bahut badhiya. Ab bataiye 2/4 kya hai.", "Ab bataiye 2/4 kya hai."), "", "the card's question at the end of her line");
  const close = "Achha kaam, Kabir. Kal do minute mein dekhenge ki quarters wala idea yaad hai.";
  assert.equal(closingLine(close, "Which fraction is one whole?"), close, "a real closing stays, word for word");
  assert.equal(closingLine(`  ${close}  `, null), close);
  assert.equal(closingLine("", null), "");
  assert.match(read("src/ui-v3/kaksha/lesson/Debrief.tsx"), /const closing = closingLine\(m\.caption\.text, m\.ask\?\.text\);/);
});

test("B04-04: the topic in the Kaksha top bar is sans and wraps on a phone (no mono, no nowrap cut)", () => {
  const css = read("src/ui-v3/kaksha/lesson/desk.kaksha.css");
  assert.match(css, /\[data-zone="top"\] \.dk-short \{ font-family: var\(--k-sans\); letter-spacing: 0; \}/);
  assert.match(css, /\[data-layout="phone"\] \[data-zone="top"\] \.dk-short \{ white-space: normal;/);
  assert.doesNotMatch(css, /:is\(\.dk-short, \.dk-practice\) \{ font-family: var\(--k-mono\)/);
});

test("B06: Kaksha's Finish goes Home; flag off keeps today's picker for a 2-child account; Home offers the switch", () => {
  const ls = read("src/child/lesson/LessonScreen.tsx");
  assert.match(ls, /navigate\(me\.children\.length >= 2 && !kakshaEnabled\(\(me as \{ ui\?: \{ kaksha\?: boolean \} \}\)\.ui\?\.kaksha\) \? "\/who" : `\/c\/\$\{cid\}`\);/);
  const home = read("src/ui-v3/kaksha/screens/KakshaHome.tsx");
  assert.match(home, /whoTo=\{me\.children\.length >= 2 \? "\/who" : null\}/);
  const views = read("src/ui-v3/kaksha/views.tsx");
  assert.match(views, /\{p\.whoTo && <A to=\{p\.whoTo\}/, "the switch shows only when there is a sibling");
});

test("B02: Kaksha's Hello says what happens next; flag off keeps today's line", async () => {
  const hello = read("src/child/screens/Hello.tsx");
  assert.match(hello, /young \? t\("storyStart"\) : kakshaEnabled\(\(me as \{ ui\?: \{ kaksha\?: boolean \} \}\)\.ui\?\.kaksha\) \? kt\("helloOlder"\) : t\("olderStart"\)/);
  const { KX } = await import("../src/ui-v3/kaksha/copy.ts");
  assert.doesNotMatch(KX.helloOlder.en, /already know|test|quiz|check what/i, "no promise of an assessment");
  assert.match(KX.helloOlder.en, /Nobody sees a score/);
});

test("#1: Kaksha's Start sends no topic", () => {
  const home = read("src/ui-v3/kaksha/screens/KakshaHome.tsx").replace(/\/\/.*$/gm, "");
  assert.match(home, /const startTo = `\/c\/\$\{cid\}\/lesson\/new`;/);
  assert.doesNotMatch(home, /\?topic=/);
});
