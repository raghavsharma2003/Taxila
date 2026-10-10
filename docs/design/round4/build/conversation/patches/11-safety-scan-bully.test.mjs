// Patch request 11 (server/director/safety.js + server/safety/lexicon.js; main safety review): the last 9 kit false alarms
// on the code floor, closed by FRAMES (never string allow-lists). Goes to tests/safety-r4-scan-bully.test.mjs when applied.
// FAILS on base a491caf (the quiet half and the reversed maarpeet order), passes with the patch. No hooks (npm test is one
// process).   node --test tests/safety-r4-scan-bully.test.mjs   (in a tree with 11 applied)
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
const QUIET = [
  "a school bully and a quiet classmate", "standing up to a bully in class", "Says a bully 'has authority' in class",
  "Give the child examples — a bully, a referee, a robber, a teacher, an elected sarpanch — and ask which column, then why",
  "Disorder could grow: the strong might bully or steal from the weak without consequence — a situation like matsya nyaya — showing why legitimate, just enforcement of law is needed.",
  "Who would stop a bully or a thief?",
  "For example: parent (body changes, worries); class teacher or school counsellor (school stress, bullying); doctor (health questions); elder sibling or cousin (friendships); Childline 1098 (if ever unsafe).",
  "क्योंकि उन्होंने गुस्से में मारपीट की जगह अच्छा खेलकर जवाब दिया — खेल की चोट का जवाब खेल से; यही सच्ची खेल-भावना है",
  "बाबा भारती और प्यारा घोड़ा सुल्तान; डाकू खड़गसिंह की नज़र; अपाहिज बनकर धोखे से घोड़ा छीना; बाबा ने कहा किसी को मत बताना ताकि लोग ग़रीबों पर विश्वास न छोड़ें; मन बदला और घोड़ा लौटा दिया",
];

describe("patch 11: generic bully frames, the sportsmanship answer and the Haar ki Jeet retelling", () => {
  test("every disclosure still fires: bullying of the child, secrecy with an adult actor, maarpeet at home (42 lines)", () => {
    for (const t of FIRE) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
  });
  test("the reversed order fires too (a miss on base): maarpeet hoti hai ghar pe / ghar mein", () => {
    for (const t of ["maarpeet hoti hai ghar pe", "maarpeet hoti hai ghar mein"]) assert.equal(scanSafety(t).distress, true, t);
  });
  test("the 9 kit lines are quiet: a generic or third-person frame, never about the child", () => {
    for (const t of QUIET) assert.equal(scanSafety(t).distress, false, `false safeguard: ${t}`);
  });
  test("the true-content pair keeps firing", () => {
    assert.equal(scanSafety("Someone you met online says, 'Let's be best friends! Send me your photos and your school's name.' Using the story's idea of a true friend, is this a true friend? What should you do?").distress, true);
    assert.equal(scanSafety("A mirror card: 'myself' only works when the action bounces back to me (I hurt myself, I made it myself); a subject card 'I am...' is used to introduce").distress, true);
  });
});
