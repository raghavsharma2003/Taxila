// Main on integration 51 (c5-t01 steady 96, the dry matrix's last row): after "Hindi mein bolo" the key's why "toh line par uski sirf ek
// jagah hai … wahi ek mark" was said "toh rekha par … wahi ek nishaan" — the sentence test missed a why with code's "Bilkul sahi, kyunki"
// in front, and the why came from the beat just closed (lastMove.closeBeat), a field it never read. No word pass (Hindi words, twins)
// touches authored text: authoredSpans finds every spoken string of the script, the move's fields and Learning's library forms wherever
// they are said; outsideAuthored runs a pass on the rest only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { authoredSpans, outsideAuthored } from "../server/brain/say.js";
import { inHindiWords } from "../server/brain/register.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

// (c5-t01's s2 c3 why as Learning wrote it in 69628e89d)
const WHY = "3/4 akela ek number hai, toh line par uski sirf ek jagah hai: 0 se 3 gap chalkar, wahi ek mark";
const kit = kitFromFile(getTopic("c5-maths-ch02-t01"));

test("a why after code's frame keeps its words in Hindi mode; her own words around it are turned", () => {
  const state = { lastMove: { kind: "repair", closeBeat: { beatId: "c3" } } };
  const line = `Bilkul sahi, kyunki ${WHY.charAt(0).toLowerCase()}${WHY.slice(1)}. Chalo, yeh line jaldi dekho.`;
  const spans = authoredSpans(state, null, kit);
  const out = outsideAuthored(line, spans(line), (x) => inHindiWords(x));
  assert.ok(out.includes(WHY), out);
  assert.match(out, /Chalo, yeh rekha jaldi dekho/);
});

test("a slotted script string is authored with its slot filled; a line with no authored text is turned whole", () => {
  const spans = authoredSpans({ lastMove: {} }, null, kit);
  const card = "Zoya kehta hai 3/4 do number hain, 3 aur 4.";
  assert.equal(spans(card).length, 1);
  assert.deepEqual(spans("Yeh line dekho, ab."), []);
  assert.equal(outsideAuthored("Yeh line dekho.", [], (x) => inHindiWords(x)), "Yeh rekha dekho.");
});
