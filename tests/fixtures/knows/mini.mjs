// A small hand-made topic for knows.js unit tests: two scripted skills, keyed cards, two remediations on skill a, and kit
// items with difficulties. Invented content; not a real topic.
export const TOPIC = "c9-test-ch01-t01";
const A = `${TOPIC}-s1`, B = `${TOPIC}-s2`;
export const SKILL_A = A, SKILL_B = B;
export const MIS_X = `${TOPIC}-m-x`, MIS_Y = `${TOPIC}-m-y`, MIS_Z = `${TOPIC}-m-z`;
const said = (t) => ({ hi: t, en: t });
export const script = {
  topicId: TOPIC, version: "2.3", status: "draft",
  skills: [
    { skillId: A,
      hook: { convey: "c", interestSlots: [{ interest: "cricket", use: said("pitch") }, { interest: "vehicles", use: said("bus") }, { interest: "drawing", use: said("paper") }] },
      explain: [{ id: "e1", convey: "x", ask: { prompt: said("q1"), key: "1", targets: MIS_X } }, { id: "e2", convey: "y", ask: { prompt: said("q2"), key: "2", targets: MIS_Y } }],
      workedExample: { problem: said("p"), yourStep: { prompt: said("w"), key: "3" } },
      checks: [{ id: "c1", prompt: said("c1"), key: "4", targets: MIS_X }, { id: "c2", prompt: said("c2"), key: "5", targets: MIS_Y }],
      remediation: [{ targets: MIS_X, say: said("rx"), then: { prompt: said("tx"), key: "6" } }, { targets: MIS_Y, say: said("ry"), then: { prompt: said("ty"), key: "7" } }],
      ladder: [{ itemId: `${TOPIC}-i03` }, { itemId: `${TOPIC}-i01` }],
      bridgeToNext: said("next") },
    { skillId: B,
      hook: { convey: "c", interestSlots: [{ interest: "cooking", use: said("roti") }] },
      explain: [{ id: "e1", convey: "z", ask: { prompt: said("q3"), key: "8", targets: MIS_Z } }],
      workedExample: { problem: said("p2"), yourStep: { prompt: said("w2"), key: "9" } },
      checks: [{ id: "c1", prompt: said("c3"), key: "10", targets: MIS_Z }],
      remediation: [{ targets: MIS_Z, say: said("rz"), then: { prompt: said("tz"), key: "11" } }],
      ladder: [{ itemId: `${TOPIC}-i06` }, { itemId: `${TOPIC}-i04` }, { itemId: `${TOPIC}-i05` }] },
  ],
};
const item = (n, skillId, kind, difficulty) => ({ id: `${TOPIC}-i0${n}`, skillId, kind, difficulty, answer: String(n), prompt_en: `item ${n}`, prompt_hi: `item ${n}` });
export const kit = {
  topicId: TOPIC,
  skills: [{ id: A, title: "Skill A" }, { id: B, title: "Skill B" }],
  misconceptions: [{ id: MIS_X, belief: "x" }, { id: MIS_Y, belief: "y" }, { id: MIS_Z, belief: "z" }],
  items: [item(1, A, "practice", 3), item(2, A, "practice", 1), item(3, A, "retrieval", 2), item(4, B, "practice", 1), item(5, B, "near_transfer", 2),
    item(6, B, "practice", 4), item(7, A, "teachback", 1), { ...item(8, A, "practice", 1), diagnostic: true }],
};
