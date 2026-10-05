// The explain ladder's LAST rung (W2-B fixer, major 2: "0 empty trays"): the topic's own key terms as a parts@1 board,
// built by code from the kit with no model, so no explain beat is ever left with an empty tray when the code pick, the
// library and the live fill all have nothing. The whole is the topic's short title; the parts are the kit's most used
// content words and two-word terms across its posed questions and worked example (a term the kit uses in two or more
// places, never a skill title or a syllabus outcome: G-OBJ-1, and never a sentence: each is one or two words).
//
// Pure and synchronous (the curriculum read is a memory map); memoised per kit hash.
import { readFileSync } from "node:fs";
import { getTopic } from "../../content/curriculum.js";
import { expand } from "./templates.js";

const SHORT_TITLES = JSON.parse(readFileSync(new URL("../../director/short-titles.json", import.meta.url), "utf8"));

const STOP = new Set(("a an the of to in on at by for from with and or but is are was were be been being it its this that these those as into onto " +
  "their his her our your my we you they he she them us not no than then so very more most less least each every one two three four five six " +
  "seven eight nine ten what which who whom whose why how when where does do did done can could would should will shall may might must " +
  "has have had having there here about also only just like such some any many much other another same both all own out up down over under " +
  "say says said tell told give gives given name names write wrote read show shows shown find found make makes made use used using get got " +
  "think guess check work answer question example look see why true false yes right wrong answer reason because first next last " +
  "little big lot lots thing things way ways time times day days today tomorrow yesterday story poem lesson chapter page class book " +
  "after before around again still even ever never always often explain predict mean means meaning eating something someone " +
  "ka ki ke hai hain aur ko se me mein par kya kaun kitne kitna " +
  "किसने मुझे क्या कौन कैसे क्यों है हैं का की के में से को और ने था थी थे यह वह कि पर भी तो नहीं एक हम तुम आप").split(" "));

const memo = new Map();

/** The kit's key terms: one- and two-word terms used in ≥ 2 places, most used first, none inside another. */
export function keyTerms(kit, max = 5) {
  const docs = [];
  for (const i of kit?.items ?? []) docs.push(String(i.prompt_en ?? ""));
  const we = kit?.workedExample;
  if (we) docs.push([we.problem, ...(we.steps ?? [])].join(" "));
  for (const m of kit?.misconceptions ?? []) if (m.remediation?.representation) docs.push(String(m.remediation.representation));
  const df = new Map();
  for (const d of docs) {
    const seen = new Set();
    // two-word terms never cross punctuation ("(blue = boys, orange = girls)" is not the term "boys orange")
    for (const phrase of d.toLowerCase().replace(/[’']s\b/g, "").split(/[^\p{L}\p{M}\s-]+/u)) {
    const words = phrase.match(/[\p{L}\p{M}]+/gu) ?? [];
    for (let k = 0; k < words.length; k++) {
      const w = words[k];
      const ok1 = w.length >= 4 && !STOP.has(w);
      if (ok1) seen.add(w);
      const v = words[k + 1];
      if (v && ok1 && v.length >= 3 && !STOP.has(v)) seen.add(`${w} ${v}`);
    }
    }
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  // a two-word term outranks its own words when it is used as often (right angle > angle when always "right angle")
  // a term the key ideas (expectations) also use scores higher: it is what the topic is about, not a story's prop
  const ideas = ` ${(kit?.expectations ?? []).join(" ").toLowerCase().replace(/[^\p{L}\p{M}]+/gu, " ")} `;
  const score = (t, n) => n + (ideas.includes(` ${t} `) ? 2 : 0);
  const ranked = [...df.entries()].filter(([, n]) => n >= 2).map(([t, n]) => [t, score(t, n)])
    .sort((a, b) => b[1] - a[1] || b[0].split(" ").length - a[0].split(" ").length || a[0].localeCompare(b[0]));
  const out = [];
  for (const [t] of ranked) {
    if (out.length >= max) break;
    if ([...t].length > 20) continue;
    if (out.some((o) => o.includes(t) || t.includes(o))) continue;
    out.push(t);
  }
  return out;
}

/** The topic's title as a board heading (≤ 24 characters), or null. */
function titleOf(kit) {
  const t = String(getTopic(kit?.topicId)?.title ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  if ([...t].length <= 24) return t;
  const s = SHORT_TITLES[t];
  return typeof s === "string" && [...s].length <= 24 ? s : null;
}

/**
 * The terms board call for a kit, or null (fewer than 2 key terms, no title).
 * @returns {{ template: "parts@1", whole: string, parts: string[] } | null}
 */
export function termsCall(kit, _band = "B3") {
  if (!kit?.topicId) return null;
  const key = `${kit.topicId}:${kit.hash ?? ""}:${_band}`;
  if (memo.has(key)) return memo.get(key);
  const terms = keyTerms(kit, 6);
  // the heading: the topic's title when it fits the board's centre, else the most used term (the rest are the parts)
  let call = null;
  for (const whole of [titleOf(kit), ...terms.slice(0, 2)].filter(Boolean)) {
    const parts = terms.filter((t) => t.toLowerCase() !== String(whole).toLowerCase()).slice(0, 4);
    if (parts.length < 2) continue;
    // fewer parts when four do not lay out (a long term)
    for (let n = parts.length; n >= 2 && !call; n--) {
      const c = { template: "parts@1", whole, parts: parts.slice(0, n) };
      if (expand(c, { band: _band }).ok) call = c;
    }
    if (call) break;
  }
  memo.set(key, call);
  if (memo.size > 1000) memo.delete(memo.keys().next().value);
  return call;
}
