// W2 seam commit acceptance (BUILD-PLAN §4): with every seam placed, the lesson still runs end to end on the text and
// cascade lanes, Practice and Ask still start, the live-call token still mints with the transcription logprobs, and any
// W2 field that appears on the wire has its contract shape (shared/contracts.ts, brain.ts, studio.ts, relational.ts).
// Written to stay true after the owners fill the seams (it runs as wave-2 regression): it checks shapes when a field is
// present, never that a field is absent. Deletes its test account in a finally (lib.mjs withTestAccount).
import { withTestAccount, runLesson, ok, done } from "./lib.mjs";

const DISPLAYS = new Set(["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"]);
const BEATS = new Set(["arrive", "warmup", "hook", "explain", "worked_example", "contrast", "practice_set", "probe", "explore_question", "teachback", "reflect", "recap", "wrap", "break", "safeguard"]);
const SLOT_STATES = new Set(["planning", "skeleton_shown", "building", "ready", "revealed", "in_use", "failed", "fallback_shown"]);
const ARTIFACTS = new Set(["whiteboard", "frame", "skeleton", "image"]);

/** Contract checks on one response's W2 fields; returns the list of violations. */
function w2Shape(where, r) {
  const bad = [];
  const ui = r?.ui ?? {};
  if (ui.teacherAffect !== undefined) {
    const a = ui.teacherAffect;
    if (!DISPLAYS.has(a?.display) || ![1, 2].includes(a?.intensity) || Object.keys(a).some((k) => k !== "display" && k !== "intensity")) bad.push(`${where} ui.teacherAffect ${JSON.stringify(a)}`);
  }
  if (ui.beat !== undefined && (!BEATS.has(ui.beat?.type) || typeof ui.beat?.beatId !== "string")) bad.push(`${where} ui.beat ${JSON.stringify(ui.beat)}`);
  if (ui.tray === "studio" && !ui.studioSlot) bad.push(`${where} studio tray without a slot`);
  if (ui.studioSlot !== undefined) {
    const s = ui.studioSlot;
    if (typeof s?.slotId !== "string" || !SLOT_STATES.has(s?.state)) bad.push(`${where} ui.studioSlot ${JSON.stringify(s).slice(0, 200)}`);
    if (s?.artifact && !ARTIFACTS.has(s.artifact.kind)) bad.push(`${where} artifact kind ${s.artifact.kind}`);
    if (s?.artifact?.kind === "whiteboard") {
      const sc = s.artifact.script;
      if (sc?.v !== 1 || sc?.anchor !== "line_audio_start" || !Array.isArray(sc?.ops) || sc.ops.some((o) => !(o.endMs >= o.startMs && o.startMs >= 0))) bad.push(`${where} whiteboard script`);
    }
  }
  if (r?.studio !== undefined) {
    const st = r.studio;
    if (r.move?.kind === "safeguard") bad.push(`${where} a Studio action on a safeguarding turn`);
    for (const k of Object.keys(st ?? {})) if (!["reveal", "highlight", "retire", "setParam"].includes(k)) bad.push(`${where} studio.${k}`);
  }
  if (r?.moment !== undefined && (typeof r.moment?.move !== "string" || typeof r.moment?.safety !== "boolean")) bad.push(`${where} moment`);
  return bad;
}

await withTestAccount(async ({ api, child }) => {
  const bad = [];
  // Text lane, a short lesson.
  const text = await runLesson(api, child.id, { mode: "text", lines: ["haan, ready", "mujhe nahi pata", "teen"] });
  ok(text.start.status === 201 && typeof text.start.teacherOpening === "string", `text lesson starts (${text.start.ms} ms)`);
  ok(text.turns.length > 0 && text.turns.every((t) => !!t.move?.kind && typeof t.teacherReply === "string"), `text turns answered (${text.turns.map((t) => t.move?.kind).join(", ")})`);
  ok(text.end?.status === 200, "text lesson ends 200");
  bad.push(...w2Shape("text start", text.start), ...text.turns.flatMap((t, i) => w2Shape(`text turn ${i + 1}`, t)));

  // Cascade lane (voice by the server's words), one typed turn.
  const cas = await runLesson(api, child.id, { mode: "cascade", lines: ["ek bata do"], typed: true });
  ok(cas.start.status === 201 && cas.turns.length === 1 && typeof cas.turns[0].teacherReply === "string", "cascade lesson starts and answers");
  bad.push(...w2Shape("cascade start", cas.start), ...cas.turns.flatMap((t) => w2Shape("cascade turn", t)));

  // Practice and Ask still start through the purpose seam.
  const pr = await runLesson(api, child.id, { mode: "text", purpose: "practice", lines: ["2"] });
  ok(pr.start.status === 201 && !!pr.start.topic?.id, `practice starts (topic ${pr.start.topic?.id})`);
  bad.push(...w2Shape("practice", pr.start), ...pr.turns.flatMap((t) => w2Shape("practice turn", t)));
  const ask = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "doubt", firstText: "1/2 bada hai ya 1/4?" });
  ok(ask.status === 201 && !!ask.topic?.id, `ask starts (topic ${ask.topic?.id})`);
  await api("POST", "/api/lesson/end", { lessonId: ask.lessonId });

  // The live-call token: still minted through the realtime seam, logprobs kept (classify's low-ASR gate reads them).
  const live = await api("POST", "/api/lesson/start", { childId: child.id, mode: "voice" });
  const tok = await api("POST", "/api/realtime/token", { lessonId: live.lessonId }, [200, 429, 502, 503]);
  if (tok.status === 200) {
    ok(typeof tok.token === "string" && !!tok.base, "realtime token minted");
    ok((tok.session?.include ?? []).includes("item.input_audio_transcription.logprobs"), "the minted session keeps the transcription logprobs");
    ok(!("instructions" in (tok.session ?? {})), "the client session carries no instructions");
  } else {
    ok(tok.status !== 503 || tok.fallback === "cascade", `realtime token refused with a lane fallback (${tok.status})`);
  }
  await api("POST", "/api/lesson/end", { lessonId: live.lessonId });

  ok(bad.length === 0, `W2 fields on the wire match their contracts${bad.length ? `: ${bad.join("; ")}` : ""}`);
}, { tag: "w2seam" });
done();
