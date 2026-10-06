// ship5 fixer (2026-10-06): regressions for the experience review's blocking findings that are fixed in code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { leaksStage, stripStage } from "../server/director/say.js";
import { RX } from "./prod/_owner.mjs";

const ART = "Riya, 20 balls ko equal groups mein dekhiye: ●●●●● ●●●●● ●●●●● ●●●●● Yahaan 4 groups hain. Ek group mein kitne?";

test("B2: a text 'diagram' of shape glyphs is caught by the reply guard and stripped, and by the owner-5 harness", () => {
  assert.equal(RX.asciiArt.test(ART), true, "the owner-5 check sees it (it missed it on 2026-10-06)");
  assert.equal(leaksStage(ART), true);
  const out = stripStage(ART);
  assert.doesNotMatch(out, /●/);
  assert.match(out, /Yahaan 4 groups hain\. Ek group mein kitne\?$/);
  for (const ok of ["3 + 4 = 7 hota hai.", "Ek tarah se → dekho", "1/2 aur 2/4 barabar hain", "Khaali jagah bharo: 5 ___ 3"]) {
    assert.equal(leaksStage(ok), false, ok);
  }
});

test("B1: the child's board ask is not declined by a reveal the child did not ask for; a requested reveal still answers", async () => {
  const { whiteboardAskOf } = await import("../server/brain/propose.js");
  const beat = { id: "b", type: "practice" };
  const move = { kind: "reteach", visual: "diagram" };
  const a = whiteboardAskOf({ beat, lane: "text", late: false, strained: false, move, requested: true, studioView: { propose: { reveal: "x:c1" } } });
  assert.equal(a.declined, null);
  assert.equal(a.proposals[0]?.kind, "ask_whiteboard");
  const b = whiteboardAskOf({ beat, lane: "text", late: false, strained: false, move, requested: true, studioView: { propose: { reveal: "x:c2", requested: true } } });
  assert.equal(b.declined, "studio_rejected.reveal_ready");
  const c = whiteboardAskOf({ beat: { id: "e", type: "explain" }, lane: "text", late: false, strained: false, move: { kind: "explain" }, studioView: { propose: { reveal: "x:c1" } } });
  assert.equal(c.declined, "studio_rejected.reveal_ready", "unchanged when the child did not ask");
});

test("B1: 'main nayi picture nahi dikha sakta' is caught and only that clause goes", async () => {
  const { saysCantShow, stripCantShow } = await import("../server/director/say.js");
  const t = "Riya, main yahan nayi picture nahi dikha sakta, par screen par 2 kg, 1 kg, 1 kg ke blocks dekhiye. 1 kg mein kitne gram hote hain?";
  assert.equal(saysCantShow(t), true);
  assert.equal(stripCantShow(t), "Screen par 2 kg, 1 kg, 1 kg ke blocks dekhiye. 1 kg mein kitne gram hote hain?");
  assert.equal(RX.cantDraw.test(stripCantShow(t)), false);
  assert.equal(saysCantShow("Dekho, main board par bana rahi hoon. Kitne hain?"), false);
});

test("B1: a board the CHILD asked for is answered by the code board after a short head start, not the 1.9 s deadline", async () => {
  const boardSync = await import("../server/stagecraft/board-sync.js");
  const { kitTopicAny } = await import("../server/stagecraft/catalogue.js");
  const kit = (await import("../server/content/kits.js")).kitFromFile((await import("../server/content/curriculum.js")).getTopic("c7-science-ch01-t01"));
  void kitTopicAny;
  const mk = (id, requested) => ({ intent: { intentId: id, lessonId: "L", kind: "whiteboard", style: { band: "B3" } }, line: { lessonId: "L", text: "Plants apna khana khud banate hain, sunlight aur water se." },
    mode: "fresh", kit: { topicId: "c7-science-ch01-t01", content: [] }, ...(requested ? { requested: true } : {}) });
  const slow = async () => (await new Promise((r) => setTimeout(r, 3000)), { ok: false, usd: 0 });
  const r = await boardSync.plan(mk("rq-1", true), { kit, planWhiteboard: slow });
  assert.equal(r.source, "code");
  assert.ok(r.syncMs <= boardSync.REQUESTED_SYNC_MS + 300, `requested board at ${r.syncMs} ms`);
  const r2 = await boardSync.plan(mk("rq-2", false), { kit, planWhiteboard: slow });
  assert.equal(r2.source, "code");
  assert.ok(r2.syncMs >= 1800, `an unrequested board keeps the sync deadline (${r2.syncMs} ms)`);
});

test("B4: on a spoken lane her own words never ask a talking child to write; the pinned kit question stays byte for byte", async () => {
  const { speakNotWrite } = await import("../server/brain/say.js");
  assert.equal(speakNotWrite("Haan, apna maths sawaal likho."), "Haan, apna maths sawaal batao.");
  assert.equal(speakNotWrite("Aap total grams likhiye."), "Aap total grams bataiye.");
  const ask = "Shabdon mein likhiye: 3/5.";
  assert.equal(speakNotWrite(`Chalo. Likh do pehle. ${ask}`, ask), `Chalo. Bata do pehle. ${ask}`);
  assert.equal(speakNotWrite("Isko fraction mein kaise likhenge?"), "Isko fraction mein kaise likhenge?");
});
