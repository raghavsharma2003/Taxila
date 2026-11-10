// Round 7 face-home-daily-greeting: her once-a-day home line, picked server-side from a fixed pool (no name, no model).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GREETINGS, greetingFor, localDay, partOf, langOf } from "../server/face-puppet/greetings.js";

const kid = (id, lang = "english") => ({ id, language_pref: lang });
const at = (iso) => new Date(iso);

test("the pool: three parts of the day per language, unique ids, short lines, no child name slot, Start in reach", () => {
  const ids = new Set();
  for (const [lang, parts] of Object.entries(GREETINGS)) {
    for (const part of ["morning", "afternoon", "evening"]) {
      assert.ok(parts[part]?.length >= 3, `${lang} ${part}`);
      for (const [id, text] of parts[part]) {
        assert.ok(!ids.has(id), `unique ${id}`); ids.add(id);
        assert.ok(text.length <= 70, `${id} is short`);
        assert.doesNotMatch(text, /\{|\$|name/i, `${id} has no name slot`);
        assert.doesNotMatch(text, /!.*!/, `${id}: one exclamation at most`);
      }
    }
  }
  // gendered Hindi verbs about the child are out (tum aa gaye / aayi)
  for (const [, parts] of Object.entries({ hindi: GREETINGS.hindi, hinglish: GREETINGS.hinglish })) {
    for (const lines of Object.values(parts)) for (const [id, t] of lines) assert.doesNotMatch(t, /आ गए|आ गई|aa gaye|aa gayi/i, id);
  }
});

test("India time: the day key and the part of the day", () => {
  assert.deepEqual(localDay(at("2026-11-04T02:00:00Z")), { day: "2026-11-04", hour: 7 });
  assert.equal(localDay(at("2026-11-04T19:00:00Z")).day, "2026-11-05", "00:30 IST is the next day");
  assert.equal(partOf(7), "morning"); assert.equal(partOf(13), "afternoon"); assert.equal(partOf(20), "evening"); assert.equal(partOf(2), "evening");
  assert.equal(langOf("tamil"), "hinglish");
});

test("one line per child per day: stable all day, varies across children, the clip only when rendered", () => {
  const morning = at("2026-11-04T03:00:00Z"), later = at("2026-11-04T05:00:00Z");
  const a = greetingFor(kid("c-1"), { now: morning, exists: () => false });
  assert.equal(a.part, "morning"); assert.equal(a.lang, "english"); assert.equal(a.glance, "start");
  assert.equal(a.clip, null, "no clip rendered yet: text only");
  assert.deepEqual(greetingFor(kid("c-1"), { now: later, exists: () => false }), a, "same line all morning");
  const ids = new Set(Array.from({ length: 30 }, (_, i) => greetingFor(kid(`c-${i}`), { now: morning, exists: () => false }).id));
  assert.ok(ids.size >= 2, "children get different lines");
  const withClip = greetingFor(kid("c-1", "hindi"), { now: morning, exists: () => true });
  assert.match(withClip.clip, /^\/audio\/hello-day-hi-m\d\.mp3$/);
});

test("the route is registered behind the child's own auth", () => {
  const r = readFileSync(new URL("../server/routes/tutor.js", import.meta.url), "utf8");
  assert.match(r, /"GET \/api\/tutors\/greeting": getGreeting,/);
  assert.match(r, /async function getGreeting[\s\S]*?await deps\.requireChild\(req, childId\)/);
});

test("client: owed once per day; the glance targets the Start button", async () => {
  const G = await import("../src/face-puppet/useDailyGreeting.ts");
  const g = { day: "2026-11-04", part: "morning", lang: "english", id: "en-m1", text: "x", clip: null, glance: "start" };
  assert.equal(G.greetingOwed(g, null), true);
  assert.equal(G.greetingOwed(g, "2026-11-03"), true, "yesterday's mark: owed again");
  assert.equal(G.greetingOwed(g, "2026-11-04"), false, "already greeted today");
  assert.equal(G.greetingOwed(null, null), false);
  const F = await import("../src/avatar/faceCues.ts");
  assert.deepEqual(F.GAZE_SELECTOR.start, ['[data-testid="start-lesson"]']);
  const seen = [];
  const off = F.faceCues.on((c) => seen.push(c));
  G.glanceAtStart(7);
  off();
  assert.deepEqual(seen, [{ kind: "gaze", target: "start", holdMs: F.GAZE_HOLD_MS.greeting, reason: "greeting", seq: 7 }]);
  const patch = readFileSync(new URL("../src/ui-v3/kaksha/screens/KakshaHome.tsx", import.meta.url), "utf8"); // the App's home wiring (was patch to-app/004)
  assert.match(patch, /useDailyGreeting\(cid/);
});
