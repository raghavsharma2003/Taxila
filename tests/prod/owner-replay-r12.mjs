#!/usr/bin/env node
// r12 RCA / release 13: replay the owner's two release-11 lessons (export docs/design/round4/build/r12/rca/
// owner-lessons-2026-10-11.json) through a local server on TEST — the child's exact turns in order (spoken lane, the
// transcripts as heard; the "Show me a picture" chip as a chip) — and record what she says now, what the guard did, and
// what Studio put on the screen. Her replies are model-written, so a replay shows the behaviour of the code on the same
// child turns, not the same words; run it on the base and on the patched tree for a before/after.
//
//   TAXILA_BASE=http://localhost:8097 node --env-file=.env.local tests/prod/owner-replay-r12.mjs --out <dir> [--lesson a95d2ff1|b08fe8a7]
import fs from "node:fs";
import { join } from "node:path";
import { withTestAccount, freshChild, openLesson, arg, ROOT, ok, done } from "./_owner.mjs";

const EXPORT = JSON.parse(fs.readFileSync(join(ROOT, "docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json"), "utf8"));
const OUT = arg("out", join(ROOT, "docs/design/round4/build/r12/rca/replay", `run-${Date.now()}`));
const only = arg("lesson", null);
const KIKO = { name: "Kiko", classLevel: 9, lang: "hinglish", interests: ["cricket"] };

/** What the response put on the screen: the Studio slot's artifact and its facts, the module, the chips. */
function screenOf(r) {
  const slot = r?.ui?.studioSlot ?? r?.studioSlot ?? null;
  const art = slot?.artifact ?? null;
  const texts = (art?.script?.ops ?? []).filter((o) => o.text).map((o) => o.text);
  return {
    studio: art ? { kind: art.kind, mode: art.script?.mode ?? null, texts: texts.slice(0, 12) } : slot ? { state: slot.state ?? null } : null,
    module: (r?.moduleCommands ?? []).filter((c) => c.op === "mount").map((c) => c.engine ?? c.moduleId),
    chips: (r?.ui?.chips ?? []).map((c) => c.label),
  };
}

await withTestAccount(async ({ api }) => {
  const report = {};
  for (const [id, L0] of Object.entries(EXPORT)) {
    if (only && !id.startsWith(only)) continue;
    const child = await freshChild(api, KIKO);
    const L = await openLesson(api, child, { topicId: L0.lesson.topic_id, spoken: true, persona: KIKO });
    const rows = [{ seq: 1, child: null, was: L0.turns.find((t) => t.seq === 1)?.text ?? null, now: L.opening.teacherReply ?? null, screen: screenOf(L.opening) }];
    const turns = L0.turns.filter((t) => t.speaker === "child");
    for (const t of turns) {
      const chip = t.meta?.chipId ?? null;
      const row = await L.turn(t.text, { raw: true, asr: t.asr_conf ?? 0.9, body: chip ? { chipId: chip, typed: true } : {} });
      const was = L0.turns.find((x) => x.seq === t.seq + 1 && x.speaker === "teacher");
      rows.push({ seq: t.seq + 1, child: t.text, chip, was: was?.text ?? null, wasGuard: was?.meta?.guard ?? null,
        now: row.r?.teacherReply ?? null, error: row.r?.error?.message ?? null, move: row.r?.move?.kind ?? null, request: row.r?.move?.request ?? null,
        guard: row.r?.guard ?? row.r?.trace?.guard ?? null, screen: screenOf(row.r), ms: row.ms });
      if (row.r?.end || L.ended) break;
    }
    await L.end();
    report[id] = { lessonId: L.lessonId, rows };
    ok(rows.every((x) => !x.error), `${id.slice(0, 8)}: ${rows.length} turns replayed without an HTTP error`);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(join(OUT, "replay.json"), JSON.stringify(report, null, 1));
  const md = [];
  for (const [id, R] of Object.entries(report)) {
    md.push(`## ${id.slice(0, 8)} (replayed as ${R.lessonId.slice(0, 8)})`, "", "| seq | child | she said (11 Oct) | she says now | on screen now |", "|---|---|---|---|---|");
    const cell = (x) => String(x ?? "").replace(/\|/g, "/").replace(/\s+/g, " ").slice(0, 220);
    for (const x of R.rows) {
      const scr = x.screen?.studio?.texts?.length ? `board (${x.screen.studio.mode ?? "?"}): ${x.screen.studio.texts.slice(0, 4).join(" · ")}` : x.screen?.studio?.kind ?? x.screen?.studio?.state ?? (x.screen?.module?.length ? `module ${x.screen.module.join(",")}` : "—");
      md.push(`| ${x.seq} | ${cell(x.chip ? `[chip ${x.chip}] ${x.child}` : x.child)} | ${cell(x.was)} | ${cell(x.error ? `ERROR ${x.error}` : x.now)} | ${cell(scr)} |`);
    }
    md.push("");
  }
  fs.writeFileSync(join(OUT, "replay.md"), md.join("\n"));
  console.log(`wrote ${join(OUT, "replay.md")}`);
}, { tag: "r12-replay" });
done();
