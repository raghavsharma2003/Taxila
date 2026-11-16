// Round 7, stream B Voice, item voice-echo-filter-residuals (4b.md open items 3 and 4).
//   server/duplex/echo.js   a run of hers holding a negation AFTER the child's own words is the child quoting her: kept;
//                           a lone negation is never removed on arrival time alone;
//   server/duplex/fanin.js  a short burst over her line that ENDED before the device saw it still joins the carried turn.
import { test } from "node:test";
import assert from "node:assert/strict";

import { EchoSubtractor } from "../server/duplex/echo.js";
import { TurnTranscript, CARRY_PRE_MS } from "../server/duplex/fanin.js";

function sub(her, child, { whole = false } = {}) {
  const e = new EchoSubtractor();
  e.heardText("u", her, 0, 70);
  const end = her.length * 70;
  return e.subtract(child, end + 600, 0, { fromMs: whole ? 0 : Math.max(0, end - 2500), toMs: end + 400 }).text;
}

test("echo: the child quoting her phrase, negation and all, after words of their own keeps it", () => {
  const her = "Kya 8,870 ko sirf isliye galat kahenge ki woh 9,000 nahi hai?";
  assert.equal(sub(her, "Haan... matlab 8,870 toh 9,000 nahi hai na? Galat hi hoga."), "Haan... matlab 8,870 toh 9,000 nahi hai na? Galat hi hoga.");
  const her2 = "jisse woh jaanchta hai ki kaanoon Samvidhaan ke anusaar hai ya nahi?";
  assert.match(sub(her2, "Judicial review hai. Par correct hai na? Galat toh nahi hai?"), /Galat toh nahi hai\?$/);
});

test("echo: a lone negation is the child's answer, never a fresh echo", () => {
  const her = "Kya 200 thousand steps kabhi weekly goal hoga? Haan ya nahin?";
  assert.equal(sub(her, "umm... nahin?"), "umm... nahin?");
});

test("echo: her own line fed back is still removed, negations included (the floor)", () => {
  const her = "Haan ya nahin? Kya 9,000 nahi hai?";
  assert.equal(sub(her, her, { whole: true }), "");
  // her echo FIRST, then the child: the echo goes, the child's words stay
  assert.equal(sub("Square hai, rhombus nahi. Batao kyun?", "rhombus nahi. Batao kyun? kyunki angles 90 hain"), "kyunki angles 90 hain");
});

test("fan-in: a burst over her line that ended before the device's onset joins the carried turn (4b item 4)", () => {
  const f = new TurnTranscript({ source: "voicelive" });
  f.begin(0);
  f.begin(200); // her line
  f.push({ type: "final", itemId: "burst", text: "एक मिनट दीदी", t: 4720, audioStartMs: 2784, audioEndMs: 4064 });
  f.begin(4720, { carryFrom: 4120 }); // the device saw the onset at 4120, after the burst's audio had ended
  assert.equal(f.items.get("burst").inTurn, true);
  assert.ok(4120 - 2784 > CARRY_PRE_MS, "the old open-at-onset rule could not reach it");
});

test("fan-in: an item of an EARLIER epoch (the child's previous turn) never rejoins a carried turn", () => {
  const f = new TurnTranscript({ source: "voicelive" });
  f.begin(0);
  f.push({ type: "final", itemId: "prev", text: "saat", t: 1500, audioStartMs: 300, audioEndMs: 900 });
  f.begin(1600); // her reply
  f.begin(2000, { carryFrom: 1950 });
  assert.equal(f.items.get("prev").inTurn, false);
});
