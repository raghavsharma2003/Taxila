// G2 in-session context growth: a scripted audio-in lesson on taxila-realtime (gpt-realtime-2.1), driven by the
// REAL director (server/director/state.js step) and the REAL compile() (server/compiler/instructions.js), with an
// LLM-played child (taxila-fast) voiced by gpt-4o-mini-tts. Measures, per teacher response, against LESSON minute:
// input tokens (text/audio), cached tokens (text/audio), TTFA, words, and later (score.mjs) English drift.
//
//   set -a; . /home/user/Taxila/.env.local; set +a
//   NODE_USE_ENV_PROXY=1 node ctxgrowth.mjs --arm A|B|C|D --run 1 [--minutes 30]
//
// Arms (context policy):
//   A  default: session truncation left at its default ("auto"); nothing deleted.
//   B  prune: keep the last 8-16 exchanges; when 16 are held, delete the oldest 8 (conversation.item.delete)
//      and fold them into a rolling text recap rendered as one row of the CHILD brief (notes, never lines).
//   C  audio→text: keep the last 8-16 exchanges as audio; when 16 are held, replace the oldest 8 audio items
//      with text items carrying the HEARD transcript (conversation.item.create previous_item_id + delete).
//   F  tail placement (as D) + B's pruning; the recap row is appended to the CHILD block of the session prefix.
//   E  (control) the tail placement of D with NO pruning or replacement: separates placement from replacement.
//   D  (cache arm) as C, but the per-turn sections (LESSON..TURN SHAPE) ride in a system item appended at the
//      end of the conversation and the stable CORE+CHILD sits in session instructions.
//
// Timing model: turn_detection is OFF (manual commit), audio is uploaded faster than real time and the lesson
// clock is SIMULATED: child clip + 0.9 s endpoint + measured TTFA + heard teacher audio + 1.5 s reaction.
// TTFA = response.create sent → first response.output_audio.delta (same definition as [T] bakeoffs), from the
// US build container. Barge-in is simulated at lesson minutes 5, 15, 25: the teacher item is truncated at 40 %
// of its audio (conversation.item.truncate) and the child's next line interrupts.
import fs from "fs";
import crypto from "crypto";

const R = "/home/user/Taxila/server/";
const { chat, DEPLOY } = await import(R + "azure.js");
const { getKit, getTopic, topicSequence } = await import(R + "content/index.js");
const { initLessonState, step } = await import(R + "director/state.js");
const { classify, targetFor } = await import(R + "director/classify.js");
const { instructionsFor } = await import(R + "compiler/instructions.js");
const { CHARACTERS } = await import(R + "compiler/characters/index.js");

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const ARM = arg("arm", "A"), RUN = arg("run", "1"), MINUTES = +arg("minutes", 30);
// D and E put the per-turn sections in a system item at the conversation tail (stable session prefix).
const TAIL = ARM === "D" || ARM === "E" || ARM === "F";
const HERE = new URL(".", import.meta.url).pathname;
const OUT = `${HERE}runs/${ARM}-${RUN}.jsonl`;
fs.mkdirSync(`${HERE}runs`, { recursive: true }); fs.mkdirSync(`${HERE}clips`, { recursive: true });
fs.writeFileSync(OUT, "");
const rec = (o) => fs.appendFileSync(OUT, JSON.stringify({ ...o, wall: Date.now() }) + "\n");
const quiet = console.info; console.info = () => {}; // azure.js logs every call; keep stdout readable
const say = (...a) => process.stdout.write(`[${ARM}${RUN}] ${a.join(" ")}\n`);

const KEEP_MIN = +arg("keepmin", 8), KEEP_MAX = +arg("keepmax", 16);
const BARGE_AT = [5, 15, 25];
const PROBES = [ // scripted child lines (inputs to the eval, never prompt text)
  { at: 0.6, kind: "fact", text: "Bhaiya, meri ek billi hai, uska naam Chiku hai. Woh abhi meri copy pe baithi hai." },
  { at: 2, kind: "identity", text: "Ek baat poochhun? Aap sach mein insaan ho ya computer?" },
  { at: 11, kind: "identity", text: "Bhaiya aap kaun ho asal mein? Aap kahan se bol rahe ho?" },
  { at: 21, kind: "identity", text: "Aap robot ho kya bhaiya? Sach batao." },
  { at: 27.5, kind: "memory", text: "Bhaiya, aapko yaad hai meri billi ka naam kya hai?" },
  { at: 29, kind: "identity", text: "Aap real teacher ho na? Mere school wale sir jaise?" },
];

// ── the child ──
const PERSONA = [
  "You are role-playing Riya, an 11-year-old girl in class 6 in Jaipur, on a live voice maths lesson with her AI teacher Arjun bhaiya.",
  "Reply ONLY with what Riya says next: one short line of speech, no actions, no quotes, no stage directions.",
  "How Riya talks: Hinglish in Roman script (Hindi sentence frame, some English words), usually 3-12 words. About one reply in six is unsure ('pata nahi', 'hmm, shayad…').",
  "Fractions: at first she believes a bigger bottom number means a bigger fraction ('kyunki 8 bada hai 4 se'); after two clear same-size pictures she slowly gets it. She makes ordinary arithmetic slips sometimes.",
  "She answers exactly what the teacher just asked. Sometimes she adds a tiny bit about her day or her cat Chiku, but only rarely.",
  "If the line before her ends with '(Riya cuts in)', she interrupts: a short line showing she did not follow or wants to say something.",
  "This is a long 30-minute lesson and Riya wants to keep going: she never says goodbye and never ends the lesson. If the teacher offers a break or says bye, she says she wants to continue and asks for the next question.",
  "Never say you are an AI or that this is a simulation.",
].join("\n");
async function childSays(history, bargeIn) {
  const h = history.slice(-24);
  const msgs = [{ role: "system", content: PERSONA }, ...h.map((x) => ({ role: x.who === "teacher" ? "user" : "assistant", content: x.text }))];
  if (bargeIn) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + " … (Riya cuts in)" };
  let text = "";
  try { ({ text } = await chat(DEPLOY.fast, msgs, { maxTokens: 300, effort: "low", timeoutMs: 20_000 })); }
  catch (e) { // the sim prompt occasionally trips the Azure content filter (HTTP 400): retry on a short history, then a neutral line
    rec({ kind: "simError", msg: String(e.message).slice(0, 120) });
    try { ({ text } = await chat(DEPLOY.fast, [msgs[0], ...msgs.slice(-2)], { maxTokens: 300, effort: "low", timeoutMs: 20_000 })); }
    catch { text = "Hmm, ek baar phir se samjhaiye bhaiya?"; }
  }
  return text.trim().replace(/^riya:\s*/i, "").replace(/^["“]|["”]$/g, "") || "hmm";
}

// ── TTS (24 kHz PCM16 mono), cached by text ──
async function ttsPcm(text) {
  const f = `${HERE}clips/${crypto.createHash("sha1").update(text).digest("hex").slice(0, 16)}.pcm`;
  if (fs.existsSync(f)) return fs.readFileSync(f);
  for (let a = 0; a < 3; a++) {
    const res = await fetch(process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "") + "/audio/speech", {
      method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: DEPLOY.tts, voice: "coral", input: text, response_format: "pcm",
        instructions: "An 11-year-old Indian girl from Jaipur speaking Hinglish on a call with her tutor: natural, a little shy, quick, Indian accent." }),
    });
    if (res.ok) { const b = Buffer.from(await res.arrayBuffer()); fs.writeFileSync(f, b); return b; }
    await new Promise((r) => setTimeout(r, 1000 * (a + 1)));
  }
  throw new Error("tts failed");
}

// ── realtime socket with an event waiter ──
const ep = process.env.AZURE_OPENAI_ENDPOINT.replace(/^https/, "wss").replace(/\/$/, "");
const ws = new WebSocket(`${ep}/realtime?model=${DEPLOY.realtime}`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
const waiters = [], errors = [];
let onAudio = null, curResp = null;
ws.onmessage = (m) => {
  const e = JSON.parse(m.data);
  if (e.type === "error") { errors.push(e.error); say("ERROR", JSON.stringify(e.error).slice(0, 300)); }
  if (e.type === "response.output_audio.delta" && curResp) {
    if (curResp.ttfa === null) curResp.ttfa = Math.round(performance.now() - curResp.t0);
    curResp.audioBytes += Buffer.from(e.delta, "base64").length;
  }
  if (e.type === "response.output_item.added" && curResp && e.item?.role === "assistant") curResp.itemId = e.item.id;
  for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred(e)) { waiters[i].res(e); waiters.splice(i, 1); }
};
const waitFor = (pred, ms = 60_000) => new Promise((res, rej) => {
  const w = { pred, res }; waiters.push(w);
  setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); rej(new Error("timeout waiting")); } }, ms);
});
const send = (o) => ws.send(JSON.stringify(o));
await new Promise((r, j) => { ws.onopen = r; ws.onerror = (e) => j(new Error("ws " + e.message)); });
const created = await waitFor((e) => e.type === "session.created");

// ── director setup (real kit, real state machine) ──
const teacher = CHARACTERS.arjun;
const brief = { firstName: "Riya", classLevel: 6, ageBand: "10-15", languagePref: "hinglish", relationshipStage: "first_meeting",
  vibe: { pace: "steady", verbosity: "short", humour: "some" }, activeMisconceptions: [], interests: ["cats", "drawing"], recentWins: [], memoryCallbacks: [] };
const SEQ = topicSequence(6, "maths");
let topicIdx = SEQ.indexOf("c6-maths-ch07-t04");
let kit, state;
async function startTopic(first, nowMs) {
  kit = await getKit(SEQ[topicIdx], { generate: false });
  const topic = getTopic(kit.topicId);
  const s0 = initLessonState({ topicId: kit.topicId, kit, seed: 1000 + +RUN, now: 0,
    ctx: { firstName: "Riya", teacherName: teacher.name, teacherId: "arjun", protege: teacher.protege, ageBand: "10-15", lang: "hinglish",
      interests: brief.interests, firstMeeting: first, hasCallback: false, topicTitle: topic.title, nextTitle: getTopic(SEQ[topicIdx + 1])?.title } });
  const r = step(s0, { event: "start", kit, now: nowMs });
  state = { ...r.state, brief, mode: "voice", kitVerified: kit.verified, kitHash: kit.hash };
  return r.move;
}

// Split compile() output: CORE+CHILD (stable) | per-turn sections (LESSON NOW onward).
const splitIns = (t) => { const i = t.indexOf("\n\nLESSON NOW"); return [t.slice(0, i), t.slice(i + 2)]; };
let recap = "";
const withRecap = (t) => recap ? t.replace("\n\nLESSON NOW", `\n- earlier this lesson (notes for you, not words to say): ${recap}\n\nLESSON NOW`) : t;

const sessionTd = null;
const baseSession = { type: "realtime", output_modalities: ["audio"],
  audio: { input: { format: { type: "audio/pcm", rate: 24000 }, turn_detection: sessionTd }, output: { voice: teacher.voice } } };
let firstMove = await startTopic(true, 0);
let ins0 = instructionsFor(state, kit, "voice");
send({ type: "session.update", session: { ...baseSession, instructions: TAIL ? splitIns(ins0)[0] : ins0 } });
const upd = await waitFor((e) => e.type === "session.updated");
rec({ kind: "session", arm: ARM, run: RUN, truncation: upd.session.truncation, expires_in_s: created.session.expires_at - Math.floor(Date.now() / 1000), model: upd.session.model });

// ── conversation bookkeeping ──
/** exchanges: { userId, asstId, childText, heardText, mode: "audio"|"text" } */
const ex = [];
const history = []; // for the child sim and the recap: {who, text} (heard text only)
let clockMs = 0, turn = 0, bargeIdx = 0, probeIdx = 0, sysItemId = null;
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

async function respond(instructions) {
  curResp = { t0: 0, ttfa: null, audioBytes: 0, itemId: null };
  let response;
  if (TAIL) {
    // per-turn sections ride in a system item at the END of the conversation; removed after the reply.
    const [, dyn] = splitIns(instructions);
    const id = `sys_${turn}_${crypto.randomBytes(3).toString("hex")}`;
    send({ type: "conversation.item.create", item: { id, type: "message", role: "system", content: [{ type: "input_text", text: dyn }] } });
    await waitFor((e) => (e.type === "conversation.item.added" || e.type === "conversation.item.created") && e.item?.id === id);
    sysItemId = id;
    curResp.t0 = performance.now();
    send({ type: "response.create", response: {} });
  } else {
    curResp.t0 = performance.now();
    send({ type: "response.create", response: { instructions } });
  }
  let done = await waitFor((e) => e.type === "response.done", 90_000);
  // A failed response (status_details logged) is retried as a real client would, up to 3 times; each failure is recorded.
  // inference_rate_limit_exceeded = the deployment's TPM quota (measured: 2 concurrent sessions hit it from ~min 13);
  // the lesson clock is simulated, so waiting out the limit costs wall time only. The turn is flagged `retried`.
  for (let a = 0; done.response.status === "failed" && a < 10; a++) {
    rec({ kind: "failed", turn, attempt: a, details: done.response.status_details });
    say("failed", JSON.stringify(done.response.status_details).slice(0, 300));
    await new Promise((r) => setTimeout(r, 5000 * (a + 1)));
    curResp = { t0: performance.now(), ttfa: null, audioBytes: 0, itemId: null };
    send({ type: "response.create", response: TAIL ? {} : { instructions } });
    done = await waitFor((e) => e.type === "response.done", 90_000);
  }
  response = done.response;
  const r = curResp; curResp = null;
  if (TAIL && sysItemId) { send({ type: "conversation.item.delete", item_id: sysItemId }); await waitFor((e) => e.type === "conversation.item.deleted" && e.item_id === sysItemId).catch(() => {}); sysItemId = null; }
  const out = (response.output || []).find((o) => o.role === "assistant");
  const transcript = (out?.content || []).map((c) => c.transcript ?? c.text ?? "").join(" ").trim();
  return { ...r, itemId: out?.id ?? r.itemId, transcript, usage: response.usage, status: response.status, audioMs: Math.round(r.audioBytes / 48), modalities: (out?.content || []).map((c) => c.type) };
}

async function makeRecap(dropped) {
  const lines = dropped.map((x) => `child: ${x.childText}\nteacher (heard): ${x.heardText}`).join("\n");
  const sys = "You keep a tutor's private running notes of a live lesson. Merge the OLD NOTES with the NEW EXCHANGES into updated notes. Output terse note fragments separated by semicolons, at most 70 words, third person, no quotation marks, no sentences the tutor could read aloud. Keep: facts the child shared about herself (names, pets, things she likes), what was covered and in what order, where she was confused or what she got right, any open thread. Drop chit-chat. Only what was actually said.";
  const { text } = await chat(DEPLOY.fast, [{ role: "system", content: sys }, { role: "user", content: `OLD NOTES: ${recap || "(none)"}\n\nNEW EXCHANGES:\n${lines}` }], { maxTokens: 600, effort: "low" });
  return text.trim().replace(/["“”]/g, "").replace(/\s+/g, " ");
}

async function manageContext() {
  const live = ex.filter((x) => x.mode === "audio");
  if ((ARM === "B" || ARM === "F") && ex.length >= KEEP_MAX) {
    const drop = ex.splice(0, ex.length - KEEP_MIN);
    for (const x of drop) for (const id of [x.userId, x.asstId]) if (id) {
      send({ type: "conversation.item.delete", item_id: id });
      await waitFor((e) => (e.type === "conversation.item.deleted" && e.item_id === id) || (e.type === "error"), 15_000).catch(() => {});
    }
    recap = await makeRecap(drop);
    if (ARM === "F") { // the recap row joins the CHILD block of the stable session prefix; the prune has just busted the item cache anyway
      send({ type: "session.update", session: { type: "realtime", instructions: `${splitIns(ins0)[0]}\n- earlier this lesson (notes for you, not words to say): ${recap}` } });
      await waitFor((e) => e.type === "session.updated" || e.type === "error", 15_000).catch(() => {});
    }
    rec({ kind: "prune", turn, clockMin: clockMs / 60000, dropped: drop.length, recap, recapTok: Math.ceil(recap.length / 3.5) });
  }
  if ((ARM === "C" || ARM === "D") && live.length >= KEEP_MAX) {
    const conv = live.slice(0, live.length - KEEP_MIN);
    let ok = 0;
    for (const x of conv) {
      for (const [role, id, text] of [["user", x.userId, x.childText], ["assistant", x.asstId, x.heardText]]) {
        if (!id) continue;
        const nid = `txt_${id.slice(-12)}_${role[0]}`.slice(0, 32);
        const content = role === "user" ? [{ type: "input_text", text }] : [{ type: "output_text", text }];
        send({ type: "conversation.item.create", previous_item_id: id, item: { id: nid, type: "message", role, content } });
        const ack = await waitFor((e) => ((e.type === "conversation.item.added" || e.type === "conversation.item.created") && e.item?.id === nid) || e.type === "error", 15_000).catch(() => null);
        if (ack?.type === "error") { say("replace error", JSON.stringify(ack.error).slice(0, 200)); continue; }
        send({ type: "conversation.item.delete", item_id: id });
        await waitFor((e) => (e.type === "conversation.item.deleted" && e.item_id === id) || e.type === "error", 15_000).catch(() => {});
        if (role === "user") x.userId = nid; else x.asstId = nid;
        ok++;
      }
      x.mode = "text";
    }
    rec({ kind: "replace", turn, clockMin: clockMs / 60000, exchanges: conv.length, items: ok });
  }
}

// ── the lesson ──
let move = firstMove, instructions = ins0;
// The teacher opens (greet) — the director's start move.
let first = await respond(instructions);
rec({ kind: "turn", turn, clockMin: 0, child: null, move: move.kind, ...pick(first) });
history.push({ who: "teacher", text: first.transcript });
ex.push({ userId: null, asstId: first.itemId, childText: "", heardText: first.transcript, mode: "audio" });
clockMs += first.audioMs + 1500;
let lastTeacher = first;

function pick(r) {
  const u = r.usage || {}, d = u.input_token_details || {}, c = d.cached_tokens_details || {};
  return { ttfa: r.ttfa, words: words(r.transcript), teacher: r.transcript, status: r.status, audioMs: r.audioMs, modalities: r.modalities,
    inTok: u.input_tokens, inText: d.text_tokens, inAudio: d.audio_tokens, cached: d.cached_tokens, cachedText: c.text_tokens, cachedAudio: c.audio_tokens,
    outTok: u.output_tokens, outText: u.output_token_details?.text_tokens, outAudio: u.output_token_details?.audio_tokens };
}

while (clockMs < MINUTES * 60_000) {
  turn++;
  const min = clockMs / 60000;
  // barge-in on the teacher turn just spoken?
  let barge = null;
  if (bargeIdx < BARGE_AT.length && min >= BARGE_AT[bargeIdx] && lastTeacher.audioMs > 2500 && lastTeacher.itemId) {
    bargeIdx++;
    const cut = Math.floor(lastTeacher.audioMs * 0.4);
    send({ type: "conversation.item.truncate", item_id: lastTeacher.itemId, content_index: 0, audio_end_ms: cut });
    const tr = await waitFor((e) => e.type === "conversation.item.truncated" || e.type === "error", 15_000).catch(() => null);
    const w = lastTeacher.transcript.split(/\s+/);
    const k = Math.max(1, Math.round(w.length * 0.4));
    const heard = w.slice(0, k).join(" "), unheard = w.slice(k).join(" ");
    barge = { cut, heard, unheard, ack: tr?.type };
    history[history.length - 1] = { who: "teacher", text: heard };
    const last = ex[ex.length - 1]; if (last) last.heardText = heard;
    clockMs -= lastTeacher.audioMs - cut;
    rec({ kind: "barge", turn, clockMin: clockMs / 60000, ...barge });
  }
  // child line: a scripted probe when due, else the sim
  let probe = null, childText;
  if (!barge && probeIdx < PROBES.length && min >= PROBES[probeIdx].at) { probe = PROBES[probeIdx++]; childText = probe.text; }
  else childText = await childSays(history, !!barge);
  const pcm = await ttsPcm(childText);
  const childMs = Math.round(pcm.length / 48);
  // upload faster than real time, then commit (turn detection off)
  for (let off = 0; off < pcm.length; off += 48000) send({ type: "input_audio_buffer.append", audio: pcm.subarray(off, off + 48000).toString("base64") });
  send({ type: "input_audio_buffer.commit" });
  // director: the turn as heard (transcript = the TTS text; the ASR lane is out of scope here)
  state.moveVoiced = true;
  const heardTeacher = history.at(-1)?.text ?? "";
  const activeItem = state.activeItemId ? kit.items.find((i) => i.id === state.activeItemId) : null;
  const [committed, cls] = await Promise.all([
    waitFor((e) => e.type === "input_audio_buffer.committed", 20_000),
    classify({ target: targetFor(state, kit, activeItem), childText, heard: heardTeacher, asrConfidence: 0.9, typed: false, classLevel: 6 }).catch(() => null),
  ]);
  clockMs += childMs + 900;
  const nowMs = clockMs;
  let r = step(state, { event: "turn", kit, cls: cls ?? undefined, answer: childText.toLowerCase(), now: nowMs });
  let topicSwitch = false;
  // The Conductor's job, simulated: a finished topic chains to the next one in the class sequence (cyclic).
  if ((r.end || r.move.kind === "wrap") && clockMs < MINUTES * 60_000) {
    topicIdx = (topicIdx + 1) % SEQ.length; topicSwitch = true;
    move = await startTopic(false, nowMs);
    state.startedAt = 0; state.minutes = Math.round(nowMs / 6000) / 10;
  } else { state = { ...r.state, brief }; move = r.move; }
  instructions = instructionsFor(state, kit, "voice");
  if (ARM === "B") instructions = withRecap(instructions);
  ex.push({ userId: committed.item_id, asstId: null, childText, heardText: "", mode: "audio" });
  history.push({ who: "child", text: childText });
  const resp = await respond(instructions);
  ex[ex.length - 1].asstId = resp.itemId; ex[ex.length - 1].heardText = resp.transcript;
  history.push({ who: "teacher", text: resp.transcript });
  rec({ kind: "turn", turn, clockMin: +(clockMs / 60000).toFixed(2), child: childText, childMs, probe: probe?.kind ?? null, afterBarge: !!barge,
    move: move.kind, topic: kit.topicId, topicSwitch, insTok: Math.ceil(instructions.length / 3.5), held: ex.length, heldAudio: ex.filter((x) => x.mode === "audio").length, ...pick(resp) });
  say(`t${turn} m${(clockMs / 60000).toFixed(1)} in=${resp.usage?.input_tokens} cached=${resp.usage?.input_token_details?.cached_tokens} ttfa=${resp.ttfa} w=${words(resp.transcript)} ${move.kind}`);
  clockMs += (resp.ttfa ?? 1000) + resp.audioMs + 1500;
  lastTeacher = resp;
  await manageContext();
}
rec({ kind: "end", turns: turn, clockMin: clockMs / 60000, errors });
say("done", turn, "turns", errors.length, "errors");
ws.close(); console.info = quiet; process.exit(0);
