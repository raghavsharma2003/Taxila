// r7 stream E app-world-hangar-depth: the equipped Hangar emote was the one cosmetic slot that did nothing. It now rises
// beside "Sent to {T}" when the child sends the Debrief goodbye. Colour and shape only: the goodbye the server receives
// stays the child's tap from the closed set (wave / thanks / fun), and an item counts only while it is open.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { emoteLook } = await import("../src/ui-v3/kaksha/play/cosmetics.ts");
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const items = [
  { id: "emote-spark", kind: "emote", hue: "her", open: true },
  { id: "emote-star", kind: "emote", hue: "english", open: false },
  { id: "hull-thirds", kind: "hull", hue: "ion", open: true },
];

test("the equipped emote, only while open, as a glyph and a hue", () => {
  assert.deepEqual(emoteLook({ emote: "emote-spark" }, items), { glyph: "spark", hue: "her" });
  assert.equal(emoteLook({ emote: "emote-star" }, items), null, "a part the ledger has not opened never shows");
  assert.equal(emoteLook({ emote: "hull-thirds" }, items), null, "only an emote item");
  assert.equal(emoteLook({}, items), null);
  assert.equal(emoteLook({ emote: "emote-nope" }, [{ id: "emote-nope", kind: "emote", hue: "her", open: true }]), null, "an unknown emote has no glyph");
});

test("every catalog emote has a glyph in the kit", () => {
  const cat = JSON.parse(read("data/kaksha/catalog.json"));
  const kit = read("src/ui-v3/kaksha/kit.tsx");
  const map = { "emote-spark": "spark", "emote-wave": "hand", "emote-star": "star" };
  for (const it of cat.items.filter((i) => i.kind === "emote")) {
    assert.ok(map[it.id], `${it.id} is mapped`);
    assert.match(kit, new RegExp(`\\n\\s+${map[it.id]}: "`), `${map[it.id]} glyph`);
  }
});

test("the Debrief shows it only once the goodbye is sent; what is sent stays the closed set", () => {
  const d = read("src/ui-v3/kaksha/lesson/Debrief.tsx");
  assert.match(d, /\{emoted \? \(\s*<p className="kx-sub kx-db-sent" role="status">\s*\{emote && <span className="kx-db-flourish"/);
  assert.match(d, /const EMOTE_GLYPH: Record<ChildEmote, GlyphName> = \{ wave: "hand", thanks: "heart", fun: "face" \};/);
  assert.match(read("shared/contracts.ts"), /export type ChildEmote = "wave" \| "thanks" \| "fun";/);
  const k = read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx");
  assert.match(k, /setEmote\(emoteLook\(eq, items\)\);/);
  assert.match(read("src/ui-v3/kaksha/lesson/desk.kaksha.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.kx-db-flourish \{ animation: none; \} \}/);
});
