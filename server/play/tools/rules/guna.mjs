// Play coverage rules for the guna family (round 7: multi-digit multiplication and division, classes 4-5; never timed).
// Authored: cutting a field a × b into place-value strips (34 = 30 + 4) IS splitting a factor into tens and ones; each piece's
// tiles (30 × 6 is 3 × 6 ten-tiles) ARE the partial products, and loading a truck that must weigh exactly a × b (nine
// crates to a rack, ten packed as one of the next place) IS adding the partial products with their regrouping; a field
// of round sides (60 × 50) or a factor of 10 / 100 IS multiplying by multiples of 10 and powers of 10; stretching a field's
// sides to their nearest round lengths and loading about that much IS estimating a product by rounding; sharing a godown's
// crates one round into every truck, opening a crate into ten of the next place when it cannot go round, IS dividing
// place by place with regrouping (the dock that is left IS the remainder, and it must be less than a share); setting out
// vehicles / packets / a jar that the story then runs IS deciding what a remainder means (round up, round down, the
// leftover itself). Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: × 10 as + 10
// is "times-ten-adds-ten"; the tens digit brought down is "ones-only"; the digit products side by side is "no-carry" (c4)
// and the carried tens not added is "forget-carry" (c5); the tens digit's product without its zero is "shift-error"; only
// tens × tens and ones × ones is "place-by-place"; a zero lost when the basic fact ends in 0 is "zero-count"; each place
// shared on its own without opening a crate is "digitwise"; a round less than can be made (the leftover a share or more) is
// "remainder-too-big"; the leftover dropped where everyone must go is "remainder-ignored-in-story" (c4) / "always-drop"
// (c5); always one more is "always-up"; the packets' count put for the leftover is "quotient-always".
// Not admitted (no honest mechanic here): c4-maths-ch13-t02-s2 (repeated subtraction of big chunks: the godown shares by
// rounds, not chunks), c5-maths-ch06-t01-s3 (the written column method), c5-maths-ch06-t02-s2 (doubling and halving). Kit
// beliefs with no honest set-up here: drop-zero-quotient / zero-in-quotient (the trucks hold the crates, so a place is never
// dropped), remainder-as-decimal, ignore-remainder (the leftover stays on the dock), mult-makes-bigger, double-both.
// r7 guna2 (three more arena-only topics): c7-maths-ch01-t03 patterns in products: a field of round sides 3000 × 400 fills with
// 3 × 4 tiles of 1000 × 100 and the truck (up to crates of 10^6) must weigh it exactly; the zeros of both sides ARE the
// tile's size, so the rack chosen IS the zero count and the racks used ARE the product's digits (s1, s3); the big round goal
// (4872 × 312 pulled to 5000 × 300) IS estimating a large product by rounding (s2). The fact's own zero lost is
// "hidden-zero"; one attached zero too few (where the fact does not end in 0) or too many is "zero-miscount".
// c5-maths-ch04-t02 checking reasonableness: the child builds the estimate (round sides, the truck loaded) and then marks
// three dockets a × b someone wrote (the true product, ten times it, a tenth of it) could-be-right / send-back: every docket
// kept is "steps-mean-right", every docket sent back because none equals the estimate is "estimate-must-equal" (s1). Not
// admitted: s2 (inverse operations for + and −: no multiply / divide mechanic) and s3 (sense in a story), and the kit belief
// inverse-wrong. c4-maths-ch09-t02 division as grouping and sharing, at small numbers: equal SHARING is the pack/each goal
// (loose things dealt one to every friend per round, until a round cannot go: s1, s3), equal GROUPING is the story/full goal
// (packets of b set out: how many b's in a: s2, s3), and a leftover that still needs a vehicle is story/all (s3). Stopping a
// round early (the leftover a share or more) is "remainder-too-big"; the leftover dropped where everyone must go is
// "no-remainder" (ignores the leftover). Not admitted: order-doesnt-matter (sharing fewer things than friends gives no whole
// share here, and the dock / packets never swap roles).
// r7 place2 (two arena-only place-value topics, a new mode "yard"): c4-maths-ch04-t01 numbers up to 9999: a docket names a
// 4-digit number ("4 thousand 50", the expanded form "4000 + 50", or the numeral "4050") and the truck of six racks (crates of
// 1 … 10^5, nine at most to a rack) must weigh exactly that: filling each place's rack IS writing the number place by place
// (s1), the crates per rack ARE its thousands, hundreds, tens and ones (s2), and an empty rack IS the zero that holds a place
// (s3, also the expanded form). The parts written in full one after another (4 thousand 50 loaded as 4,00,050) is "concat";
// the parts' counts side by side, the empty places dropped (450) is "drop-zero". c7-maths-ch01-t01 lakhs and crores: the
// docket names the number in lakhs and crores ("3 crore 5 lakh 9") or in millions ("7 million 250 thousand") and the truck
// of eight racks (up to crates of a crore) must weigh it (s1, s2): the counts side by side without the empty places (3 crore
// 5 lakh → 35,00,000) is "zero-placeholder"; a crore taken as a million, or a million read as a crore, is "crore-million".
// The commas goal (s1): the number stands on the truck and the child sets comma posts between the racks so it reads in
// lakhs and crores; a post after every three places is "intl-commas". Not admitted: c7-maths-ch01-t01-s3 (comparing and
// ordering: no kit belief this truck shows honestly) stays with the net; c4 kit belief teen-ty (the dockets name the
// parts with digits, so a -teen / -ty word never appears) and face-value (a crate on a rack is always worth its place) have no
// set-up here.
import { R } from "./rule.mjs";

export const family = "guna";
const G = "guna";
export const RULES = [
  R("c4-maths-ch13-t01", G, "field", "area", { "ones-only": "ones-only", "no-carry": "no-carry", "adds-ten": "times-ten-adds-ten" }, { shapes: ["2x1", "2x10", "2xT", "3x1"] }),
  R("c4-maths-ch13-t02", G, "pack", "share", { digitwise: "digitwise" }, { sizes: [2, 3] }),
  R("c4-maths-ch13-t02", G, "story", "all", { drop: "remainder-ignored-in-story" }, { cap: [3, 9], q: [3, 30] }),
  R("c5-maths-ch06-t01", G, "field", "area", { "no-zero": "shift-error", diagonal: "place-by-place", "forget-carry": "forget-carry" }, { shapes: ["2xT", "2x2"] }),
  R("c5-maths-ch06-t02", G, "field", "area", { "zero-count": "zero-count" }, { shapes: ["RxR", "2xH", "2x10"] }),
  R("c5-maths-ch06-t02", G, "field", "round", { "zero-count": "zero-count" }, {}),
  R("c5-maths-ch09-t01", G, "pack", "share", { short: "remainder-too-big" }, { sizes: [3] }),
  R("c5-maths-ch09-t01", G, "story", "full", { short: "remainder-too-big" }, { cap: [12, 50], q: [3, 40] }),
  R("c5-maths-ch09-t02", G, "story", "all", { drop: "always-drop" }, { cap: [3, 12], q: [2, 20] }),
  R("c5-maths-ch09-t02", G, "story", "full", { up: "always-up" }, { cap: [3, 12], q: [2, 20] }),
  R("c5-maths-ch09-t02", G, "story", "left", { quotient: "quotient-always" }, { cap: [3, 12], q: [2, 20] }),
  // r7 guna2
  R("c7-maths-ch01-t03", G, "field", "area", { "zero-count": "hidden-zero", "zero-less": "zero-miscount", "zero-more": "zero-miscount" }, { shapes: ["BIG"] }),
  R("c7-maths-ch01-t03", G, "field", "round", { "zero-count": "hidden-zero", "zero-less": "zero-miscount", "zero-more": "zero-miscount" }, { big: true }),
  R("c5-maths-ch04-t02", G, "field", "check", { trusts: "steps-mean-right", "must-equal": "estimate-must-equal" }, {}),
  R("c4-maths-ch09-t02", G, "pack", "each", { short: "remainder-too-big" }, { cap: [2, 6], q: [2, 9] }),
  R("c4-maths-ch09-t02", G, "story", "full", { short: "remainder-too-big" }, { cap: [3, 9], q: [2, 9] }),
  R("c4-maths-ch09-t02", G, "story", "all", { drop: "no-remainder" }, { cap: [3, 9], q: [2, 9] }),
  // r7 place2
  R("c4-maths-ch04-t01", G, "yard", "build", { concat: "concat", "drop-zero": "drop-zero" }, { forms: ["named", "expanded", "numeral"] }),
  R("c7-maths-ch01-t01", G, "yard", "build", { "drop-zero": "zero-placeholder", "crore-million": "crore-million" }, { big: true, forms: ["named", "intl"] }),
  R("c7-maths-ch01-t01", G, "yard", "commas", { "intl-commas": "intl-commas" }, {}),
];

export const ACTS = {
  "c4-maths-ch13-t01|area": ["s1", "s2", "s3"],    // × 10 and tens; 2-digit × 1-digit split into tens and ones; 3-digit × 1-digit
  "c4-maths-ch13-t02|share": ["s1", "s3"],         // share the tens then the ones (regrouping); 3-digit ÷ 1-digit with leftovers
  "c4-maths-ch13-t02|all": ["s3"],                 // a leftover in a story that needs one more
  "c5-maths-ch06-t01|area": ["s1", "s2"],          // × multiples of 10; 2-digit × 2-digit by the area model
  "c5-maths-ch06-t02|area": ["s1"],                // × 10, 100 and round × round by place value
  "c5-maths-ch06-t02|round": ["s3"],               // estimate a product by rounding
  "c5-maths-ch09-t01|share": ["s1", "s3"],         // 3-digit ÷ 1-digit place by place; the remainder less than the divisor
  "c5-maths-ch09-t01|full": ["s2"],                // ÷ 2-digit numbers like 25 or 30 (full sacks and the rest)
  "c5-maths-ch09-t02|all": ["s1"],                 // round up when everyone must be included
  "c5-maths-ch09-t02|full": ["s2"],                // round down when only full groups count
  "c5-maths-ch09-t02|left": ["s3"],                // the remainder itself when the leftover is asked
  "c7-maths-ch01-t03|area": ["s1", "s3"],          // round × round by the zeros of both sides; the racks used are the product's digits
  "c7-maths-ch01-t03|round": ["s2"],               // estimate a large product by rounding first
  "c5-maths-ch04-t02|check": ["s1"],               // check an answer by estimating first
  "c4-maths-ch09-t02|each": ["s1", "s3"],          // share equally (how many each), the leftover less than a round
  "c4-maths-ch09-t02|full": ["s2", "s3"],          // equal groups (how many packets of b), the leftover less than a packet
  "c4-maths-ch09-t02|all": ["s3"],                 // a leftover that still needs one more
  "c4-maths-ch04-t01|build": ["s1", "s2", "s3"],   // write a named number place by place; its thousands … ones; zeros and the expanded form
  "c7-maths-ch01-t01|build": ["s1", "s2"],         // write a number named in lakhs and crores; or named in millions
  "c7-maths-ch01-t01|commas": ["s1"],              // Indian commas: three places, then every two
};
