// Play evidence into the lesson (server/play/evidence.js; DESIGN.md §8). The lesson folds the play server's OWN grade only:
// a signed token bound to the child and the lesson, verified, folded once per level, via "game". Pure (no DB).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { signEvidence, verifyEvidence, playKtEvents, nextSeen, SEEN_MAX } from "../server/play/evidence.js";
import { lessonEvidence, gradeActs } from "../server/play/grade.js";
import { coverage, levelsFor, seedOf, entryKey } from "../server/play/levels.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";

describe("play evidence: signed, bound, folded once", () => {
  const key = randomBytes(32), opts = { key };
  const rows = [{ skillId: "c6-maths-ch05-t04-s1", outcome: "incorrect", misconceptionId: "c6-maths-ch05-t04-m-stop-composite", source: "game", itemId: "play:L1", probe: "P10", hintsUsed: 0, weight: 0.5 }];
  const tok = signEvidence({ childId: "c1", lessonId: "les1", levelId: "L1", rows }, opts);

  it("verifies only for its own child and lesson", () => {
    assert.equal(verifyEvidence(tok, { childId: "c1", lessonId: "les1" }, opts)?.levelId, "L1");
    assert.equal(verifyEvidence(tok, { childId: "c2", lessonId: "les1" }, opts), null);
    assert.equal(verifyEvidence(tok, { childId: "c1", lessonId: "les2" }, opts), null);
    assert.equal(verifyEvidence(tok, { childId: "c1", lessonId: "les1" }, { key: randomBytes(32) }), null, "another key");
  });
  it("a device cannot rewrite the rows (an edited payload fails the HMAC)", () => {
    const [payload, mac] = tok.split(".");
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    body.rows[0].outcome = "correct"; delete body.rows[0].misconceptionId;
    const forged = `${Buffer.from(JSON.stringify(body)).toString("base64url")}.${mac}`;
    assert.equal(verifyEvidence(forged, { childId: "c1", lessonId: "les1" }, opts), null);
    assert.equal(verifyEvidence("garbage", { childId: "c1", lessonId: "les1" }, opts), null);
    assert.equal(verifyEvidence(null, { childId: "c1", lessonId: "les1" }, opts), null);
  });
  it("an expired token is refused", () => {
    const old = signEvidence({ childId: "c1", lessonId: "les1", levelId: "L9", rows }, { key, now: Date.now() - 7 * 3600_000 });
    assert.equal(verifyEvidence(old, { childId: "c1", lessonId: "les1" }, opts), null);
  });
  it("KT events: one episode per level, code-graded, via game, misconception carried; a level folds once", () => {
    const c = { tokens: [tok, tok], childId: "c1", lessonId: "les1", startedAt: Date.now() - 60_000, now: Date.now(), childSeq: 7, seen: [] };
    const r = playKtEvents(c, opts);
    assert.equal(r.events.length, 1, "the same level twice folds once");
    const e = r.events[0];
    assert.equal(e.via, "game"); assert.equal(e.grader, "code"); assert.equal(e.cls, "item.open");
    assert.equal(e.episodeId, "les1:play:L1"); assert.equal(e.misconceptionId, rows[0].misconceptionId); assert.equal(e.target, rows[0].skillId);
    assert.deepEqual(r.levelIds, ["L1"]);
    assert.equal(playKtEvents({ ...c, seen: nextSeen([], r.levelIds) }, opts).events.length, 0, "already folded in this lesson");
    assert.equal(playKtEvents({ ...c, tokens: ["x.y"] }, opts).rejected, 1);
    assert.equal(nextSeen(Array.from({ length: SEEN_MAX }, (_, i) => `L${i}`), ["new"]).length, SEEN_MAX);
  });
  it("end to end: a real level, the server's replay grade, signed, verified, folded (correct + discriminating)", () => {
    const e = coverage().entries.find((x) => x.topicId === "c6-maths-ch05-t04" && x.goal === "atoms");
    const s = { childId: "c1", key: entryKey(e), skillId: e.skillId, classLevel: 6, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(e), 0), door: "garam", recent: [] };
    const level = levelsFor(s, e).garam, logic = LOGIC[`${level.family}/${level.mode}`];
    const g = gradeActs(level, env(logic.solve(level)), { final: true });
    const rws = lessonEvidence(g.grade, level);
    assert.equal(rws[0].outcome, "correct");
    const t = signEvidence({ childId: "c1", lessonId: "les1", levelId: level.levelId, rows: rws }, opts);
    const r = playKtEvents({ tokens: [t], childId: "c1", lessonId: "les1", startedAt: Date.now(), now: Date.now(), childSeq: 1 }, opts);
    assert.equal(r.events.length, 1);
    assert.equal(r.events[0].via, "game");
    if (level.proof.discriminates.length) assert.ok(r.events[0].discriminates);
  });
});
