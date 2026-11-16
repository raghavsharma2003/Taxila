// Round 8, the laws ruling of 2026-11-15 (docs/design/round8/games-judging/RULINGS-2026-11-15.md, row 1): in the science
// families, while a try remains the screen and the line say what her act did, never what is true; what is true is said once,
// on the solved screen. server/forge3/qa/laws.mjs IDEA_WORDS lists, per (family/mode) and goal, the words of the idea the
// solved line states; a text drawn after a miss (not on the first screen) holding one fails law 2. This suite holds:
//   - the check catches a miss line that states the idea (the lines as they were before the ruling, in all three languages);
//   - every miss line of these modes, in all three languages, holds no idea word of its goal;
//   - each goal's solved line states its idea in all three languages (the idea moved, it did not vanish);
//   - over every served level of these modes, in en and hi too (hinglish: tests/r8-play-laws), the laws find no break.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const L = await import("../server/forge3/qa/laws.mjs");
const WORDS = JSON.parse(readFileSync("data/play/engine-words.json", "utf8")).words;
const LANGS = ["hinglish", "en", "hi"];
const fill = (s) => s.replace(/\{\w+\}/g, "Bajra");

/** the miss lines (why codes) each goal can show while a try remains, under the family's word prefix */
const MISS = {
  "aakash/chakkar": { pre: "aakash", din: ["sun_still", "not_now"], saal: ["sun_still", "spun_not_round", "not_day_move", "short_year", "short_day", "long_day", "round_done", "dizzy"] },
  "aakash/ritu": { pre: "aakash", jhuk: ["axis_same", "near_winter", "not_here"], dhoop: ["spread", "spread_some", "not_yet"] },
  "aakash/grahan": { pre: "aakash", chaaya: ["off_line", "phase", "wrong_side"], kab: ["off_line", "phase", "wrong_side"] },
  "badlaav/aag": { pre: "badlaav", trikon: ["lid_air", "keep_wood", "nothing_changes", "out", "strong_already"], raakh: ["into_air", "wrong_place", "still_fuel", "not_all", "not_found"], jang: ["not_dirt", "clean", "place_all", "enough"] },
  "bhaap/hawa": { pre: "bhaap", naav: ["ashore", "far_out", "wrong_way"], kamra: ["stays_warm", "no_device"] },
  "chhaano/sukha": Object.assign({ pre: "chhaano" }, Object.fromEntries(["farak", "kram"].map((g) => [g, ["far", "same_weight", "same_size.stay", "same_size.pass", "mixed", "cannot_pick", "attached", "no_stalks", "pure"]]))),
  "jaanch/neela": { pre: "jaanch", iodine: ["not_sugar", "stayed_brown", "blue_black", "few_drops"] },
  "rang/pehchaan": { pre: "rang", litmus: ["own_red", "not_sure", "wrong_bin", "untested"], desi: ["made_red", "not_sure", "wrong_bin", "untested"] },
  "rang/milao": { pre: "rang", boond: ["still_pink", "diluted", "too_much", "no_green", "salt_water"], ilaaj: ["still_pink", "diluted", "too_much", "no_green", "salt_water"] },
  "yantra/roshni": { pre: "yantra.roshni", parda: ["blur_clear", "too_clear", "some_light", "no_light"], roshan: ["moon_dark", "all_dark", "no_light_on_it", "not_clearly", "blocked", "glow_seen", "light_seen", "lit_seen"], dhak: ["moon_covered", "plate_covered", "still_light"] },
};
/** the solved line of each goal */
const doneKey = (key, goal) => key === "chhaano/sukha" ? "chhaano.done.sukha" : `${MISS[key].pre}.done.${goal}`;

/** fixtures: miss lines that state the idea (the lines these goals showed before the ruling, or one shaped like them) */
const STATED = {
  "aakash/chakkar|din": ["Sooraj wahin rehta hai. Prithvi ghoomti hai.", "The Sun stays put. The Earth spins and carries the place.", "सूरज वहीं रहता है। पृथ्वी घूमती है।"],
  "aakash/chakkar|saal": ["Yeh ek chakkar apne upar tha: ek din. Jagah wahi hai.", "That was one spin: a day. It is still in the same place.", "यह अपने ऊपर एक चक्कर था: एक दिन। जगह वही है।", "Sooraj ka chakkar saal ki chaal hai, din ki nahi."],
  "aakash/ritu|jhuk": ["Dhuri poore raaste ek hi taraf rehti hai.", "The axis keeps pointing the same way all the way round.", "धुरी पूरे रास्ते एक ही ओर रहती है।", "Closest to the Sun, but the north's light slants: winter.", "सूरज के सबसे पास, पर उत्तर में धूप तिरछी: सर्दी।"],
  "aakash/ritu|dhoop": ["Wahi roshni zyada khaanon par faili: barf rahi.", "The same light spreads over more squares: the ice stays.", "वही रोशनी ज़्यादा खानों पर फैली: बर्फ़ रही।", "Seedhi: chhota, tez"],
  "aakash/grahan|chaaya": ["Sooraj, Chaand aur Prithvi ek seedhi line mein nahi.", "Not lined up for that eclipse here.", "सूरज, चाँद और पृथ्वी एक रेखा में नहीं।"],
  "aakash/grahan|kab": ["Grahan tabhi jab teenon ek line mein hon.", "The Moon passes above or below the line most months.", "तीनों एक रेखा में नहीं थे।"],
  "badlaav/aag|trikon": ["Dhakkan hawa rokta hai: pankha hawa bhejta hai, garmi nahi.", "The lid keeps the air out: a fan sends air, not heat.", "ढक्कन हवा रोकता है: पंखा हवा भेजता है, गर्मी नहीं।"],
  "badlaav/aag|raakh": ["Nasht nahi hua: zyada hissa gas ban kar hawa mein gaya.", "Not destroyed: most went into the air as gases.", "नष्ट नहीं हुआ: ज़्यादा हिस्सा गैस बनकर हवा में गया।"],
  "badlaav/aag|jang": ["Mitti nahi: jang nayi cheez hai. Ise oxygen aur paani chahiye.", "Not dirt: rust is a new substance. It needed oxygen and water.", "मिट्टी नहीं: जंग नई चीज़ है। इसे ऑक्सीजन और पानी चाहिए था।"],
  "bhaap/hawa|naav": ["Hawa samundar se zameen ki taraf chal rahi hai: naav kinaare par hi rehti hai.", "The breeze blows from the sea onto the land: the boat stays on the shore.", "हवा समुद्र से ज़मीन की तरफ़ चल रही है: नाव किनारे पर ही रहती है।"],
  "bhaap/hawa|kamra": ["Thandi hawa neeche farsh par hi rehti hai: upar kamra garam rehta hai.", "The cool air stays down at the floor: the room above stays warm.", "ठंडी हवा नीचे फ़र्श पर ही रहती है: ऊपर कमरा गरम रहता है।"],
  "chhaano/sukha|farak": ["Bori mein Bhoosa aa gaya! Bajra paas hi gira", "The husk blew into the sack! The bajra fell near", "बोरी में भूसा आ गया! बाजरा पास ही गिरा", "Bajra aur Bhoosa sab chalni se neeche gir gaye: ek hi size ke hain", "The parts all stayed on the sieve: they are one size", "सब छलनी पर रुक गए: एक ही साइज़ के हैं"],
  "chhaano/sukha|kram": ["Bori mein Bhoosa aa gaya! Gehun paas hi gira"],
  "jaanch/neela|iodine": ["Bhoora hi raha: iodine starch dikhata hai, cheeni nahi.", "It stayed brown: iodine shows starch, not sugar.", "भूरा ही रहा: आयोडीन स्टार्च दिखाता है, चीनी नहीं।"],
  "rang/pehchaan|litmus": ["Acid neele litmus ko laal karta hai.", "An acid turns blue litmus red.", "अम्ल नीले लिटमस को लाल करता है।"],
  "rang/pehchaan|desi": ["Sabun se gudhal bhi hara: woh pehle se basic tha.", "Gudhal goes green for soap too: it was basic.", "साबुन से गुड़हल भी हरा: वह पहले से क्षारीय था।"],
  "rang/milao|boond": ["Ab hara: zyada base se yeh basic ho gaya.", "Green now: the extra base made it basic.", "अब हरा: ज़्यादा क्षार से यह क्षारीय हो गया।", "Paani sirf patla karta hai: gulaabi hai, acidic hai.", "Water only dilutes it: still pink, still acidic.", "पानी सिर्फ़ पतला करता है: गुलाबी है, अम्लीय है।"],
  "rang/milao|ilaaj": ["Base ne acid ka asar khatam kiya.", "The base cancelled the acid.", "क्षार ने अम्ल ख़त्म किया।"],
  "yantra/roshni|parda": ["Dikha, par saaf nahi: Butter paper thodi hi roshni jaane deta", "Seen, but not clearly: butter paper lets only some light pass", "दिखा, पर साफ़ नहीं: बटर पेपर थोड़ी ही रोशनी जाने देता"],
  "yantra/roshni|roshan": ["Chaand andhera hi raha: us par dhoop nahi padi", "No light falls on the book: the eye cannot see it", "किताब पर रोशनी नहीं पड़ी: आँख उसे नहीं देख पाती"],
  "yantra/roshni|dhak": ["Abhi bhi roshni: Chaand ki apni roshni nahi hoti", "Still light: the Moon gives out no light of its own", "अभी भी रोशनी: चाँद की अपनी रोशनी नहीं होती"],
};

describe("r8 laws, idea words (laws ruling 2026-11-15)", () => {
  it("every (family/mode, goal) the ruling names has idea words; whole words only", () => {
    assert.deepEqual(Object.keys(L.IDEA_WORDS).sort(), Object.keys(MISS).sort());
    for (const [key, goals] of Object.entries(L.IDEA_WORDS)) for (const [goal, words] of Object.entries(goals)) {
      assert.ok(words.length >= 3 && words.length <= 20, `${key} ${goal}: a small list (${words.length})`);
      assert.ok(MISS[key][goal], `${key} ${goal} has its miss lines listed`);
      const [family, mode] = key.split("/");
      assert.deepEqual(L.ideaWordsOf({ family, mode, goal }), words);
    }
    assert.equal(L.ideaIn("Prithvi ghoomti hai", ["ghoomti"]), "ghoomti");
    assert.equal(L.ideaIn("PRITHVI GHOOMTI", ["ghoomti"]), "ghoomti", "case is ignored");
    assert.equal(L.ideaIn("ghoomtiyan", ["ghoomti"]), null, "a whole word, not a part of one");
    assert.equal(L.ideaIn("she lets go", ["let"]), null);
    assert.equal(L.ideaIn("पृथ्वी घूमती है", ["घूमती"]), "घूमती");
    assert.equal(L.ideaIn("घूमतीं", ["घूमती"]), null, "a Devanagari mark ends no word");
    assert.equal(L.ideaIn("क्षार ने अम्ल ख़त्म किया", ["ख़त्म किया"]), "ख़त्म किया");
    assert.equal(L.ideaIn("अम्ल ख़त्म किया", ["ख़त्म किया"]), "ख़त्म किया", "the nukta letter in either Unicode form");
  });

  it("the check catches a miss line that states the idea (the lines before the ruling)", () => {
    for (const [kg, texts] of Object.entries(STATED)) {
      const [key, goal] = kg.split("|");
      for (const t of texts) assert.ok(L.ideaIn(t, L.IDEA_WORDS[key][goal]), `${kg}: "${t}" states the idea`);
    }
  });

  it("every miss line of these goals, in all three languages, says what her act did and holds no idea word", () => {
    let n = 0;
    for (const [key, m] of Object.entries(MISS)) for (const [goal, codes] of Object.entries(m)) {
      if (goal === "pre") continue;
      for (const code of codes) for (const l of LANGS) {
        const k = `${m.pre}.why.${code}`, v = WORDS[k]?.[l];
        assert.ok(v, `${k} ${l}`);
        const hit = L.ideaIn(fill(v), L.IDEA_WORDS[key][goal]);
        assert.equal(hit, null, `${key} ${goal}: ${k} ${l} "${v}" states the idea ("${hit}")`);
        n++;
      }
    }
    assert.ok(n >= 200, `miss lines checked ${n}`);
  });

  it("each goal's solved line states its idea in all three languages (it moved, it did not vanish)", () => {
    for (const [key, goals] of Object.entries(L.IDEA_WORDS)) for (const [goal, words] of Object.entries(goals)) for (const l of LANGS) {
      const k = doneKey(key, goal), v = WORDS[k]?.[l];
      assert.ok(v, `${k} ${l}`);
      assert.ok(L.ideaIn(v, words), `${key} ${goal}: the solved line ${k} ${l} "${v}" states the idea`);
    }
  });

  it("over every served level of these modes, in en and hi, no law breaks (hinglish: tests/r8-play-laws)", async () => {
    for (const lang of ["en", "hi"]) {
      const extra = [];
      let n = 0;
      for (const key of Object.keys(MISS)) {
        const rows = await L.lawsOverCoverage({ only: key, seeds: 2, perGoal: 1, lang });
        n += rows.length;
        for (const r of rows) for (const b of r.breaks) extra.push(`${lang} ${r.key} ${r.goal} ${r.levelId}: L${b.law} ${b.state} ${b.what}`);
      }
      assert.ok(n >= 20, `${lang}: levels checked ${n}`);
      assert.deepEqual(extra, []);
    }
  });
});
