// Patch request 11, AMENDED after the main safety review (server/director/safety.js + server/safety/lexicon.js): the kit
// false alarms closed by tight LESSON-shape frames; every frame has adversarial near-misses (a child's report about a friend
// in the same surface words) that must fire. Goes to tests/safety-r4-scan-bully.test.mjs when applied. FAILS on base
// a491caf (the quiet half), passes with the patch. No hooks (npm test is one process).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";

const FIRE = [
  // the main session's list
  "there's a bully in my class", "ek bully mujhe roz tang karta hai", "i am being bullied", "the bully took my tiffin again",
  "मुझे एक बुली परेशान करता है", "bullies call me names every day", "kisi ko mat batana, wo mujhe maarta hai", "papa kehte hain kisi ko mat batana",
  "uncle ne kaha kisi ko mat batana", "maarpeet hoti hai ghar pe", "ghar mein roz maarpeet hoti hai",
  // bullying, English
  "i get bullied at school", "a bully keeps hitting me", "they bully me", "there is a bully in our class who hits everyone", "the bullies at my school scare me",
  "a bully keeps taking my lunch", "i was bullied today", "my classmates bully me", "bully me mat karo", "im scared of the bully",
  // bullying, Hinglish and Devanagari
  "school mein ek bully hai jo mujhe maarta hai", "bully mera tiffin chheen leta hai", "हमारी क्लास में एक बुली है जो मुझे मारता है", "वो बुली मुझे रोज़ चिढ़ाता है",
  "mujhe bully kiya jaata hai", "hum sab ko ek bully pareshan karta hai",
  // a generic frame WITH the child in it: still fires
  "a bully and a referee are different, but a bully hits me", "who would stop a bully? he hits me every day", "standing up to a bully is hard, he beats me",
  // secrecy with an adult actor
  "mummy ne kaha kisi ko mat batana", "teacher ne bola kisi ko mat batana", "chacha kehte hain kisi ko mat batana ye hamara secret hai",
  "bhaiya ne kaha kisi ko mat batana warna maarunga", "unhone kaha kisi ko mat batana taaki koi pareshan na ho", "पापा ने कहा किसी को मत बताना",
  "बाबा ने कहा किसी को मत बताना ताकि लोग ग़रीबों पर विश्वास न छोड़ें", "baba bharati ne kaha kisi ko mat batana, wo mujhe maarte hain",
  // maarpeet with the child or at home
  "ghar pe maarpeet hoti hai", "papa mummy maarpeet karte hain", "मेरे घर में मारपीट होती है", "maarpeet ki jagah mujhe maarte hain",
];
const QUIET_ALL = [
  "a school bully and a quiet classmate", "standing up to a bully in class", "Says a bully 'has authority' in class",
  "Give the child examples — a bully, a referee, a robber, a teacher, an elected sarpanch — and ask which column, then why",
  "Disorder could grow: the strong might bully or steal from the weak without consequence — a situation like matsya nyaya — showing why legitimate, just enforcement of law is needed.",
  "Who would stop a bully or a thief?",
  "For example: parent (body changes, worries); class teacher or school counsellor (school stress, bullying); doctor (health questions); elder sibling or cousin (friendships); Childline 1098 (if ever unsafe).",
  "क्योंकि उन्होंने गुस्से में मारपीट की जगह अच्छा खेलकर जवाब दिया — खेल की चोट का जवाब खेल से; यही सच्ची खेल-भावना है",
  "बाबा भारती और प्यारा घोड़ा सुल्तान; डाकू खड़गसिंह की नज़र; अपाहिज बनकर धोखे से घोड़ा छीना; बाबा ने कहा किसी को मत बताना ताकि लोग ग़रीबों पर विश्वास न छोड़ें; मन बदला और घोड़ा लौटा दिया",
];

const NEAR = {
  pair_nonschool: ["a bully and a thief follow Meena home every evening", "the bully or the thief, who will stop them, they wait outside the gate", "a bully and a robber came to Raju's house at night", "the bully and the police uncle both shout at Aman"],
  role_list: ["a bully, a monitor and a captain gang up on the new boy", "the bully, the captain and the monitor lock Sonu in the bathroom", "a bully, a teacher, a principal, nobody helps Ria"],
  verb_generic: ["older kids always bully others in the toilet", "they will bully anyone who is new", "seniors often bully smaller kids at the bus stop"],
  helper_list: ["school counsellor (bullying) ko bataya par kuch nahi hua, ab bhi chalta hai", "class teacher (bullying) ignore karti hai, wo log roz aate hain", "doctor (bullying) said bruises are from falling but they are not"],
  stand_up: ["standing up to a bully is useless, he follows Riya home", "standing up to the bully made it worse for Aarav", "stand up to a bully? he has a knife"],
  civics: ["a bully has power in our class", "the bully has authority because his dad is the principal, he locks kids in", "a bully is the right word for the older boy who waits for Meena"],
  maarpeet_jagah: ["maarpeet ki jagah ab wo gaali dete hain ghar pe", "uncle maarpeet ki jagah dhamki dete hain", "papa ne maarpeet ki jagah belt nikaali", "match ke baad maarpeet ki jagah ghar pe thappad padte hain"],
  story: ["baba bharati ne kaha kisi ko mat batana taaki mummy naraz na ho, wo uncle hai", "baba bharati sir ne kaha kisi ko mat batana taaki koi na jaane", "बाबा भारती अंकल ने कहा किसी को मत बताना ताकि किसी को पता न चले"],
};
const REVIEW_FIRE = ["there is a bully in class who hits others", "the bully in class hits people", "a bully at school hurts someone", "there's a bully and the teacher does nothing",
  "a bully and his classmates laugh at a boy", "he is standing up to a bully who hits him", "who would stop a bully? he hits Riya",
  "Sultan uncle ne kaha kisi ko mat batana taaki mummy naraz na ho", "Kharak Singh ne kaha kisi ko mat batana taaki koi na jaane", "baba bharati uncle ne kaha kisi ko mat batana taaki koi na jaane"];

// quiet with the patch: the 8 kit lines that stay closed (c8-hindi "a school bully and a quiet classmate" is the ONE accepted
// remaining false alarm: an interestContexts string, not child text; no frame is fitted to it)
const QUIET = QUIET_ALL.filter((t) => t !== "a school bully and a quiet classmate");
// pre-existing code-floor MISSES found while writing the near-misses: quiet on base AND with the patch (out of scope here,
// reported for a separate patch; kept out of FIRE so this file tests patch 11 only)
const BASE_MISSES = ["maarpeet ki jagah ab wo gaali dete hain ghar pe", "match ke baad maarpeet ki jagah ghar pe thappad padte hain"];

describe("patch 11 (amended): lesson-shape frames, adversarial near-misses fire", () => {
  test("every disclosure still fires (bullying of the child, adult-actor secrecy, maarpeet at home)", () => {
    for (const t of FIRE) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
  });
  test("the main review's ten lines fire", () => {
    for (const t of REVIEW_FIRE) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
  });
  test("adversarial near-misses of EVERY frame fire (>= 3 per frame)", () => {
    for (const [frame, lines] of Object.entries(NEAR)) {
      const own = lines.filter((t) => !BASE_MISSES.includes(t));
      assert.ok(own.length >= 3 || frame === "maarpeet_jagah", frame);
      for (const t of own) assert.equal(scanSafety(t).distress, true, `${frame} near-miss quiet: ${t}`);
    }
  });
  test("the reversed order fires (a miss on base): maarpeet hoti hai ghar pe / ghar mein", () => {
    for (const t of ["maarpeet hoti hai ghar pe", "maarpeet hoti hai ghar mein"]) assert.equal(scanSafety(t).distress, true, t);
  });
  test("the 8 kit lines are quiet; the accepted one still fires", () => {
    for (const t of QUIET) assert.equal(scanSafety(t).distress, false, `false safeguard: ${t}`);
    assert.equal(scanSafety("a school bully and a quiet classmate").distress, true);
  });
  test("the true-content pair keeps firing", () => {
    assert.equal(scanSafety("Someone you met online says, 'Let's be best friends! Send me your photos and your school's name.' Using the story's idea of a true friend, is this a true friend? What should you do?").distress, true);
    assert.equal(scanSafety("A mirror card: 'myself' only works when the action bounces back to me (I hurt myself, I made it myself); a subject card 'I am...' is used to introduce").distress, true);
  });
});
