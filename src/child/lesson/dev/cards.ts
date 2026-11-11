// The dev Desk's cards (DeskDev.tsx fixtures and the landing captures taken from them). A card is ONE teaching moment:
// the board, her line and the question come from the same card, so a capture can never show her words against another
// card's board (main 2026-11-11: the landing's hero showed a "1/2 x 1/2 = 1/4" board under "1/2 barabar 2/4").
// The drawn boards are the server's own explainer output (server/forge/explainer/templates.js expand(), held equal by
// tests/r8-dev-cards.test.mjs), plus the beat card the lesson adds on top (the "Picture" chip and its beat dots). A card's question is never answered by its board or its line.
export interface DevCard {
  id: string;
  /** her line while the board is up */
  line: string;
  /** the card's question (the ask the child answers) */
  ask: string;
  /** a drawn board (a Studio whiteboard script) or a plain board's lines */
  board: { script: unknown } | { lines: Array<{ text: string; kind: "math" | "text" }> };
}

/** fraction-of@1, 1/2 of 1/2 (expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2 })). The kit's own fact: a
 *  quarter is half of a half, and a quarter of 8 is 2 (data/kits/c3-maths.json, c3-maths-ch08-t02). */
const HALF_OF_HALF_SCRIPT = {
 "card": { "kind": "picture", "n": 2, "checkpointAhead": false },
 "v": 1,
 "scriptId": "dev-half-of-half",
 "line": {
  "lessonId": "dev"
 },
 "anchor": "line_audio_start",
 "board": {
  "w": 400,
  "h": 300,
  "ground": "chalk"
 },
 "mode": "fresh",
 "durationMs": 7460,
 "ops": [
  {
   "id": "whole",
   "op": "rect",
   "startMs": 180,
   "endMs": 980,
   "weight": 2,
   "at": [
    60,
    62
   ],
   "w": 280,
   "h": 160
  },
  {
   "id": "o1",
   "op": "line",
   "startMs": 1030,
   "endMs": 1250,
   "weight": 1,
   "from": [
    200,
    62
   ],
   "to": [
    200,
    222
   ]
  },
  {
   "id": "c0",
   "op": "rect",
   "startMs": 1350,
   "endMs": 1550,
   "ink": "accent",
   "weight": 1,
   "at": [
    63,
    65
   ],
   "w": 134,
   "h": 154,
   "fill": "soft"
  },
  {
   "id": "o2",
   "op": "sweep",
   "startMs": 1550,
   "endMs": 2030,
   "target": "c0",
   "dir": "down"
  },
  {
   "id": "inner",
   "op": "text",
   "startMs": 2190,
   "endMs": 2570,
   "ink": "accent",
   "at": [
    130,
    33
   ],
   "text": "1/2",
   "size": "m"
  },
  {
   "id": "o3",
   "op": "line",
   "startMs": 3020,
   "endMs": 3240,
   "ink": "soft",
   "weight": 1,
   "from": [
    60,
    142
   ],
   "to": [
    340,
    142
   ]
  },
  {
   "id": "r0",
   "op": "rect",
   "startMs": 3380,
   "endMs": 3600,
   "ink": "mark",
   "weight": 1,
   "role": "focus",
   "at": [
    65,
    67
   ],
   "w": 130,
   "h": 70,
   "fill": "accent"
  },
  {
   "id": "o4",
   "op": "sweep",
   "startMs": 3600,
   "endMs": 4120,
   "target": "r0",
   "dir": "right"
  },
  {
   "id": "outer",
   "op": "text",
   "startMs": 4280,
   "endMs": 4660,
   "ink": "mark",
   "at": [
    352,
    102
   ],
   "text": "1/2",
   "size": "m",
   "align": "start"
  },
  {
   "id": "eq",
   "op": "numwork",
   "startMs": 5260,
   "endMs": 6360,
   "weight": 2,
   "at": [
    40,
    262
   ],
   "layout": "equation",
   "rows": [
    [
     "1/2",
     "\u00d7",
     "1/2",
     "=",
     "1/4"
    ]
   ]
  },
  {
   "id": "o5",
   "op": "highlight",
   "startMs": 6560,
   "endMs": 7060,
   "ink": "mark",
   "target": "eq",
   "style": "underline"
  }
 ],
 "facts": {
  "kind": "animation",
  "archetype": "fraction-of@1",
  "onScreen": {
   "whole": "rectangle",
   "inner": "1/2",
   "outer": "1/2 of it",
   "small_parts": 4,
   "marked": 1,
   "result": "1/4"
  },
  "counts": {
   "parts": 4,
   "rows": 2,
   "cols": 2
  }
 }
} as const;

/** fraction-parts@1, a roti in 2 equal parts, 1 shaded (expand({ template: "fraction-parts@1", parts: 2, shade: 1, whole: "roti" })). */
const HALVES_SCRIPT = {
 "card": { "kind": "picture", "n": 1, "checkpointAhead": false },
 "v": 1,
 "scriptId": "dev-halves",
 "line": {
  "lessonId": "dev"
 },
 "anchor": "line_audio_start",
 "board": {
  "w": 400,
  "h": 300,
  "ground": "chalk"
 },
 "mode": "fresh",
 "durationMs": 6168,
 "ops": [
  {
   "id": "o1",
   "op": "circle",
   "startMs": 252,
   "endMs": 1512,
   "weight": 2,
   "c": [
    130,
    150
   ],
   "r": 95,
   "fill": "soft"
  },
  {
   "id": "o2",
   "op": "line",
   "startMs": 1582,
   "endMs": 1890,
   "weight": 1,
   "from": [
    130,
    150
   ],
   "to": [
    130,
    55
   ]
  },
  {
   "id": "o3",
   "op": "line",
   "startMs": 1960,
   "endMs": 2268,
   "weight": 1,
   "from": [
    130,
    150
   ],
   "to": [
    130,
    245
   ]
  },
  {
   "id": "s0",
   "op": "sector",
   "startMs": 2436,
   "endMs": 2968,
   "ink": "accent",
   "weight": 1,
   "role": "focus",
   "c": [
    130,
    150
   ],
   "r": 93,
   "fill": "accent",
   "fromDeg": 0,
   "toDeg": 180
  },
  {
   "id": "frac",
   "op": "numwork",
   "startMs": 3388,
   "endMs": 4508,
   "ink": "accent",
   "weight": 2,
   "role": "focus",
   "at": [
    296,
    120
   ],
   "layout": "fraction",
   "rows": [
    [
     "1"
    ],
    [
     "2"
    ]
   ]
  },
  {
   "id": "o4",
   "op": "highlight",
   "startMs": 4928,
   "endMs": 5768,
   "ink": "mark",
   "target": "frac",
   "style": "circle"
  }
 ],
 "facts": {
  "kind": "animation",
  "archetype": "fraction-parts@1",
  "onScreen": {
   "whole": "roti",
   "parts": 2,
   "shaded": 1,
   "fraction": "1/2"
  },
  "counts": {
   "parts": 2,
   "shaded": 1
  }
 }
} as const;

export const DEV_CARDS = {
  /** Older: a quarter is half of a half; the question asks for a quarter of 8, which the board does not show. */
  halfOfHalf: {
    id: "halfOfHalf",
    line: "Aadhe ka aadha dekho: ek half ko phir do barabar hisson mein baanta, toh ek hissa poore ka 1/4 hai.",
    ask: "Then what is a quarter of 8 laddoos?",
    board: { script: HALF_OF_HALF_SCRIPT },
  },
  /** Young: a roti in two equal parts; the question asks for half of 6, which the board does not show. */
  halves: {
    id: "halves",
    line: "Roti ke do barabar tukde dekho. Ek tukda aadha hai.",
    ask: "Half of 6 laddoos is how many?",
    board: { script: HALVES_SCRIPT },
  },
  /** Young, the plain board: two equal parts named in words; the tiles ask which number is a half. */
  twoParts: {
    id: "twoParts",
    line: "Do barabar tukde gino. Kaunsa aadha hai?",
    ask: "Which one is half?",
    board: { lines: [{ text: "1 roti, 2 barabar tukde", kind: "text" }] },
  },
  /** Older, the plain board: the board leaves the count open; her line points at it without giving it. */
  quarters: {
    id: "quarters",
    line: "Board dekho: ek half ke barabar kitne quarters? Shaded hisse gino.",
    ask: "How many quarters make one half?",
    board: { lines: [{ text: "1/2 = ?/4", kind: "math" }] },
  },
} satisfies Record<string, DevCard>;

/** The card a fixture shows: the drawn-board fixtures take the drawn card, every other fixture the plain board's
 *  (young: the halves card). Line, question and board are always read from this one card. */
export function cardOfFixture(name: string, young: boolean): DevCard {
  const drawn = name === "work-beat" || name === "hf-beat";
  if (young) return drawn ? DEV_CARDS.halves : DEV_CARDS.twoParts;
  return drawn ? DEV_CARDS.halfOfHalf : DEV_CARDS.quarters;
}
