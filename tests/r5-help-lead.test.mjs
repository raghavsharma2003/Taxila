// round 5 (QA D23, main safety review): the Help sheet's first action was "Talk to a grown-up at home" even when the child
// had just said the danger IS at home ("mujhe ghar pe bahut dar lagta hai, papa roz maarte hain"). The server now tells the
// client which action leads (TurnResponse.helpLead): the helplines when the safeguard is about abuse or the child's words
// name home or someone at home; a grown-up the child trusts otherwise. The copy no longer says "at home" anywhere.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { helpLeadOf, homeNamed, scanSafety } from "../server/director/safety.js";

test("QA D23: the disclosure that names home leads with the helplines", () => {
  const d23 = "mujhe ghar pe bahut dar lagta hai, papa roz maarte hain";
  assert.equal(scanSafety(d23).distress, true);
  assert.equal(helpLeadOf({ kind: scanSafety(d23).kind, text: d23 }), "helpline");
});

test("abuse leads with the helplines whoever the actor is; home or family named leads with them whatever the kind", () => {
  assert.equal(helpLeadOf({ kind: "abuse", text: "sir ne galat jagah chhua" }), "helpline");
  for (const t of ["mummy bahut maarti hai", "मम्मी बहुत मारती है", "I am scared at home", "ghar mein koi nahi sunta", "my stepdad hurts me",
    "chacha roz daant ke maarte", "papa ne belt se maara", "मेरे घर में डर लगता है"]) {
    assert.equal(helpLeadOf({ kind: "model", text: t }), "helpline", t);
  }
});

test("a safeguard that names nobody at home leads with a grown-up the child trusts", () => {
  for (const [kind, t] of [["self_harm", "main mar jaana chahta hoon"], ["fear", "school mein sab chidhate hain"], ["model", "bahut udaas hoon"],
    ["content_filter", "6 aur 5... 30"], [null, ""], ["model", "mausam accha hai"], ["model", "mammal hai"], ["model", "main akela hoon"]]) {
    assert.equal(helpLeadOf({ kind, text: t }), "grownup", `${kind}: ${t}`);
  }
  assert.equal(homeNamed(undefined), false);
});

test("no surface tells the child to find 'a grown-up at home' any more", () => {
  for (const f of ["src/ui/copy.ts", "src/parent/Pages.tsx", "src/app/Public.tsx", "server/relational/policy.js"]) {
    assert.doesNotMatch(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"), /grown-?up at home/i, f);
  }
  const sheet = readFileSync(new URL("../src/child/lesson/sheets/HelpSheet.tsx", import.meta.url), "utf8");
  assert.match(sheet, /lead === "helpline"/, "the sheet orders its actions by the server's lead");
  const turn = readFileSync(new URL("../server/brain/turn.js", import.meta.url), "utf8");
  assert.ok((turn.match(/helpLead: helpLeadNow\(\)/g) ?? []).length >= 2, "the live and the late safeguard both carry the lead");
});
