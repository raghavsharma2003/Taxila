// Sim lab reports: markdown transcripts, scores.json and FAILURES.md (failures clustered by type, with counts and
// example turns) for one run directory. Re-runnable on its own: node evals/simlab/report.mjs <run-dir>
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { RUBRIC, FAILURE_TYPES } from "./judge.mjs";

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const f2 = (x) => (x == null ? "–" : x.toFixed(2));
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "–");

export function transcriptMd(rec, p, j) {
  const L = [`# ${p.id} · ${rec.lane} lane · ${rec.arm ?? ""}`, "",
    `Class ${p.classLevel} ${p.board.toUpperCase()} · ${p.lang} · ${p.temperament} · habits ${p.habits.join(", ")} · topic ${p.topicId} (${rec.start?.topic?.title ?? "?"})`, "",
    "Hidden truth (start → end): " + p.skills.map((s) => `${s.title} **${s.state} → ${rec.state[s.id]}**`).join("; "),
    `Misconceptions held: ${p.misconceptions.map((m) => m.id.split("-m-")[1]).join(", ") || "none"}${p.safetyEvent ? ` · safety event: ${p.safetyEvent.kind}` : ""}`, "",
    `Start ${rec.start?.ms ?? "?"} ms · errors ${rec.errors.length ? rec.errors.map((e) => `${e.at}: ${e.msg}`).join(" | ") : "none"}`, ""];
  for (const t of rec.turns) {
    if (t.child) {
      const how = t.child.action === "tap" ? `*tapped* **${t.child.chipLabel}**` : t.child.action === "pad" ? `*pad* ${t.child.say}` : t.child.say;
      L.push(`**${t.n} · child:** ${how}${t.child.asr ? ` — *ASR heard:* "${t.child.asr.text}" (${t.child.asr.confidence})` : ""}  `, `<sub>hidden: ${t.child.private}</sub>`, "");
    }
    if (t.error) { L.push(`**${t.n} · ERROR:** ${t.error}`, ""); continue; }
    const s = t.screen ?? {};
    const r = t.reasons;
    const why = r?.classification ? ` · read ${r.classification.outcome}${r.verdict ? `/${r.verdict}` : ""}${r.classification.flags?.length ? ` [${r.classification.flags.join(",")}]` : ""}${r.item ? ` · item ${r.item.id.split("-").pop()}` : ""}` : "";
    L.push(`**${t.n} · teacher** (${t.move ?? "?"}, ${t.ms} ms${why}): ${t.teacher}`);
    const shown = [s.ask && `card “${s.ask}”`, s.chips?.length && `chips ${s.chips.map((c) => `[${c.label}]`).join(" ")}`, s.whiteboard && `board ${s.whiteboard}`, s.module && `activity ${s.module}`, s.studio && `studio ${s.studio}`].filter(Boolean);
    if (shown.length) L.push(`<sub>screen: ${shown.join(" · ")}</sub>`);
    L.push("");
  }
  if (rec.boardPages?.length) L.push("## Board pages (server record)", "", ...rec.boardPages.map((pg) => `- page ${pg.seq}${pg.beat ? ` [${pg.beat}]` : ""} at ${pg.at.slice(11, 19)}: ${pg.board}`), "");
  if (rec.end) L.push("## Parent summary", "", rec.end.summary ?? "", "", rec.end.parentNote ?? "", "");
  if (j?.judged) {
    L.push(`## Judge (${j.judged.judge})`, "", `> ${j.judged.verdict ?? ""}`, "", "| check | score | turns | why |", "|---|---|---|---|");
    for (const k of RUBRIC) { const s = j.judged.scores?.[k]; L.push(`| ${k} | ${s?.score ?? "–"} | ${(s?.turns ?? []).join(", ")} | ${String(s?.why ?? "").replace(/\|/g, "/")} |`); }
    L.push("", "Failures:", ...(j.judged.failures ?? []).map((f) => `- **${f.type}** (turns ${(f.turns ?? []).join(", ")}): “${f.quote}” — ${f.why}`), "");
    L.push(`Understanding vs card: ${j.understanding.agree}/${j.understanding.probed} probed skills read right (${j.understanding.of} skills; overclaimed ${j.understanding.overclaim}); misconceptions detected ${j.understanding.misconceptionsDetected}/${j.understanding.misconceptionsHeld}, false alarms ${j.understanding.falseAlarms}`, "");
  }
  return L.join("\n");
}

/** Merge judge failures and auto checks into typed instances: { type, persona, arm, turns, quote, why, source }. */
export function instancesOf(row) {
  const out = [];
  for (const f of row.judged?.failures ?? []) {
    const type = FAILURE_TYPES[f.type] ? f.type : "other";
    out.push({ type, persona: row.persona, arm: row.arm, lane: row.lane, turns: f.turns ?? [], quote: f.quote ?? "", why: f.why ?? "", source: "judge" });
  }
  const a = row.auto ?? {};
  for (const n of a.type_instruction ?? []) out.push({ type: "type_instruction", persona: row.persona, arm: row.arm, lane: row.lane, turns: [n], quote: row.lines?.[n] ?? "", why: "auto: a typing instruction on the voice-first lane", source: "auto" });
  for (const n of a.points_empty_screen ?? []) out.push({ type: "points_empty_screen", persona: row.persona, arm: row.arm, lane: row.lane, turns: [n], quote: row.lines?.[n] ?? "", why: "auto: a pointing line while nothing is on screen", source: "auto" });
  if (a.errors) out.push({ type: "dead_end", persona: row.persona, arm: row.arm, lane: row.lane, turns: [], quote: "", why: `auto: ${a.errors} server/runner errors`, source: "auto" });
  if (a.safety && ((a.safety.helpline === false) || (a.safety.aiDisclosed === false))) out.push({ type: "safety_breach", persona: row.persona, arm: row.arm, lane: row.lane, turns: [], quote: "", why: `auto: ${a.safety.kind}: helpline ${a.safety.helpline}, AI disclosed ${a.safety.aiDisclosed}`, source: "auto" });
  return out;
}

export function summarise(rows) {
  const arms = [...new Set(rows.map((r) => `${r.arm}/${r.lane}`))];
  const by = {};
  for (const key of arms) {
    const rs = rows.filter((r) => `${r.arm}/${r.lane}` === key && r.judged);
    const u = rs.map((r) => r.understanding);
    by[key] = {
      n: rs.length,
      rubric: Object.fromEntries(RUBRIC.map((k) => [k, mean(rs.map((r) => r.judged.scores?.[k]?.score).filter((x) => typeof x === "number"))])),
      rubric2: Object.fromEntries(RUBRIC.map((k) => [k, mean(rs.map((r) => r.judged2?.scores?.[k]?.score).filter((x) => typeof x === "number"))])),
      understanding: { agree: u.reduce((a, x) => a + x.agree, 0), probed: u.reduce((a, x) => a + x.probed, 0), skills: u.reduce((a, x) => a + x.of, 0), overclaim: u.reduce((a, x) => a + x.overclaim, 0),
        misHeld: u.reduce((a, x) => a + x.misconceptionsHeld, 0), misDetected: u.reduce((a, x) => a + x.misconceptionsDetected, 0), falseAlarms: u.reduce((a, x) => a + x.falseAlarms, 0) },
      auto: { typeInstr: rs.filter((r) => r.auto.type_instruction.length).length, pointsEmpty: rs.filter((r) => r.auto.points_empty_screen.length).length,
        repeats: rs.filter((r) => r.auto.repeat_line.length).length, longTurns: rs.reduce((a, r) => a + r.auto.long_turn.length, 0),
        withErrors: rs.filter((r) => r.auto.errors).length,
        boardPages: rs.reduce((a, r) => a + (r.auto.board?.pages ?? 0), 0), repeatPageLessons: rs.filter((r) => r.auto.board?.repeatPages?.length).length, latencyP50: mean(rs.map((r) => r.auto.latencyP50).filter(Boolean)) },
      turns: mean(rs.map((r) => r.turns)),
    };
  }
  return by;
}

export function failuresMd(rows, meta) {
  const inst = rows.flatMap(instancesOf);
  const sum = summarise(rows);
  const L = [`# Sim lab ${meta.runId} — failures`, "",
    `${meta.note ?? ""}`, "",
    `Server head \`${meta.head}\` · child ${meta.models.child} · judge ${meta.models.judge} (second judge ${meta.models.judge2}) · ${meta.date}`, "",
    "## Scores (judge 1 means, 1-5; n = lessons)", "",
    `| arm/lane | n | ${RUBRIC.join(" | ")} | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |`,
    `|---|---|${RUBRIC.map(() => "---").join("|")}|---|---|---|---|---|---|---|---|---|---|`];
  for (const [k, s] of Object.entries(sum)) {
    const u = s.understanding;
    L.push(`| ${k} | ${s.n} | ${RUBRIC.map((r) => f2(s.rubric[r])).join(" | ")} | ${u.agree}/${u.probed} probed (${pct(u.agree, u.probed)}); ${u.probed}/${u.skills} skills probed | ${u.overclaim} | ${u.misDetected}/${u.misHeld} | ${u.falseAlarms} | ${s.auto.typeInstr} | ${s.auto.pointsEmpty} | ${s.auto.repeats} | ${s.auto.boardPages} (${s.auto.repeatPageLessons}) | ${s.auto.withErrors} | ${s.auto.latencyP50 ? Math.round(s.auto.latencyP50) : "–"} |`);
  }
  L.push("", "Second judge means (agreement check): " + Object.entries(sum).map(([k, s]) => `${k}: ${RUBRIC.map((r) => `${r} ${f2(s.rubric2[r])}`).join(", ")}`).join(" · "), "");
  L.push("## Failure clusters", "", "Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.", "");
  const types = Object.keys(FAILURE_TYPES).map((t) => {
    const xs = inst.filter((i) => i.type === t);
    return { t, xs, lessons: new Set(xs.map((x) => `${x.persona}/${x.arm}/${x.lane}`)).size };
  }).filter((c) => c.xs.length).sort((a, b) => b.lessons - a.lessons || b.xs.length - a.xs.length);
  const nLessons = rows.filter((r) => r.judged).length;
  for (const c of types) {
    L.push(`### ${c.t} — ${c.lessons}/${nLessons} lessons, ${c.xs.length} instances`, "", `*${FAILURE_TYPES[c.t]}*`, "");
    const ex = [...c.xs].sort((a, b) => (b.quote ? 1 : 0) - (a.quote ? 1 : 0));
    const seen = new Set();
    let k = 0;
    for (const x of ex) {
      if (k >= 3 || seen.has(x.persona)) continue;
      seen.add(x.persona); k++;
      L.push(`- \`${x.persona}\` (${x.arm}/${x.lane}) turn ${x.turns.join(", ") || "–"}: “${x.quote}” — ${x.why}`);
    }
    L.push("");
  }
  return { md: L.join("\n"), sum, clusters: types.map((c) => ({ type: c.t, lessons: c.lessons, instances: c.xs.length, examples: c.xs.slice(0, 3) })) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  const rows = JSON.parse(readFileSync(join(dir, "scores.json"), "utf8")).lessons;
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const { md } = failuresMd(rows, meta);
  writeFileSync(join(dir, "FAILURES.md"), md);
  console.log(md.slice(0, 4000));
}
