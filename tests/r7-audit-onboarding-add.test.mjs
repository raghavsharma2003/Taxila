// r7 audit LEARN-08 and LEARN-09 (set-up). 08: a bad "how it sounds" spelling is refused before the child row exists (it used
// to create the child, then 400, and the retry made a twin). 09: "Add a child" forgets the child id an interrupted set-up
// left in the draft, so it creates the new child instead of PATCHing the first one with the sibling's name and class.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("LEARN-09: draftForAdd drops a stale child id and keeps what is being typed", async () => {
  const { draftForAdd } = await import("../src/onboarding/draft.ts");
  const d = { childId: "c-first", child: { firstName: "Sibling", classLevel: 3 }, lang: "hinglish" };
  const out = draftForAdd(d);
  assert.equal(out.childId, undefined);
  assert.deepEqual(out.child, d.child);
  assert.equal(draftForAdd({ child: {} }).childId, undefined);
  const src = readFileSync(new URL("../src/onboarding/ChildProfile.tsx", import.meta.url), "utf8");
  assert.match(src, /if \(adding\) set\(\(cur\) => draftForAdd\(cur\)\)/);
});

test("LEARN-08: createChild checks the spoken spelling before the insert", () => {
  const src = readFileSync(new URL("../server/routes/account.js", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("export async function createChild"));
  const check = body.indexOf("spokenNameOf(body.nameSpoken)"), insert = body.indexOf("insert into child(");
  assert.ok(check > 0 && insert > 0 && check < insert);
});
