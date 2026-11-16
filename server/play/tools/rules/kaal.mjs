// Play coverage rules for the kaal family (round 7: Kaal-nadi, the river of time; the first SST law family).
// Authored: bringing a boat to a year on a river where BCE lies left, CE right and 1 BCE flows straight into 1 CE IS placing
// a date on a timeline; dropping a stone into its century band IS naming a year's century; placing 3-4 events one after
// another IS building the sequence. The stones are the kits' own dated events (data/play/kaal/events.json, every year
// checked against the kit text it cites by server/play/tools/build-kaal.mjs); the play server attaches the topic's events
// to the request (server/play/levels.js grammarOf). Mal-rules map only where the kit's misconception is the same belief:
// "BCE years count up like CE" (c6 m1 "places 500 BCE to the right of 100 BCE", c7-ch04 m1 "places 600 BCE to the right
// of 500 BCE", c7-ch05 m2 "Chandragupta (c. 321 BCE) ruled after Ashoka (c. 268 BCE)") and "a century is its first
// digits" (c6 m2 "1857 is in the 18th century", c7-ch15 m3 "Harsha (606-647 CE) ruled in the 6th century"). year-zero is
// implemented but no kit names it, so it maps nowhere. Left out: c7-sst-ch06-t01 (fewer than 4 dated events), the order
// goal for c7-ch07 (400 CE / 320 CE sit on a labelled tick at fade 1 on every river that fits them) and c7-ch13 (on a
// 9,000-year river the 1960s and 2023 always sit at its right end).
import { R } from "./rule.mjs";

export const family = "kaal";
const K = "kaal";
export const RULES = [
  R("c6-sst-ch04-t01", K, "place", "place", { "bce-counts-up": "m1" }, { free: true }),
  R("c6-sst-ch04-t01", K, "place", "century", { "century-first-digits": "m2" }, { free: true }),
  R("c6-sst-ch04-t01", K, "order", "order", { "bce-counts-up": "m1" }, {}),
  R("c7-sst-ch04-t01", K, "place", "place", { "bce-counts-up": "m1" }, {}),
  R("c7-sst-ch04-t01", K, "order", "order", { "bce-counts-up": "m1" }, {}),
  R("c7-sst-ch05-t01", K, "place", "place", { "bce-counts-up": "m2" }, {}),
  R("c7-sst-ch05-t01", K, "order", "order", { "bce-counts-up": "m2" }, {}),
  R("c7-sst-ch07-t01", K, "place", "place", {}, {}),
  R("c7-sst-ch15-t01", K, "place", "century", { "century-first-digits": "m3" }, {}),
  R("c7-sst-ch15-t01", K, "place", "place", {}, {}),
  R("c7-sst-ch13-t01", K, "place", "place", {}, {}),
];

export const ACTS = {
  "c6-sst-ch04-t01|place": ["s1"],       // order dates on a timeline with BCE and CE (BCE counts down towards 1 BCE)
  "c6-sst-ch04-t01|century": ["s2"],     // name the century of a given year
  "c6-sst-ch04-t01|order": ["s1"],
  "c7-sst-ch04-t01|place": ["s1"],       // place the period on a BCE/CE timeline and order BCE dates
  "c7-sst-ch04-t01|order": ["s1"],
  "c7-sst-ch05-t01|place": ["s2"],       // sequence the Mauryan events on a BCE timeline
  "c7-sst-ch05-t01|order": ["s2"],
  "c7-sst-ch07-t01|place": ["s1"],       // place the Gupta rulers on a CE timeline
  "c7-sst-ch15-t01|century": ["s1"],     // name centuries correctly (606 CE is in the 7th century)
  "c7-sst-ch15-t01|place": ["s1"],       // place the kingdoms of the 6th-10th centuries on a timeline
  "c7-sst-ch13-t01|place": ["s1"],       // trace the history of farming on a timeline
};
