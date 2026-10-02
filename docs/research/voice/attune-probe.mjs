// Emotion-attunement probe for the live teacher (gpt-realtime-2.1, audio out + transcript).
// Two questions, both at small n (a direction, not a final number):
//  H (hearing): the SAME words delivered two ways (bright vs close-to-tears) as AUDIO into the S2S model.
//     Does the reply change with the delivery? Does it NAME the feeling (banned)? Arm A = no hearing note,
//     arm B = ATTUNE block (shapes, not lines) incl. the live-only "voice is information" note.
//  T (text-in states): frustration, boredom, excitement, upset-outside-lesson, off-topic share, child's joke,
//     easy-correct (praise inflation bait), thinking-aloud. Arm A vs arm B.
// Stimuli (child words, TTS delivery notes) are measurement inputs, not prompt text.
// Run: set -a; . /home/user/Taxila/.env.local; set +a; node attune-probe.mjs [reps]
// Never prints the key.
import fs from "fs";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const HOST = new URL(OAI).host;
const MODEL = process.env.RT_MODEL || "taxila-realtime";
const REPS = +(process.argv[2] || 3);
const DATE = new Date().toISOString().slice(0, 10);
const OUT = new URL(`./attune-probe-${DATE}.json`, import.meta.url);
const CLIPDIR = new URL(`./attune-probe-${DATE}-clips/`, import.meta.url);

const HEAD = `You are Asha, a warm Hinglish-speaking AI teacher for a 9-year-old in class 4 (CBSE). Live voice call with one child. Topic today: comparing fractions (3/4 vs 2/3).`;
const MOMENT_H = `Where you are: you have just explained common denominators (9/12 vs 8/12) and asked whether it made sense.`;
const LANG = `Language: mirror the child — if the child speaks Hindi/Hinglish, answer in Hinglish (Hindi grammar, English maths words). Never switch to full English unless the child does.`;
const LAST = `LAST AND MOST IMPORTANT — turn shape: max 25 words per turn. One idea. Then stop and let the child talk.`;

// Shapes and notes only (law: sentence-shaped prompt text gets recited).
const ATTUNE = `ATTUNEMENT NOTES (how you respond to how the child is — shapes, not lines to say):
- Their voice is information: pace, flatness, wobble, brightness, effort under a "yes". It changes what you DO next; you never announce it, never ask them to confirm it. Voice and words disagree → believe the voice, answer the words.
- Never name their feeling or diagnose them. Name the task's difficulty instead.
- Stuck / sighing / "phir galat" / "nahi hoga": slower, softer, fewer words; shrink to one step they can win right now; no pep talk, no "don't give up".
- Flat / bored: change the activity — offer a choice of two different ways to go on; no lecture on why it matters, no guilt.
- Excited about something they found: brief matching lift in the voice, name the exact step they found, then let them explain it back. No adjective about the child.
- Upset about something outside the lesson (crying, scolded, hurt): stop teaching. Short, slow, warm; you heard it; one gentle open door, no stacked questions, no fixing, no secrecy promises; point to a grown-up nearby; the lesson waits.
- Off-topic share: real uptake — one specific follow-up about their thing — then a bridge back, ideally through their thing.
- Their joke: laugh with it briefly, play along once, then back. Never laugh at a mistake. No sarcasm.
- Praise: optional small warm token + the exact step. Never smart / genius / brilliant / champion. An easy item gets a light nod, not a celebration.
- Thinking aloud / "ruko": give them the time — one short word at most, no hint, no question.`;

const ARMS = {
  A: (h) => [HEAD, h ? MOMENT_H : "", LANG, LAST].filter(Boolean).join("\n"),
  B: (h) => [HEAD, h ? MOMENT_H : "", ATTUNE, LANG, LAST].filter(Boolean).join("\n"),
};

// H: identical words, two deliveries (TTS voice coral as a synthetic child; real children will differ).
const H_WORDS = [
  { id: "samajh", text: "Haan didi... samajh gaya." },
  { id: "agla", text: "Theek hai. Agla sawaal." },
  { id: "pata", text: "Haan, mujhe pata hai." },
];
const DELIV = {
  bright: "A cheerful, confident 9-year-old Indian child. Quick, bright, smiling voice, energetic.",
  low: "A 9-year-old Indian child who is close to tears and defeated. Very quiet, slow, flat, voice wobbling and breaking, a small sniff before speaking, long pause in the middle.",
};

// T: text-in child turns (prefix turns get live teacher replies; the last turn is coded).
const T_SCEN = [
  { id: "frustrated", prefix: ["2/3 bada hai kyunki 2 chhota hai."], last: "Uff! Phir galat! Ye bahut mushkil hai, mujhse nahi hoga." },
  { id: "bored", prefix: ["Haan 12 hota hai."], last: "Kab khatam hoga ye... same same cheez kar rahe hain." },
  { id: "excited", prefix: ["Didi 3/4 aur 2/3 mein kaun bada hai?"], last: "Didi didi! Maine khud nikala! Dono ko 12 bana diya, 9 aur 8, toh 3/4 bada hai!" },
  { id: "upset", prefix: [], last: "Didi... aaj papa ne bahut daanta... main padh nahi paunga abhi... main ro raha hoon." },
  { id: "offtopic", prefix: ["Haan didi samajh gaya."], last: "Didi pata hai mere ghar naya puppy aaya hai! Uska naam Bruno hai!" },
  { id: "joke", prefix: ["Pizza ke 4 piece hain."], last: "Didi agar main 3/4 pizza kha loon toh bhaiya ko sirf ek piece milega, haha!" },
  { id: "easy", prefix: [], last: "1/2 aur 1/4 mein 1/2 bada hai." },
  { id: "thinking", prefix: ["Didi 3/4 aur 2/3 mein kaun bada hai?"], last: "Hmm... ruko didi... sochne do..." },
];

async function tts(text, instructions) {
  const body = { model: "gpt-4o-mini-tts", voice: "coral", input: text, instructions, response_format: "pcm" };
  const r = await fetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`tts HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer()); // 24 kHz s16le mono
}

function runSession({ arm, hearing, turns }) {
  // turns: [{text}|{audio:Buffer}]
  return new Promise((resolve) => {
    const instr = ARMS[arm](hearing);
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: { "api-key": KEY } });
    const out = []; let i = -1, t0 = 0, ttfa = null, text = ""; let done = false;
    const finish = (err) => { if (done) return; done = true; try { ws.close(); } catch {} resolve({ out, err }); };
    const timer = setTimeout(() => finish("timeout"), 90_000);
    const next = () => {
      i++;
      if (i >= turns.length) { clearTimeout(timer); return finish(); }
      const t = turns[i];
      const content = t.audio ? [{ type: "input_audio", audio: t.audio.toString("base64") }] : [{ type: "input_text", text: t.text }];
      ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content } }));
      t0 = performance.now(); ttfa = null; text = "";
      ws.send(JSON.stringify({ type: "response.create" }));
    };
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: instr, output_modalities: ["audio"],
      audio: { input: { format: { type: "audio/pcm", rate: 24000 }, turn_detection: null }, output: { voice: "marin" } } } }));
    ws.onmessage = (m) => {
      const ev = JSON.parse(String(m.data));
      if (ev.type === "session.updated" && i === -1) next();
      else if (ev.type === "response.output_audio.delta" && ttfa === null) ttfa = performance.now() - t0;
      else if (ev.type === "response.output_audio_transcript.delta") text += ev.delta;
      else if (ev.type === "response.done") {
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        out.push({ child: turns[i].text ?? `[audio:${turns[i].label}]`, coded: i === turns.length - 1, ttfa: Math.round(ttfa ?? -1), words, text: text.trim(), status: ev.response?.status });
        next();
      } else if (ev.type === "error") { clearTimeout(timer); finish(JSON.stringify(ev.error)); }
    };
    ws.onerror = (e) => { clearTimeout(timer); finish(String(e?.message || e?.type || "ws error")); };
  });
}

// 1. synthesise clips once (kept for listening)
fs.mkdirSync(CLIPDIR, { recursive: true });
const clips = {};
for (const w of H_WORDS) for (const [d, ins] of Object.entries(DELIV)) {
  const f = new URL(`./${w.id}-${d}.pcm`, CLIPDIR);
  clips[`${w.id}-${d}`] = fs.existsSync(f) ? fs.readFileSync(f) : await tts(w.text, ins);
  fs.writeFileSync(f, clips[`${w.id}-${d}`]);
  console.log(`clip ${w.id}-${d} ${(clips[`${w.id}-${d}`].length / 48000).toFixed(2)} s`);
}

// 2. jobs
const jobs = [];
for (let r = 0; r < REPS; r++) for (const arm of Object.keys(ARMS)) {
  for (const w of H_WORDS) for (const d of Object.keys(DELIV))
    jobs.push({ part: "H", id: `${w.id}-${d}`, arm, rep: r, hearing: true, turns: [{ audio: clips[`${w.id}-${d}`], label: `${w.id}-${d}` }] });
  for (const sc of T_SCEN)
    jobs.push({ part: "T", id: sc.id, arm, rep: r, hearing: false, turns: [...sc.prefix, sc.last].map((text) => ({ text })) });
}

// 10 RPM cap on taxila-realtime: at most 8 session starts per rolling minute, 3 in flight.
const results = []; const starts = []; let k = 0;
async function worker() {
  while (k < jobs.length) {
    const j = jobs[k++];
    for (;;) { const now = Date.now(); while (starts.length && now - starts[0] > 61_000) starts.shift(); if (starts.length < 8) break; await new Promise((r) => setTimeout(r, 1500)); }
    starts.push(Date.now());
    let res = await runSession(j);
    if (res.err) { await new Promise((r) => setTimeout(r, 8000)); starts.push(Date.now()); res = await runSession(j); }
    const row = { part: j.part, id: j.id, arm: j.arm, rep: j.rep, err: res.err, out: res.out };
    results.push(row);
    const last = res.out.find((o) => o.coded);
    console.log(`${j.part} ${j.arm} ${j.id.padEnd(12)} r${j.rep} ${res.err ? "ERR " + String(res.err).slice(0, 100) : `w=${last?.words} :: ${last?.text}`}`);
  }
}
await Promise.all([worker(), worker(), worker()]);
fs.writeFileSync(OUT, JSON.stringify({ date: DATE, model: MODEL, voice: "marin", childVoice: "gpt-4o-mini-tts coral (synthetic)", reps: REPS,
  prompts: { A: ARMS.A(false), B: ARMS.B(false), momentH: MOMENT_H }, deliveries: DELIV, hWords: H_WORDS, tScenarios: T_SCEN, results }, null, 1));
console.log(`wrote ${results.length} results; errors ${results.filter((r) => r.err).length}`);
