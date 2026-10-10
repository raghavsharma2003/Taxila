// Round 4 (stream 4A, patch 13, SHADOW): the item-context set-aside (server/director/itemSetAside.js). Conditions 0-4 with
// >= 3 near-misses each (the main safety review's rule), the review's 10 realistic civics answers, and the shadow contract:
// with TAXILA_ITEM_SETASIDE=shadow the predicate's result (outcome, source, every flag) is exactly what it is with it off;
// only the trace annotation is added. No child has used this; it changes nothing a child sees.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { itemSetAside, itemSetAsideMode, MAX_NOVEL } from "../server/director/itemSetAside.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { comprehensionReasons } from "../server/brain/trace.js";
import { isReason } from "../server/brain/reasons.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const itemOf = (topicId, id) => kitFromFile(getTopic(topicId)).items.find((i) => i.id === id);
const SST = itemOf("c9-sst-ch14-t01", "c9-sst-ch14-t01-i08");      // police and courts stop working: "the strong might bully …"
const TRUST = itemOf("c7-science-ch06-t02", "c7-science-ch06-t02-i11"); // circle of trust: "… (school stress, bullying) …"
const MATHS = itemOf("c1-maths-ch01-t01", "c1-maths-ch01-t01-i01");
const aside = (text, item = SST, posed = true) => itemSetAside({ text, item, posed });

describe("patch 13 (shadow): the item-context set-aside", () => {
  test("the items exist and are verified", () => {
    for (const it of [SST, TRUST, MATHS]) assert.equal(it?.verified?.agrees, true);
    assert.equal(MAX_NOVEL, 2);
  });

  test("realistic answers in the item's own words would be set aside (main review's 10: 6 on i08, the rest fire for a stated reason)", () => {
    const want = {
      "police would stop the bully": "item_context", "the bully has no authority": "item_context",
      "a referee has authority but a bully does not": "item_context", "the strong bully the weak": "item_context",
      "bully ke paas authority nahi hoti": "item_context", "police ya teacher bully ko rokenge": "actor",
      "a bully just has power, not authority": "item_context", "the referee, because a bully has no right": "guard",
      "teacher or counsellor, for bullying": "actor", "standing up to a bully means being brave": "novel",
    };
    for (const [t, why] of Object.entries(want)) assert.equal(aside(t).why, why, t);
    // spoken (STT) forms and the circle-of-trust answer without an actor word
    for (const [t, it] of [["the strong wood bully the week", SST], ["school counsellor if there is bullying", TRUST], ["school stress bullying", TRUST]]) {
      assert.equal(aside(t, it).aside, true, t);
    }
  });

  test("0: a self-harm hit is never set aside", () => {
    for (const t of ["I hurt myself", "mann karta hai mar jaun", "जीने का कोई मतलब नहीं है"]) {
      const r = aside(t, MATHS);
      assert.equal(r.aside, false, t);
      assert.equal(r.why, "self_harm", t);
    }
  });

  test("1: no posed item, another item, or an unverified item: never set aside", () => {
    assert.equal(aside("the strong would bully the weak", null).why, "no_item");
    assert.equal(aside("the strong would bully the weak", SST, false).why, "no_item", "the teacher asked another question");
    assert.equal(aside("the strong would bully the weak", { ...SST, verified: { agrees: false } }).why, "unverified");
    for (const t of ["the strong would bully the weak", "nobody would stop a bully or a thief", "class teacher for school stress and bullying"]) {
      assert.equal(aside(t, MATHS).aside, false, `another item: ${t}`);
    }
  });

  test("2 / 3: the rest fires, or too much of the child's own: never set aside (main's patch-11 near-misses)", () => {
    for (const t of ["a bully and a thief follow Meena home every evening", "seniors often bully smaller kids at the bus stop",
      "the bully, the captain and the monitor lock Sonu in the bathroom", "the strong would bully the weak and kamzor log atmahatya karenge",
      "they will bully anyone who is new and laugh at him"]) assert.equal(aside(t).aside, false, t);
  });

  test("4a: first person (raw and garble-corrected)", () => {
    for (const t of ["the strong would bully me", "a bully takes my lunch and nobody stops him", "mujhe bhi ek bully pareshan karta hai",
      "we have a bully in our class who steals", "sab mjhe chidhate hain bully"]) assert.equal(aside(t).aside, false, t);
    assert.equal(aside("teacher for bullying, I am being bullied", TRUST).why, "first_person");
  });

  test("4b: an adult actor, even one in the item's own content", () => {
    for (const t of ["the teacher would bully the weak", "mama bully karta hai weak logon ko", "papa would steal from the weak and bully them",
      "the coach would bully the weak"]) assert.equal(aside(t).why, "actor", t);
  });

  test("4c: a harm / fear / weapon word", () => {
    for (const t of ["the bully hits the weak kids", "a bully would beat the weak", "bully sabko maarta hai", "stand up to a bully? he has a knife"]) {
      assert.equal(aside(t).aside, false, t);
    }
  });

  test("4d: GUARD_VETO (repetition, reality, place, cause, secrecy)", () => {
    for (const t of ["the strong bully the weak every day", "really, a bully steals from the weak", "bully roz chori karta hai",
      "the bully at home steals from the weak"]) assert.equal(aside(t).why, "guard", t);
  });

  test("the shadow contract: the predicate result is the same with the flag off and in shadow; only the trace annotation differs", () => {
    const was = process.env.TAXILA_ITEM_SETASIDE;
    try {
      const target = targetFor({ phase: "practice", hintLevel: 0 }, kitFromFile(getTopic("c9-sst-ch14-t01")), SST);
      const texts = ["the strong bully the weak", "police would stop the bully", "the strong would bully me", "disorder and theft", "I hurt myself"];
      const run = (mode) => { process.env.TAXILA_ITEM_SETASIDE = mode; return texts.map((t) => classifyFast({ target, childText: t, typed: true, heard: SST.prompt_en, lang: "english" })); };
      const off = run("off"), shadow = run("shadow");
      for (let i = 0; i < texts.length; i++) {
        const { setAsideWould, ...rest } = shadow[i].result ?? {};
        assert.deepEqual(rest, off[i].result ?? {}, texts[i]);
        assert.deepEqual(shadow[i].flags, off[i].flags, texts[i]);
        assert.equal(off[i].result?.setAsideWould, undefined, `off adds nothing: ${texts[i]}`);
      }
      assert.equal(shadow[0].result.source, "predicate");
      assert.equal(shadow[0].result.flags.distress, true, "shadow: the floor still fires");
      assert.equal(shadow[0].result.setAsideWould.aside, true);
      // the trace codes are closed codes, never words
      const codes = comprehensionReasons({ cls: shadow[0].result, classified: true });
      assert.ok(codes.includes("safety_setaside_would.item_context"), codes.join(" "));
      for (const c of codes) assert.ok(isReason(c), c);
      const no = comprehensionReasons({ cls: shadow[2].result, classified: true });
      assert.ok(no.includes("safety_setaside_not.first_person"), no.join(" "));
    } finally {
      if (was === undefined) delete process.env.TAXILA_ITEM_SETASIDE; else process.env.TAXILA_ITEM_SETASIDE = was;
    }
  });

  test("the flag: default shadow; off / on read; on acts as shadow until the one-decision patch", () => {
    assert.equal(itemSetAsideMode({}), "shadow");
    assert.equal(itemSetAsideMode({ TAXILA_ITEM_SETASIDE: "off" }), "off");
    assert.equal(itemSetAsideMode({ TAXILA_ITEM_SETASIDE: "ON" }), "on");
  });
});
