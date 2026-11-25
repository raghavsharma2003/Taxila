// Round d37's closing builder (BRIEF-close): nine small items, each pinned here on both sides.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { textReply, replyDeps, beatAsk, rotateOf, notAskingUnderstood, ASKS_UNDERSTOOD } = await import("../server/brain/say.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** A lesson walked with step() and textReply (the reply stubbed: every line is the script's or code's): `lines` are [text, cls]. */
async function walk(TOPIC, lines, seed = 7) {
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 5, sessionId: `d37-close-${seed}`, lessonKey: `d37-close-${seed}`, teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed, now: 0 }), { event: "start", kit, now: 0 });
    const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
    const out = [];
    for (const [text, cls] of lines) {
      const s = r.state;
      r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
      const t = await say(text);
      r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
      out.push({ text: norm(t.reply), lm: r.state.lastMove ?? {}, state: r.state, kit });
    }
    return out;
  } finally { replyDeps.chat = chat0; replyDeps.chatStream = stream0; }
}

describe("item 1: A(ii)'s first turn after two requests at the greeting never ends on a 'samajh aaya' check-in", () => {
  const XS = ["Yahan tak theek hai?", "Ab tak samajh aaya?", "Yahan tak saaf hai?", "Yeh hissa saaf hua?"];
  test("the helper: a 'samajh aaya' form gives way to the next form of the same list; any other form stands", () => {
    assert.equal(notAskingUnderstood("Ab tak samajh aaya?", XS), "Yahan tak saaf hai?");
    assert.equal(notAskingUnderstood("Yahan tak theek hai?", XS), "Yahan tak theek hai?");
    assert.equal(notAskingUnderstood("Yeh kadam samajh aaya?", ["Yahan tak theek hai?", "Ab tak samajh aaya?", "Yeh kadam saaf hai?", "Yeh kadam samajh aaya?"]), "Yahan tak theek hai?");
    assert.equal(notAskingUnderstood("Does that make sense so far?", ["Does that make sense so far?", "Clear so far?"]), "Clear so far?");
  });
  test("c5-t01 (both judges of cause A: stuck 4, steering 4): over twelve seeds the turn is the start line, the hook and the point, and its check-in is never a 'samajh aaya' form", async () => {
    const GIVE = ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }];
    let rotated = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const [, t] = await walk("c5-maths-ch02-t01", [["samajh nahi aaya", { outcome: "no_evidence", request: { type: "another" } }], GIVE], seed);
      assert.ok(t.lm.startApart, `seed ${seed}: A(ii)'s split first turn`);
      const end = t.text.split(/(?<=[.?!])\s+/).at(-1);
      const xs = beatAsk(t.kit).hinglish;
      assert.ok(xs.includes(end), `seed ${seed}: ends on one of the list's own forms: ${end}`);
      assert.ok(!ASKS_UNDERSTOOD.test(end), `seed ${seed}: ${end}`);
      // (the other side: the rotation alone, at that same state, would have said a "samajh aaya" form on some seeds)
      if (ASKS_UNDERSTOOD.test(rotateOf(xs, { ...t.state, recent: t.state.recent.slice(0, -1) }))) rotated++;
    }
    assert.ok(rotated > 0, "the rotation alone picks a 'samajh aaya' form on some seed: the rule is what keeps it out");
  });
});

describe("item 2: cardDroppedAfterShortAsk (gated) — after a short ask or an invitation, a different card's question with nothing ending the first", async () => {
  const { lessonFlags, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const { questionObjectAt, yourTurnForms, SHORT_ASK_FORMS } = await import("../server/director/question-run.js");
  const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
  const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const C = (text) => ({ who: "child", text });
  const Cr = (text, read) => ({ who: "child", text, read });
  const flags = (rows) => lessonFlags({ rows, script }).filter((f) => f.predicate === "cardDroppedAfterShortAsk").map((f) => f.row);
  const q = (P) => questionObjectAt(script, P);
  const E1 = ".skills[0].explain[0].ask", E2 = ".skills[0].explain[1].ask";
  const e1 = norm(q(E1).prompt.hi), e2 = norm(q(E2).prompt.hi);
  const T = (text, seams, extra = {}) => ({ who: "teacher", text, cell: { part: "x", column: "yes" }, seams: sx(...seams), ...extra });
  const asked1 = T(`Yeh roti dekho. ${e1}`, ["point", "card"]);
  const KEY1 = "Is sawaal ka jawab 1/2 hai, kyunki rangin tukda roti ke 2 barabar tukdon mein se 1 hai.";
  test("gated (not pending)", () => { assert.ok(!PENDING.has("cardDroppedAfterShortAsk")); });
  for (const [name, stand] of [["a short ask", T(SHORT_ASK_FORMS[0], ["reaskShort"])], ["an invitation", T(yourTurnForms(script)[0], ["yourTurn"])]]) {
    test(`after ${name}: the next card with no key flagged; with the key, a told step or the cap, or after a right answer, not`, () => {
      const lead = [asked1, C("haan"), stand, C("haan")];
      assert.deepEqual(flags([...lead, T(e2, ["card"])]), [4]);
      assert.deepEqual(flags([...lead, T(`${KEY1} ${e2}`, ["key", "card"])]), []);
      assert.deepEqual(flags([...lead, T(e2, ["card"], { heardCap: E1 })]), []);
      assert.deepEqual(flags([...lead, T(e2, ["card"], { stepAnswer: { told: true } })]), []);
      assert.deepEqual(flags([asked1, C("haan"), stand, Cr("1/2", "correct"), T(`Bilkul sahi. ${e2}`, ["verdict", "card"])]), []);
      // (the same card again: not this check's)
      assert.deepEqual(flags([...lead, T(e1, ["card"])]), []);
    });
  }
  test("after a turn that said the question itself (no short ask), the next card is not this check's", () => {
    assert.deepEqual(flags([asked1, C("haan"), T(e2, ["card"])]), []);
  });
});

describe("item 3: 'kyunki' twice running live (a2-out steady c6-ch07-t01 32 beside 24) — no model call", async () => {
  const { neutralRightVerdict } = await import("../server/brain/say.js");
  const { seamPass } = await import("../server/brain/seams.js");
  // (the two rows' texts: row 24 her verdict before, rows 26 to 30 between; row 32's verdict was code's neutral line after her reply was
  // blocked on completion — guard content_filter_output, replaced — and that line always took ", kyunki")
  const ROW24 = "Haan, bilkul theek, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Ab tak samajh aaya?";
  const ROW26 = "Hissa tabhi 1/3 kehlata hai jab hisse barabar hon, aur lambe poore ka hissa bhi lamba. Ab poora wahi rahega, bas hisson ki ginti badlegi. Yahan tak saaf hai?";
  const ROW28 = "Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. Ek 1/3 wale hisse mein 1/6 wale kitne hisse aate hain?";
  const ROW30 = "Haan, pehle tum try karo.";
  const WHY32 = "har 1/3 jitni jagah mein do 1/6";
  const recent = [ROW24, ROW26, ROW28, ROW30].map((text) => ({ who: "teacher", text }));
  test("the neutral line's right verdict after row 24's ', kyunki' (state.whyJoint.last 0) takes another lead-in; the rotation is recorded", () => {
    for (const key of ["a", "b", "c", "d", "e"]) {
      const v = neutralRightVerdict(WHY32, { ctx: { lessonKey: key }, recent, whyJoint: { last: 0, n: 3 } }, null, "hinglish");
      assert.ok(!/, kyunki /.test(v.text), v.text);
      assert.notEqual(v.k, 0);
      assert.match(v.text, /har 1\/3 jitni jagah mein do 1\/6/i);
    }
    // (the other side: after a verdict whose lead-in was not ", kyunki", the rotation may take it — it is not banned, only never twice running)
    const ks = new Set(["a", "b", "c", "d", "e", "f", "g"].map((key) => neutralRightVerdict(WHY32, { ctx: { lessonKey: key }, recent, whyJoint: { last: 1, n: 3 } }).k));
    assert.ok(ks.has(0), "kyunki is still one of the forms");
    // (English keeps its one form)
    assert.match(neutralRightVerdict("each 1/3 holds two 1/6", { ctx: { lessonKey: "a" } }, null, "english").text, /, because each 1\/3 holds two 1\/6$/);
  });
  test("the join check: a model's right-verdict opener holding the lead-in her verdict before used falls back to the table's frame; another passes", () => {
    const frames = ["Haan, sahi hai", "Haan, bilkul theek", "Bilkul sahi"];
    const run = (mj, last) => seamPass([{ part: "close", text: `Haan, sahi hai. ${WHY32[0].toUpperCase()}${WHY32.slice(1)}.` }, { part: "card", text: "Agla sawaal?" }],
      { kit: { topicId: "t", __joints: {} }, state: { ctx: { lessonKey: "L" }, recent, whyJoint: { last, n: 3 } }, lang: "hinglish", info: { modelJoins: mj, verdictFrames: frames } });
    const r1 = run({ verdict: "Haan sahi, kyunki tumne dhyan se dekha" }, 0);
    assert.equal(r1.seams[0].opener.by, "authored"); assert.match(r1.seams[0].opener.fellBack, /lead-in of her verdict before/);
    assert.match(r1.list[0].text, /^Haan, sahi hai\./);
    const r2 = run({ verdict: "Wah, ekdum sahi pakda" }, 0);
    assert.equal(r2.seams[0].opener.by, "model");
    // (the same words after a verdict whose lead-in was a sentence of its own: not refused by this rule)
    assert.equal(run({ verdict: "Haan sahi, kyunki tumne dhyan se dekha" }, 1).seams[0].opener.fellBack ?? null, null);
  });
});

describe("item 4: keyValueTwice counts the value to the end of the sentence that holds the why's tail (pr4b section 1)", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const st = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch06-t01.json", import.meta.url), "utf8"));
  const ys = st.skills[0].workedExample.yourStep, sp = `${st.skills[0].skillId}:worked:yourStep`;
  const why = ys.why.hi.replace(/[.!?]+$/, ""), Why = `${why.charAt(0).toUpperCase()}${why.slice(1)}`;
  const row = (text) => ({ who: "teacher", text, cell: { part: sp, column: "wrong" }, seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "key" }, { left: "key", right: "checkin" }] });
  const fl = (r) => lessonFlags({ rows: [{ who: "child", text: "5" }, r], script: st }).filter((f) => f.predicate === "keyValueTwice").map((f) => f.row);
  test("the why said alone, its sentence closed: not flagged; the value said once more after the why in the same sentence: flagged", () => {
    assert.equal(String(ys.key).match(/\d+/)?.[0], "7");
    assert.deepEqual(fl(row(`Nahi, yeh jawab nahi hai. ${Why}. Yahan tak theek hai?`)), []);
    assert.deepEqual(fl(row(`Nahi, yeh jawab nahi hai. ${Why}, yaani 7 khaane. Yahan tak theek hai?`)), [1]);
    // (a value in the NEXT sentence is not the key's reason: not counted, as before)
    assert.deepEqual(fl(row(`Nahi, yeh jawab nahi hai. ${Why}. Ab 7 se aage chalo. Yahan tak theek hai?`)), []);
  });
});

describe("item 5: a miss verdict over a picture turn's kept split page keeps the card's board up until the help's board draws (c-out steering c5-ch02-t02 18)", async () => {
  const bf = await import("../server/stagecraft/board-first.js");
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 9, shade: 0, label: "" }, { parts: 11, shade: 0, label: "" }] } };
  const wholes = { template: "wholes@1", params: { wholes: [{ parts: 2, title: "Roti" }, { parts: 10, title: "Roti" }] } };
  const text = "Abhi yeh sahi nahi hai. Board par dono roti dekho: 2 hisson wali roti ka ek hissa aadhi roti hai, aur 10 hisson wali ka ek hissa bahut patla. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?";
  const u = "c5-maths-ch02-t02-s1:rem:x";
  const ask = { intent: { held: { board: bars, unit: u, switchTo: { board: bars, unit: u, atChar: 142 }, switches: [{ board: wholes, unit: `${u}#help`, atChar: 24 }, { board: bars, unit: u, atChar: 142 }], clearIfFull: true }, style: { band: "B3" } }, line: { text } };
  const one = (b) => bf.heldBoard({ intent: { held: { board: b, unit: u }, style: { band: "B3" } }, line: { text: "x" } }).lastPage;
  const barsPage = one(bars), viewPage = one(wholes);
  // (the page up after the picture turn: the held board with its view beside — the held board's ops and the view's)
  const split = { ...barsPage, ops: [...barsPage.ops, ...viewPage.ops.map((o) => ({ ...o, id: `v${o.id}`.slice(0, 32) }))] };
  const pages = (r) => r.screens.map((s) => [s.from, s.template]);
  test("the split page kept up (keptBeside): the card's board under the verdict, then the roti board, then the card's again — no blank page", () => {
    const r = bf.heldBoard(ask, { keepRef: bf.refKey(bars), keepPage: { ...split, keptBeside: { template: "wholes@1", altView: "wholes" } } });
    assert.deepEqual(pages(r), [[0, "fraction-bars@1"], [24, "wholes@1"], [142, "fraction-bars@1"]]);
  });
  test("the other side, as built: the same full page with no view beside still clears at the first word where it will not join", () => {
    const r = bf.heldBoard(ask, { keepRef: bf.refKey(bars), keepPage: split });
    assert.deepEqual(pages(r), [[0, null], [24, "wholes@1"], [142, "fraction-bars@1"]]);
    // (and the card's board alone up joins as before: kept under the verdict)
    assert.deepEqual(pages(bf.heldBoard(ask, { keepRef: bf.refKey(bars), keepPage: barsPage })), [[0, "fraction-bars@1"], [24, "wholes@1"], [142, "fraction-bars@1"]]);
  });
});

describe("item 6c: cause B's twelve driven walks (b3/ROWS4.md, evals/hybrid-side-by-side/tools/walkwait.mjs) read 0 gated flags", async () => {
  const { walkWait, walkFlags } = await import("../evals/hybrid-side-by-side/tools/walkwait.mjs");
  const H10 = "haan|haan|haan|haan|haan|haan|haan|haan|haan|haan";
  const WALKS = [["c4-maths-ch05-t01", "step", "try|haan|haan|haan|haan|haan"], ["c4-maths-ch05-t01", "step", "give|try|haan|haan|haan|haan"],
    ["c4-maths-ch05-t01", "card", "haan|haan|haan|haan|haan|haan"], ["c4-maths-ch05-t01", "card", "give|give|haan|haan|haan|haan"],
    ["c6-maths-ch07-t01", "step", "try|haan|haan|haan|haan|haan"], ["c6-maths-ch07-t01", "step", "give|try|haan|haan|haan|haan"],
    ["c6-maths-ch07-t01", "card", "haan|haan|haan|haan|haan|haan"], ["c6-maths-ch07-t01", "card", "give|give|haan|haan|haan|haan"],
    ["c4-maths-ch05-t01", "card", H10], ["c4-maths-ch05-t01", "card", "aside|haan|haan|haan|haan|haan"],
    ["c4-maths-ch05-t01", "card", "haan|aside|haan|haan|haan|haan"], ["c6-maths-ch07-t01", "card", "haan|haan|aside|haan|haan|haan"]];
  WALKS.forEach(([topic, which, seq], n) => {
    test(`walk ${n + 1}: ${topic}, first ${which}, ${seq}`, async () => {
      const w = await walkWait(topic, which, seq, 0);
      assert.ok(w.found, "the walk reaches the question");
      assert.equal(w.log.length, seq.split("|").length);
      assert.deepEqual(await walkFlags(w, ["gated"]), []);
    });
  });
});

describe("item 6a/6b: the rule-based children (evals/child-sim/reactive.mjs)", async () => {
  const { createReactiveChild } = await import("../evals/child-sim/reactive.mjs");
  const kit = { topicId: "c5-maths-ch02-t01" };
  test("6a: her 'kab …?' question about the aside is answered with a when; a 'kiske saath' still with a with whom", () => {
    const c = createReactiveChild({ persona: "offtopic", seed: 1, kit });
    const a = c.reply({ turn: 3, returned: true, teacher: "Tumne pehli baar Virat ko kab dekha tha?" });
    assert.match(a.text, /saal|chhota|chhoti|chhuttiyon/);
    const b = c.reply({ turn: 4, returned: true, teacher: "Virat ko tum kiske saath dekhte ho?" });
    assert.match(b.text, /saath dekhta|saath dekhti/);
  });
  test("6b: at a yes-or-no check-in the stuck and steering children say yes or 'nahi', never 'pata nahi, aap batao'; at another open question as before", () => {
    for (const persona of ["stuck", "steering"]) {
      const seen = new Set();
      for (let seed = 1; seed <= 40; seed++) {
        const c = createReactiveChild({ persona, seed, kit, toEnd: true });
        const o = c.reply({ turn: 25, teacher: "Ek roti ke 2 barabar hisse hain. Yahan tak theek hai?" });
        if (o.kind !== "ack") continue; // (a scheduled event of the persona's on this turn: not this rule's)
        const t = o.text;
        assert.match(t, /^(?:haan|mujhe lagta hai haan|nahi)\b/, `${persona} ${seed}: ${t}`);
        assert.ok(!/pata nahi/.test(t), t);
        seen.add(t.startsWith("nahi") ? "no" : "yes");
      }
      assert.ok(seen.has("no"), `${persona}: some child does not understand`);
    }
    // (the steady child, and any child at a question that is no check-in, as before: a give-up line where it does not know)
    const other = new Set();
    for (let seed = 1; seed <= 40; seed++) other.add(createReactiveChild({ persona: "stuck", seed, kit, toEnd: true }).reply({ turn: 25, teacher: "Socho, isme kya khaas hai?" }).text);
    assert.ok([...other].some((t) => /pata nahi|samajh nahi|nahi pata/.test(t)), [...other].join(" | "));
  });
});

describe("item 8: the reply's {word} is never an auxiliary or other function word (wr-d's B, offtopic c4-ch01-t02 34 'Achha, hoon!')", async () => {
  const { replyWordOf, asideReplyLine, FUNCTION_WORDS } = await import("../server/brain/asideReplies.js");
  const { j2WordsOf } = await import("../server/brain/say.js");
  test("the picker and the slot leave the function words out; a content word of the line is still taken", () => {
    for (const w of ["hoon", "hai", "hain", "tha", "thi", "the", "ho", "hun", "raha", "rahi", "ke", "ka", "ki", "se", "mein", "ko", "aur", "saath"]) assert.ok(FUNCTION_WORDS.has(w), w);
    assert.ok(!j2WordsOf("papa ke saath dekhta hoon", "cricket").some((w) => FUNCTION_WORDS.has(w)));
    assert.equal(replyWordOf(["hoon", "saath"], "papa ke saath dekhta hoon"), null);
    assert.equal(replyWordOf(j2WordsOf("papa ke saath dekhta hoon", "cricket"), "papa ke saath dekhta hoon"), "papa");
    // (the other side: a content word stands as before)
    assert.equal(replyWordOf(["batting"], "batting karna"), "batting");
  });
  test("the reply to 'Virat ko tum kiske saath dekhte ho?': never 'Achha, hoon!'; with no content word left, a form with no slot", () => {
    const asked = "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?";
    const r = asideReplyLine({ said: "papa ke saath dekhta hoon", topic: "cricket", lang: "hinglish", n: 0, words: j2WordsOf("papa ke saath dekhta hoon", "cricket"), asked });
    assert.ok(!/hoon!/.test(r.line ?? r), JSON.stringify(r));
    const r2 = asideReplyLine({ said: "saath mein hoon", topic: "", lang: "hinglish", n: 0, words: ["hoon", "saath"], asked });
    const line2 = String(r2.line ?? r2);
    assert.ok(!/hoon!/i.test(line2) && !/\{word\}/.test(line2), line2);
  });
});

describe("item 9: a key's value said as a Hindi number word (C2 whyNamesKey and keyValueTwice read them)", async () => {
  const { whyNamesKey, numbersSaid, keyLine } = await import("../server/director/help.js");
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const WHY98 = "2 metre = 200 centimetre; har ribbon 50, yaani aadha metre: ek metre mein do, toh chaar ribbon";
  test("numbersSaid: a number word for one of the key's numbers; 'ek' never; 'do' not after a verb", () => {
    assert.deepEqual(numbersSaid(WHY98, ["4"]), ["2", "200", "50", "4"]);
    assert.deepEqual(numbersSaid("ek hissa aur ek aur", ["1"]), []);
    assert.deepEqual(numbersSaid("isko kar do, phir do hisse", ["2"]), ["2"]);
    assert.deepEqual(numbersSaid("aadha metre", ["1/2"]), ["1/2"]);
    assert.deepEqual(numbersSaid("teen aur chaar", []), []);
  });
  test("whyNamesKey (C2): f/dry1 steady c4-ch06-t01 98's why says 'chaar' — the told answer is the why alone; a why with no such word is not", () => {
    assert.equal(whyNamesKey("4", WHY98), true);
    assert.equal(keyLine({ key: "4", why: { hi: WHY98 } }).text, `${WHY98.charAt(0).toUpperCase()}${WHY98.slice(1)}.`);
    assert.equal(whyNamesKey("4", "2 metre = 200 centimetre; har ribbon 50"), false);
    assert.match(keyLine({ key: "4", why: { hi: "har ribbon 50" } }).text, /^Iska jawab hai 4, kyunki/);
    // (a key told in its Hindi words — keyInLang's "baarah mein se das" for "10 hisse", f/dry1 offtopic c6-ch07-t03 30)
    assert.equal(whyNamesKey("baarah mein se das", "6 ke 12 hisse karne par har hissa 2 mein kata, toh 5 hisse 10 chhote hisson ke barabar"), true);
    assert.equal(whyNamesKey("baarah mein se das", "har hissa 2 mein kata"), false);
  });
  test("keyValueTwice / teachbackKeyValueTwice: the value said as a digit and again as its word is said twice; the why alone once", () => {
    const st = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c6-maths-ch07-t03.json", import.meta.url), "utf8"));
    const c1 = st.skills[0].checks[0], part = `${st.skills[0].skillId}:check:c1`;
    const why = c1.why.hi;
    const row = (text) => ({ who: "teacher", text, cell: { part, column: "misconception" }, seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "key" }, { left: "key", right: "checkin" }] });
    const fl = (r) => lessonFlags({ rows: [{ who: "child", text: "5" }, r], script: st }).filter((f) => f.predicate === "keyValueTwice").map((f) => f.row);
    assert.deepEqual(fl(row(`Nahi, yeh theek nahi hai. Is sawaal ka sahi jawab: baarah mein se das, kyunki ${why}. Yahan tak saaf hai?`)), [1]);
    assert.deepEqual(fl(row(`Nahi, yeh theek nahi hai. ${why.charAt(0).toUpperCase()}${why.slice(1)}. Yahan tak saaf hai?`)), []);
  });
});
