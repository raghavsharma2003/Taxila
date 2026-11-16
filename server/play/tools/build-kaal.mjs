#!/usr/bin/env node
// Builds data/play/kaal/events.json: the dated events the kaal family (Kaal-nadi, the river of time) places on its river.
// A model never writes a year. Each event below is authored WITH the kit text that states it (`source`), and this script
// CHECKS each one: the year, written as the kit writes it ("321 BCE", "1950", "1960s"), must appear literally in every
// cited text. A topic whose kit states fewer than MIN_EVENTS dates is left out (listed in `left_out`).
//
//   node server/play/tools/build-kaal.mjs           check, then write the file
//   node server/play/tools/build-kaal.mjs --check   exit 1 if any year is not in its source or the file on disk is stale
//
// Source references: an item id ("c7-sst-ch05-t01-i03": its prompt, answer, acceptable answers and verified answer), a
// topic field ("c7-sst-ch05-t01#expectations[1]", "c7-sst-ch15-t01#workedExample"), or a misconception's belief
// ("c7-sst-ch05-t01-m2#belief"). Years are negative for BCE; there is no year 0. `decade: true` marks "the 1960s" (the
// year is the decade's middle, the text checked is "1960s"). `label: null` is a bare year from the kit (class 6 stones show
// the year only, so the c6 topic's bare years need no event name).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "data/play/kaal/events.json");
export const MIN_EVENTS = 4;

const L = (hinglish, en, hi) => ({ hinglish, en, hi });
const E = (id, topicId, year, circa, label, source, extra = {}) => ({ id, topicId, year, circa, ...extra, label, source });

/** The authored events, each with the kit text that states its year. */
export const EVENTS = [
  // ── c6-sst-ch04-t01 · Timeline and Sources of History (the number line of years itself; class 6 stones show the year only)
  E("c6-harappa-peak", "c6-sst-ch04-t01", -2600, true, L("Harappa ke shehar shikhar par", "Harappan cities at their peak", "हड़प्पा के शहर शिखर पर"), ["c6-sst-ch04-t01-i05"]),
  E("c6-independence", "c6-sst-ch04-t01", 1947, false, L("Bharat azaad hua", "India becomes independent", "भारत आज़ाद हुआ"), ["c6-sst-ch04-t01-i04", "c6-sst-ch04-t01-i01"]),
  E("c6-y-3000bce", "c6-sst-ch04-t01", -3000, false, null, ["c6-sst-ch04-t01-i01"]),
  E("c6-y-500bce", "c6-sst-ch04-t01", -500, false, null, ["c6-sst-ch04-t01-i01", "c6-sst-ch04-t01-i02", "c6-sst-ch04-t01#expectations[0]"]),
  E("c6-y-200bce", "c6-sst-ch04-t01", -200, false, null, ["c6-sst-ch04-t01-i02"]),
  E("c6-y-100ce", "c6-sst-ch04-t01", 100, false, null, ["c6-sst-ch04-t01-i01"]),
  E("c6-y-1857", "c6-sst-ch04-t01", 1857, false, null, ["c6-sst-ch04-t01#expectations[2]", "c6-sst-ch04-t01-m2#belief"]),
  // ── c7-sst-ch04-t01 · New Beginnings: Cities and States
  E("c7-harappa-height", "c7-sst-ch04-t01", -2600, true, L("Harappa ke shehar shikhar par", "Harappan cities at their height", "हड़प्पा के शहर शिखर पर"), ["c7-sst-ch04-t01-i02"]),
  E("c7-harappa-decline", "c7-sst-ch04-t01", -1900, true, L("Harappa ke shehar ghatne lage", "Harappan cities decline", "हड़प्पा के शहरों का पतन"), ["c7-sst-ch04-t01#expectations[0]"]),
  E("c7-mahajanapadas", "c7-sst-ch04-t01", -600, true, L("Mahajanapad ubhre", "Mahajanapadas emerge", "महाजनपद उभरे"), ["c7-sst-ch04-t01#expectations[0]", "c7-sst-ch04-t01-i01", "c7-sst-ch04-t01-i02"]),
  E("c7-chandragupta-maurya", "c7-sst-ch04-t01", -321, true, L("Chandragupta Maurya ka samrajya", "Chandragupta Maurya founds an empire", "चंद्रगुप्त मौर्य का साम्राज्य"), ["c7-sst-ch04-t01-i02"]),
  E("c7-constitution", "c7-sst-ch04-t01", 1950, false, L("Samvidhan laagu hua", "The Constitution comes into force", "संविधान लागू हुआ"), ["c7-sst-ch04-t01-i02", "c7-sst-ch04-t01#workedExample"]),
  // ── c7-sst-ch05-t01 · The Rise of Empires
  E("c7-alexander", "c7-sst-ch05-t01", -326, false, L("Sikandar uttar-pashchim pahuncha", "Alexander reaches the north-west", "सिकंदर उत्तर-पश्चिम पहुँचा"), ["c7-sst-ch05-t01-i03"]),
  E("c7-maurya-founded", "c7-sst-ch05-t01", -321, true, L("Chandragupta Maurya ka samrajya", "Chandragupta Maurya founds the empire", "चंद्रगुप्त मौर्य का साम्राज्य"), ["c7-sst-ch05-t01#expectations[1]", "c7-sst-ch05-t01-i03", "c7-sst-ch05-t01-rl-h1"]),
  E("c7-bindusara", "c7-sst-ch05-t01", -297, true, L("Bindusara raja bane", "Bindusara becomes king", "बिंदुसार राजा बने"), ["c7-sst-ch05-t01-i03"]),
  E("c7-ashoka", "c7-sst-ch05-t01", -268, true, L("Ashoka raja bane", "Ashoka becomes king", "अशोक राजा बने"), ["c7-sst-ch05-t01-m2#belief"]),
  E("c7-kalinga", "c7-sst-ch05-t01", -261, true, L("Kalinga ka yuddh", "The Kalinga war", "कलिंग युद्ध"), ["c7-sst-ch05-t01#expectations[3]", "c7-sst-ch05-t01-i03", "c7-sst-ch05-t01-rl-h1"]),
  // ── c7-sst-ch07-t01 · The Gupta Era
  E("c7-chandragupta-i", "c7-sst-ch07-t01", 320, true, L("Chandragupta I, Gupta vansh ka uday", "Chandragupta I: the Guptas rise", "चंद्रगुप्त प्रथम: गुप्त वंश का उदय"), ["c7-sst-ch07-t01#expectations[0]", "c7-sst-ch07-t01-i01", "c7-sst-ch07-t01-i12"]),
  E("c7-samudragupta", "c7-sst-ch07-t01", 335, true, L("Samudragupta ka raaj", "Samudragupta rules", "समुद्रगुप्त का राज"), ["c7-sst-ch07-t01-i12"]),
  E("c7-faxian", "c7-sst-ch07-t01", 400, true, L("Faxian Bharat aaye", "Faxian visits India", "फ़ाहियान भारत आए"), ["c7-sst-ch07-t01-i12"]),
  E("c7-aryabhatiya", "c7-sst-ch07-t01", 499, false, L("Aryabhatiya likhi gayi", "The Aryabhatiya is written", "आर्यभटीय लिखी गई"), ["c7-sst-ch07-t01#expectations[1]", "c7-sst-ch07-t01-i04", "c7-sst-ch07-t01-i12"]),
  E("c7-satellite-aryabhata", "c7-sst-ch07-t01", 1975, false, L("Aryabhata upgrah chhoda gaya", "Satellite Aryabhata launched", "उपग्रह आर्यभट छोड़ा गया"), ["c7-sst-ch07-t01-i13"]),
  // ── c7-sst-ch15-t01 · Empires and Kingdoms: 6th to 10th Centuries
  E("c7-harsha-begins", "c7-sst-ch15-t01", 606, false, L("Harsha ka raaj shuru", "Harsha begins to rule", "हर्ष का शासन शुरू"), ["c7-sst-ch15-t01#expectations[0]", "c7-sst-ch15-t01-i01", "c7-sst-ch15-t01-i02"]),
  E("c7-aihole", "c7-sst-ch15-t01", 634, false, L("Aihole shilalekh", "The Aihole inscription", "ऐहोल शिलालेख"), ["c7-sst-ch15-t01-i04", "c7-sst-ch15-t01-rl-o1", "c7-sst-ch15-t01#workedExample"]),
  E("c7-vatapi", "c7-sst-ch15-t01", 642, true, L("Pallavon ne Vatapi jeeta", "The Pallavas capture Vatapi", "पल्लवों ने वातापी जीता"), ["c7-sst-ch15-t01-i06"]),
  E("c7-harsha-ends", "c7-sst-ch15-t01", 647, false, L("Harsha ka raaj khatam", "Harsha's rule ends", "हर्ष का शासन समाप्त"), ["c7-sst-ch15-t01#expectations[0]", "c7-sst-ch15-t01-i01"]),
  E("c7-thanjavur", "c7-sst-ch15-t01", 1010, true, L("Thanjavur mandir poora hua", "Thanjavur temple completed", "तंजावुर मंदिर पूरा हुआ"), ["c7-sst-ch15-t01-i02"]),
  // ── c7-sst-ch13-t01 · The Story of Indian Farming
  E("c7-mehrgarh", "c7-sst-ch13-t01", -7000, true, L("Mehrgarh mein kheti", "Farming at Mehrgarh", "मेहरगढ़ में खेती"), ["c7-sst-ch13-t01#expectations[0]", "c7-sst-ch13-t01-i01", "c7-sst-ch13-t01-i02"]),
  E("c7-harappan-cotton", "c7-sst-ch13-t01", -2600, true, L("Harappa ke kisan kapas ugate", "Harappan farmers grow cotton", "हड़प्पा के किसान कपास उगाते"), ["c7-sst-ch13-t01-i02"]),
  E("c7-green-revolution", "c7-sst-ch13-t01", 1965, false, L("Hari Kranti", "The Green Revolution", "हरित क्रांति"), ["c7-sst-ch13-t01#expectations[3]", "c7-sst-ch13-t01-i02", "c7-sst-ch13-t01-i08"], { decade: true }),
  E("c7-millets-year", "c7-sst-ch13-t01", 2023, false, L("Antarrashtriya Millet Varsh", "International Year of Millets", "अंतरराष्ट्रीय मिलेट वर्ष"), ["c7-sst-ch13-t01-i11"]),
];

/** Topics the brief named that were checked and left out, with the kit's own dated statements (fewer than MIN_EVENTS). */
export const LEFT_OUT = [
  { topicId: "c7-sst-ch06-t01", dated: ["185 BCE (#expectations[0], i01: the Mauryan empire ends)", "150 BCE, 100 CE (rl-o1: two museum coin labels, not events)"], why: "fewer than 4 dated events" },
];

const kitCache = new Map();
function kitOf(topicId) {
  const file = `${topicId.split("-ch")[0]}.json`;
  if (!kitCache.has(file)) kitCache.set(file, JSON.parse(readFileSync(join(ROOT, "data/kits", file), "utf8")));
  const t = kitCache.get(file).topics.find((x) => x.topicId === topicId);
  if (!t) throw new Error(`no kit topic ${topicId}`);
  return t;
}
/** The kit text a source reference names (null when the reference does not resolve). */
export function sourceText(ref) {
  const topicId = /^(c\d-[a-z]+-ch\d+-t\d+)/.exec(ref)?.[1];
  if (!topicId) return null;
  const t = kitOf(topicId);
  let m;
  if ((m = /#expectations\[(\d+)\]$/.exec(ref))) return t.expectations?.[Number(m[1])] ?? null;
  if (/#workedExample$/.test(ref)) return t.workedExample ? [t.workedExample.problem, ...(t.workedExample.steps ?? [])].join(" ") : null;
  if ((m = /^(.*-m\d+)#belief$/.exec(ref))) return t.misconceptions.find((x) => x.id === m[1])?.belief ?? null;
  const it = t.items.find((x) => x.id === ref);
  return it ? [it.prompt_en, it.answer, ...(it.acceptable ?? []), it.verified?.solverAnswer ?? ""].join(" ") : null;
}
/** How the kit writes the year: "321 BCE", "1950", "1960s". */
export const yearPattern = (e) => e.decade ? new RegExp(`(^|[^0-9])${e.year - 5}s`) : e.year < 0 ? new RegExp(`(^|[^0-9,])${-e.year}\\s*BCE`) : new RegExp(`(^|[^0-9,.])${e.year}(?![0-9]|\\s*BCE)`);

export function check(events = EVENTS) {
  const problems = [], ids = new Set();
  for (const e of events) {
    if (ids.has(e.id)) problems.push(`${e.id}: duplicate id`);
    ids.add(e.id);
    if (!Number.isInteger(e.year) || e.year === 0) problems.push(`${e.id}: year ${e.year} is not a year (there is no year 0)`);
    if (e.decade && (e.year < 0 || e.year % 10 !== 5)) problems.push(`${e.id}: a decade is a CE decade's middle year`);
    if (e.label && !(["hinglish", "en", "hi"].every((k) => typeof e.label[k] === "string" && e.label[k].length > 0 && e.label[k].length <= 48))) problems.push(`${e.id}: label needs hinglish / en / hi (≤ 48 chars)`);
    if (!e.label && !e.topicId.startsWith("c6-")) problems.push(`${e.id}: only class 6 stones may be a bare year`);
    if (!e.source?.length) problems.push(`${e.id}: no source`);
    for (const ref of e.source ?? []) {
      if (!ref.startsWith(e.topicId)) { problems.push(`${e.id}: source ${ref} is not in its own topic's kit`); continue; }
      const text = sourceText(ref);
      if (text === null) { problems.push(`${e.id}: source ${ref} does not resolve`); continue; }
      if (!yearPattern(e).test(text)) problems.push(`${e.id}: year ${e.year} is not in ${ref}`);
    }
  }
  const per = {};
  for (const e of events) per[e.topicId] = (per[e.topicId] ?? 0) + 1;
  for (const [tid, n] of Object.entries(per)) if (n < MIN_EVENTS) problems.push(`${tid}: only ${n} dated events (a topic needs ${MIN_EVENTS})`);
  return { problems, per };
}

export function build() {
  const { problems, per } = check();
  const file = {
    v: 1,
    note: "built by server/play/tools/build-kaal.mjs; every year is checked against the kit text it cites (source); years are negative for BCE and there is no year 0; do not edit by hand",
    counts: per,
    left_out: LEFT_OUT,
    events: EVENTS.map((e) => ({ id: e.id, topicId: e.topicId, year: e.year, circa: e.circa, ...(e.decade ? { decade: true } : {}), label: e.label, source: e.source })),
  };
  return { problems, file };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, file } = build();
  const text = JSON.stringify(file, null, 1) + "\n";
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  if (process.argv.includes("--check")) {
    let disk = ""; try { disk = readFileSync(OUT, "utf8"); } catch { /* missing */ }
    if (disk !== text) { console.error("data/play/kaal/events.json is stale: run node server/play/tools/build-kaal.mjs"); process.exit(1); }
    console.log("kaal events ok", JSON.stringify(file.counts));
  } else { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, text); console.log("wrote", OUT, JSON.stringify(file.counts)); }
}
