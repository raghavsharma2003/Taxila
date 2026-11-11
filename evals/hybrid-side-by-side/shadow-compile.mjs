// C1 compile step 2, shadow mode (main's order item 8; docs/design/round7/brain/COMPILE.md "Proof"): every turn's response is compared
// with the compiled cell `cells[part][column][help]` for the part, the request and the help state that turn read. Nothing in the walk
// reads the compile yet: this only measures where the two agree, by column, so the switch can go one column at a time (step 3) and
// delete the old code in the same commit. Pure over a lesson's rows and its script (a live run's rows too).
//
//   node evals/hybrid-side-by-side/shadow-compile.mjs <run dir> [--column clarify] [--rows]
//
// A row reads as `equal` when every authored text the cell says is in her turn, whole, and nothing else of the lesson's authored text
// is there but the part the cell's `then` names. `differ` names what was missing or extra; `unmapped` turns are ones the shadow cannot
// place on a part (an aside reply, the greeting, a goodbye) and are counted apart.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileScript, COLUMNS } from "../../server/director/compile.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const key = (t) => norm(t).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
const GIVE_UP = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|aap\s+(?:hi\s+)?batao|tum\s+batao|i\s+(?:don'?t|do\s+not)\s+know|give\s+up|chhodo|nahi\s+aata)(?![\p{L}])/iu;
const CLARIFY = /(?<![\p{L}])(?:samajh\s+nahi|samjha\s+nahi|samjhi\s+nahi|didn'?t\s+understand|don'?t\s+understand|kya\s+matlab)(?![\p{L}])/iu;
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab:?/i;
const CHECKIN = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear)\?\s*$/i;

/** The column a child's reply asks for, from the row the harness wrote (its read and words). null: no column (a plain "haan"). */
export function columnOf(child) {
  const read = String(child?.read ?? ""), text = String(child?.text ?? "");
  const out = read.split(" ")[0];
  if (CLARIFY.test(text) || /·\s*(?:another|clarify|confused)/.test(read)) return "clarify";
  if (/·\s*language/.test(read)) return "hindi";
  if (/·\s*(?:repeat|which)/.test(read)) return "repeat";
  if (/·\s*visual/.test(read)) return "picture";
  if (/·\s*(?:selftry|thinking)/.test(read)) return "try_first";
  if (/·\s*uptake/.test(read)) return "aside";
  if (GIVE_UP.test(text)) return "give_up";
  if (out === "correct") return "right";
  if (out === "misconception") return "misconception";
  if (out === "incorrect" || out === "partial") return "wrong";
  return null;
}

/** The part her last turn was on, as a compiled part id: { id, kind } or null. */
export function partOf(prevT, script) {
  const m = /^s(\d+):(\w+):(.+)$/.exec(String(prevT?.beat ?? ""));
  if (!m) return null;
  const sk = script?.skills?.[Number(m[1]) - 1];
  if (!sk) return null;
  const S = sk.skillId, kind = m[2], beat = m[3];
  const cardSaid = !!prevT.card && key(prevT.text).includes(key(sentencesOf(prevT.card).at(-1) ?? prevT.card));
  // (a key's turn — "Iska jawab …, Yahan tak saaf hai?" — is on the card it closed, with that card's help spent)
  const keyTurn = !cardSaid && KEY_SAID.test(prevT.text);
  if (kind === "explain") {
    const id = beat.replace(/^explain:/, "");
    if (cardSaid || keyTurn) return { id: `${S}:${id}:card`, kind: "card", ...(keyTurn ? { spent: true } : {}) };
    return CHECKIN.test(norm(prevT.text)) ? { id: `${S}:${id}:checkin`, kind: "checkin" } : { id: `${S}:${id}:point`, kind: "point" };
  }
  if (kind === "worked") {
    if (beat === "worked") return cardSaid || keyTurn ? { id: `${S}:worked:yourStep`, kind: "your_step", ...(keyTurn ? { spent: true } : {}) } : null;
    const w = /^worked:(problem|step\d+)$/.exec(beat);
    return w ? { id: `${S}:worked:${w[1]}`, kind: "worked_step" } : null;
  }
  if (kind === "check") {
    const t = /^then:(.+)$/.exec(beat);
    if (t) { const i = (sk.remediation ?? []).findIndex((r) => r.targets === t[1]); return i >= 0 ? { id: `${S}:rem:${i}:then`, kind: "then_card", ...(keyTurn ? { spent: true } : {}) } : null; }
    return { id: `${S}:check:${beat}`, kind: "check", ...(keyTurn ? { spent: true } : {}) };
  }
  if (kind === "remediation") {
    const t = /^rem:(.+)$/.exec(beat);
    const i = t ? (sk.remediation ?? []).findIndex((r) => r.targets === t[1]) : -1;
    return i >= 0 ? { id: `${S}:rem:${i}`, kind: "remediation" } : null;
  }
  if (kind === "hook") return { id: `${S}:hook`, kind: "hook" };
  return null;
}

/** The help state that turn read, from the rows before it: spent after a miss on the part, heard after a clarify on it, else fresh. */
function helpOf(rows, i, part) {
  if (part.spent) return "spent";
  let heard = false;
  for (let j = i - 2; j >= 1; j -= 2) {
    const t = rows[j - 1], c = rows[j];
    if (!t || t.who !== "teacher" || !c) break;
    const p = partOf(t, rows.script);
    if (!p || p.id !== part.id) break;
    const col = columnOf(c);
    if (["wrong", "misconception"].includes(col)) return "spent";
    if (["clarify", "give_up"].includes(col)) heard = true;
  }
  return heard ? "heard" : "fresh";
}

/** A path into the script ("skills[0].explain[1].simpler") → its text in the lesson's form (hi, else en), or null. */
function textAt(script, path) {
  let v = script;
  for (const seg of String(path).split(".")) {
    const m = /^(\w+)(?:\[(\d+)\])?$/.exec(seg);
    if (!m || v == null) return null;
    v = v[m[1]];
    if (m[2] != null) v = Array.isArray(v) ? v[Number(m[2])] : null;
  }
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && (v.hi || v.en)) return v.hi ?? v.en;
  if (typeof v === "object" && v.prompt) return v.prompt.hi ?? v.prompt.en ?? null;
  return null;
}

/** One lesson's shadow rows: [{ row, part, column, help, address, verdict: equal | differ | hole | unmapped, why }]. */
export function shadowLesson({ rows, script }, { compiled = null } = {}) {
  const C = compiled ?? compileScript(script, null);
  const R = Object.assign([...rows], { script });
  const out = [];
  for (let i = 2; i < R.length; i++) {
    const r = R[i];
    if (r.who !== "teacher") continue;
    const child = R[i - 1], prevT = R[i - 2];
    const column = columnOf(child);
    if (!column || !COLUMNS.includes(column)) continue;
    const part = prevT?.who === "teacher" ? partOf(prevT, script) : null;
    if (!part) { out.push({ row: i, column, verdict: "unmapped", why: `no part for beat ${prevT?.beat ?? "-"}` }); continue; }
    const help = helpOf(R, i, part);
    const cell = C.cells?.[part.id]?.[column]?.[help];
    if (!cell) { out.push({ row: i, part: part.id, column, help, verdict: "unmapped", why: "no cell (not applicable)" }); continue; }
    if (cell.notApplicable) { out.push({ row: i, part: part.id, column, help, address: cell.address, verdict: "unmapped", why: `use ${cell.use}` }); continue; }
    if (cell.hole) { out.push({ row: i, part: part.id, column, help, address: cell.address, verdict: "hole", why: "the script lacks a field this cell says" }); continue; }
    const T = ` ${key(r.text)} `;
    // (a key is said in the lesson's words — "No" as "nahi", "Yes" as "haan"; a why is said inside "kyunki …", its opening words whole)
    const YES_NO = { no: ["nahi", "nahin", "no"], yes: ["haan", "ha", "yes"] };
    const saidAs = (p, t) => {
      if (/\.key$/.test(p)) return (YES_NO[key(t)] ?? [key(t)]).some((k) => T.includes(` ${k} `));
      if (/\.why$/.test(p)) return T.includes(` ${key(t).split(" ").slice(0, 5).join(" ")} `);
      // (S1: a card the cell re-says may be its question alone)
      if (/prompt$|\.ask$/.test(p) && T.includes(` ${key(sentencesOf(t).at(-1) ?? "")} `)) return true;
      return T.includes(` ${key(t)} `);
    };
    const missing = (cell.say ?? []).map((p) => ({ p, t: textAt(script, p) })).filter((x) => x.t && x.t !== "joint" && !saidAs(x.p, x.t));
    const why = missing.length ? `not said: ${missing.map((x) => x.p).join(", ")}` : null;
    out.push({ row: i, part: part.id, column, help, address: cell.address, then: cell.then, verdict: why ? "differ" : "equal", ...(why ? { why } : {}), text: norm(r.text).slice(0, 120) });
  }
  return out;
}

/** A run directory's shadow rows, and the table by column: { [column]: { equal, differ, hole, unmapped } }. */
export function shadowRun(dir) {
  const rows = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json") && x !== "meter.json").sort()) {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(j.director) || !j.topicId) continue;
    const snap = join(dir, "scripts", `${j.topicId}.json`);
    const path = existsSync(snap) ? snap : new URL(`../../data/lesson-scripts/${j.topicId}.json`, import.meta.url).pathname;
    if (!existsSync(path)) continue;
    const script = JSON.parse(readFileSync(path, "utf8"));
    for (const x of shadowLesson({ rows: j.director, script })) rows.push({ lesson: f.replace(/\.json$/, ""), ...x });
  }
  const table = {};
  for (const x of rows) { const t = (table[x.column] ??= { equal: 0, differ: 0, hole: 0, unmapped: 0 }); t[x.verdict]++; }
  return { rows, table };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) { console.error("usage: shadow-compile.mjs <run dir> [--column <c>] [--rows]"); process.exit(2); }
  const only = process.argv.includes("--column") ? process.argv[process.argv.indexOf("--column") + 1] : null;
  const { rows, table } = shadowRun(dir);
  const cols = ["clarify", ...COLUMNS.filter((c) => c !== "clarify")].filter((c) => table[c] && (!only || c === only));
  console.log("column        equal differ  hole unmapped");
  for (const c of cols) { const t = table[c]; console.log(`${c.padEnd(13)} ${String(t.equal).padStart(5)} ${String(t.differ).padStart(6)} ${String(t.hole).padStart(5)} ${String(t.unmapped).padStart(8)}`); }
  if (process.argv.includes("--rows")) for (const x of rows.filter((y) => (!only || y.column === only) && y.verdict !== "equal")) console.log(`${x.lesson} ${x.row} ${x.column} ${x.address ?? x.part ?? "-"} ${x.verdict}: ${x.why ?? ""} | ${x.text ?? ""}`);
}
