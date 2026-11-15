// Learning, director21 → director22 (dc-r8-director21): the script data rules main named after director21, as predicates in
// scripts/lesson-scripts/check.mjs. Each is shown failing on a small script and quiet on its fix. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { voiceTextErrors, friendVerbErrors, bridgeTrueErrors, hookReuseErrors, synonymErrors, d22Errors, allBoardsResolve, jointErrors, asideReplyErrors, SEAM_KINDS } from "../scripts/lesson-scripts/check.mjs";

const T = (hi, en = "x") => ({ hi, en });

test("friendVerb: {friend} with a gendered verb is refused; {friendM}/{friendF}, 'ka kehna hai' and 'ne kaha' pass", () => {
  const s = (hi) => ({ skills: [{ checks: [{ prompt: T(hi) }] }] });
  assert.equal(friendVerbErrors(s("{friend} kehta hai 3/4 bada hai. Kya woh sahi hai?")).length, 1, "Zoya kehta hai");
  assert.equal(friendVerbErrors(s("{friendF} kehta hai 3/4 bada hai.")).length, 1, "a girl with a masculine verb");
  assert.equal(friendVerbErrors(s("{friendM} kehti hai 3/4 bada hai.")).length, 1, "a boy with a feminine verb");
  for (const ok of ["{friendM} kehta hai 3/4 bada hai.", "{friendF} kehti hai 3/4 bada hai.", "{friend} ka kehna hai ki 3/4 bada hai.", "{friendF} ne kaha ki 3/4 bada hai."])
    assert.deepEqual(friendVerbErrors(s(ok)), [], ok);
});

test("bridgeTrue: a bridge says what comes next, never a recap a lesson may not have taken", () => {
  const s = (hi, en) => ({ skills: [{ skillId: "x-s1", bridgeToNext: { hi, en } }] });
  assert.ok(bridgeTrueErrors(s("Ab tak ek roti ke barabar hisse kiye. Ab bhinn likhte hain.", "Now we write fractions.")).length >= 1);
  assert.ok(bridgeTrueErrors(s("Ab bhinn likhte hain.", "So far we cut rotis.")).length === 1, "the en recap");
  assert.deepEqual(bridgeTrueErrors(s("Ab in hisson ko bhinn mein likhna seekhenge.", "Next we write these parts as fractions.")), []);
  assert.deepEqual(bridgeTrueErrors(s("Ab agla kadam.", "Let's take the next step.")), [], "'take the' is English, not 'X the'");
});

test("hookReuse: a hook's things come back in its skill, or the hook is cut (c4 s2's dibbe)", () => {
  const sk = (use, rest) => ({ skills: [{ skillId: "x-s2", hook: { interestSlots: [{ use: T(use) }] }, explain: [{ point: T(rest) }] }] });
  assert.equal(hookReuseErrors(sk("Socho, dibbe mein laddoo rakhe hain.", "Ek patti ke 4 barabar hisse.")).length, 1);
  assert.deepEqual(hookReuseErrors(sk("Socho, dibbe mein laddoo rakhe hain.", "Har dibbe mein 4 laddoo hain.")), []);
});

test("one word per idea: two words of one synonym set in one script's spoken Hindi is refused; the glossary is not counted", () => {
  const s = (a, b) => ({ terms: [T("hissa")], skills: [{ explain: [{ point: T(a) }, { point: T(b) }] }] });
  assert.equal(synonymErrors(s("Roti ke 4 barabar tukde.", "Ek hissa 1/4 hai.")).length, 1, "tukde and hissa");
  assert.equal(synonymErrors(s("Line par 8 gaps hain.", "Har kadam 1/8 ka hai.")).length, 1, "gaps and kadam");
  assert.deepEqual(synonymErrors(s("Roti ke 4 barabar tukde.", "Ek tukda 1/4 hai.")), [], "one word, two forms");
});

const v24 = () => ({
  version: 2.4,
  teachback: { prompt: T("Ek patti ke 6 barabar tukde hain, 1 rangin. Rangin tukda kaunsa bhinn hai?"), key: "1/6", accept: ["ek bata chhe"], why: T("6 barabar tukdon mein se 1 rangin, toh 1/6.") },
  wrap: { covered: T("Aaj humne dekha ki barabar tukde hi bhinn banate hain. Neeche ka number batata hai poora kitne tukdon mein bata.", "Today we saw that only equal pieces make a fraction. The bottom number says how many pieces the whole has."), goodbye: T("Phir milte hain!", "See you next time!") },
  skills: [{ skillId: "x-s1",
    explain: [{ id: "e1", point: T("Roti ke 4 barabar tukde, har ek 1/4.", "A roti in 4 equal pieces, each 1/4."), pointAlt: T("Ek paper ko do baar modo: chaar ek jaise tukde bante hain.", "Fold a paper twice: four same pieces."),
      ask: { prompt: T("Ek tukda kaunsa bhinn hai?"), key: "1/4", why: T("4 barabar tukdon mein se ek, toh 1/4.", "One of 4 equal pieces, so 1/4."), whyAlt: T("Chaar mein se ek tukda lo, woh chauthai hai.", "Take one of four: that is a quarter.") } }],
    workedExample: { problem: T("Ek cake ke 8 barabar tukde, 3 kha liye.", "A cake in 8 equal pieces, 3 eaten."), problemAlt: T("Socho 8 dost hain aur 3 ne apna tukda le liya.", "Think of 8 friends, and 3 took their piece.") },
    checks: [{ id: "c1", prompt: T("Ek patti ke 5 barabar tukde, 2 rangin. {friendM} kehta hai yeh 2/3 hai. Kya woh sahi hai?"), key: "nahi", why: T("5 tukdon mein se 2, toh 2/5."), whyAlt: T("Neeche ka number poore tukde ginta hai, 5."),
      reask: T("Kya 5 mein se 2 rangin tukde 2/3 hain?", "Are 2 shaded of 5 pieces 2/3?") }] }],
});

test("v2.4 (E1, C1, S2): the full shape passes; each missing or wrong part is named", () => {
  assert.deepEqual(d22Errors(v24()), [], JSON.stringify(d22Errors(v24())));
  assert.deepEqual(d22Errors({ ...v24(), version: 2.3, teachback: undefined }), [], "v2.3 scripts are not asked for v2.4 fields");
  let s = v24(); delete s.teachback; assert.ok(d22Errors(s).some((x) => /^teachback:/.test(x)));
  s = v24(); s.wrap.covered.hi = "Tumne aaj bahut achha kiya. Barabar tukde bhinn banate hain."; assert.ok(d22Errors(s).some((x) => /never what the child did/.test(x)));
  s = v24(); s.wrap.covered.hi = "Barabar tukde bhinn banate hain."; assert.ok(d22Errors(s).some((x) => /exactly two sentences/.test(x)));
  s = v24(); s.skills[0].explain[0].pointAlt = T("Roti ke 4 barabar tukde, har ek 1/4.", "A roti in 4 equal pieces, each 1/4."); assert.ok(d22Errors(s).some((x) => /repeats a sentence of the first wording/.test(x)));
  s = v24(); s.skills[0].explain[0].pointAlt = T("Roti ke 4 tukde, har ek 1/4.", "A roti: 4 pieces, each 1/4."); assert.ok(d22Errors(s).some((x) => /the first wording shortened/.test(x)));
  s = v24(); delete s.skills[0].workedExample.problemAlt; assert.ok(d22Errors(s).some((x) => /problemAlt: missing/.test(x)));
  s = v24(); delete s.skills[0].checks[0].reask; assert.ok(d22Errors(s).some((x) => /cannot be asked alone: give it a reask/.test(x)), "'Kya woh sahi hai?' alone");
  s = v24(); s.skills[0].checks[0].reask = T("Kya woh sahi hai?", "Is that right?"); assert.ok(d22Errors(s).some((x) => /points back/.test(x)));
});

test("J1: four seam kinds, three forms each, from v2.4; a seam asks, judges and promises nothing", () => {
  const forms = (hi) => [T(hi, "One."), T(hi.replace("Ab", "Chalo,"), "Two."), T(hi.replace("Ab", "Toh"), "Three.")];
  const base = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c6-maths-ch06-t01.json", import.meta.url), "utf8"));
  const s = { ...base, version: 2.4, joints: { ...base.joints } };
  for (const k of SEAM_KINDS) delete s.joints[k];
  assert.ok(jointErrors(s).some((x) => /joints\.afterAside: at least 3 forms/.test(x)), "v2.4 asks for the seams");
  for (const k of SEAM_KINDS) s.joints[k] = forms("Ab wapas apne sawaal par aate hain.");
  assert.deepEqual(jointErrors(s).filter((x) => SEAM_KINDS.some((k) => x.startsWith(`joints.${k}`))), []);
  s.joints.beforeRemediation = forms("Ab yeh galat tha, baad mein dekhenge.");
  assert.ok(jointErrors(s).some((x) => /joints\.beforeRemediation\[0\]: a seam judges nothing and promises nothing/.test(x)));
  s.joints.afterTryFirst = forms("Ab yeh raha sawaal, ready?");
  assert.ok(jointErrors(s).some((x) => /joints\.afterTryFirst\[0\]: a seam is one sentence that asks nothing/.test(x)));
});

test("R3: phraseReplies, one per return, one {phrase} said back about the child; the file passes", () => {
  const d = JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8"));
  assert.deepEqual(asideReplyErrors(d), []);
  for (const [k, v] of Object.entries(d.kinds)) assert.equal(v.phraseReplies.length, v.returns.length, k);
  for (const w of ["sixer", "chauka", "catch", "wicket"]) assert.ok(d.kinds.sport.match.includes(w), w);
  const bad = structuredClone(d); bad.kinds.food.phraseReplies[0] = T("Mujhe bhi {phrase} pasand hai.", "I like {phrase} too.");
  assert.ok(asideReplyErrors(bad).some((x) => /phraseReplies\[0\]: says nothing of hers/.test(x)));
});

test("every board and answerBoard resolves, a remediation's own board too (c5-ch13-t02's 1 × 20 shade-grid)", async () => {
  const s = { skills: [{ remediation: [{ board: { template: "shade-grid@1", params: { rows: 1, cols: 20, shade: 0 } } }] }] };
  assert.ok((await allBoardsResolve(s, null)).some((x) => /remediation\[0\]\.board: shade-grid@1/.test(x)));
  s.skills[0].remediation[0].board.params.cols = 10;
  assert.deepEqual(await allBoardsResolve(s, null), []);
});

test("voice text only the script can fix (main 21:20, after Brain's renderer pass): a bare 'm' as a unit, a plural on a number, a bracketed symbol", () => {
  const s = (hi, en = "x") => ({ skills: [{ explain: [{ point: { hi, en } }] }] });
  assert.equal(voiceTextErrors(s("Kapde ke liye cm lenge ya m?")).length, 1);
  assert.equal(voiceTextErrors(s("Har m mein 100 cm hote hain.")).length, 1);
  assert.equal(voiceTextErrors(s("teeno bhujayein pata hain, sab m mein")).length, 1, "'m mein' with no other unit");
  assert.equal(voiceTextErrors(s("x", "both step in 1/5s")).length, 1);
  assert.equal(voiceTextErrors(s("Kaunsa chinh lagega: bada (>) ya chhota (<)?")).length, 1);
  for (const ok of ["Rassi 5 m lambi hai, yaani 500 cm.", "Har metre mein 100 cm hote hain.", "1/2 m aur 50 cm barabar hain.", "Kaunsa chinh lagega: bada ya chhota?"]) assert.deepEqual(voiceTextErrors(s(ok)), [], ok);
  const line = { skills: [{ explain: [{ point: { hi: "Line l ke 6 cm upar P hai; P se line m kheencho.", en: "x" } }] }] };
  assert.deepEqual(voiceTextErrors(line), [], "a line named m is a name");
});
