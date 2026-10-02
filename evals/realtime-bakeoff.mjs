// Realtime bake-off with a TEACHER prompt (text-in → audio-out), per companion-tech.md §11.3 ask.
// Measures time-to-first-audio and words/turn for each deployment over a fixed set of child turns.
import WebSocket from "ws";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const HOST = "raghavsharma1729-compan-resource.openai.azure.com";
const models = (process.argv[2] || "taxila-realtime,gpt-realtime-2.1-mini").split(",");

const INSTR = `You are Asha Didi, a warm Hinglish-speaking teacher for a 10-year-old in class 5 (CBSE).
You are on a live voice call. Speak the way a real teacher talks to one child: short turns —
one idea, then hand the floor back with a small question or a "try this". Never more than two
or three short sentences before letting the child speak. Natural Hinglish, simple words.
Current topic: fractions — what 3/4 means.
${process.env.ARM==="B" ? `
LAST AND MOST IMPORTANT — turn shape: max 25 words per turn. One idea. Then stop and let the child talk. A turn that explains two things is a failed turn.` : ""}`;

const TURNS = [
  "Didi mujhe fractions samajh nahi aate.",
  "Matlab 3/4 mein 3 upar kyun hai?",
  "Haan pizza ke 4 piece... aur maine 3 kha liye?",
  "To 3/4 bada hai ya 2/3?",
  "Ummm... pata nahi. 2/3 kyunki 2 chhota hai?",
  "Achha thik hai. Ek aur example do na.",
];

function run(model) {
  return new Promise((resolve) => {
    const url = `wss://${HOST}/openai/v1/realtime?model=${model}`;
    const ws = new WebSocket(url, { headers: { "api-key": KEY } });
    const out = [];
    let i = -1, t0 = 0, ttfa = null, text = "";
    const next = () => {
      i++;
      if (i >= TURNS.length) { ws.close(); return resolve({ model, out }); }
      ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: TURNS[i] }] } }));
      t0 = performance.now(); ttfa = null; text = "";
      ws.send(JSON.stringify(process.env.ARM==="B" ? { type: "response.create", response: { instructions: INSTR + "\nThis turn: respond to what the child just said in at most 25 words, ending with a question or a try-this." } } : { type: "response.create" }));
    };
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "session.update", session: {
        type: "realtime", instructions: INSTR, output_modalities: ["audio"],
        audio: { output: { voice: "marin" } } } }));
    });
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.updated" && i === -1) next();
      else if (ev.type === "response.output_audio.delta" && ttfa === null) ttfa = performance.now() - t0;
      else if (ev.type === "response.output_audio_transcript.delta") text += ev.delta;
      else if (ev.type === "response.done") {
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        out.push({ turn: TURNS[i], ttfa: Math.round(ttfa ?? -1), total: Math.round(performance.now() - t0), words, text: text.trim() });
        next();
      } else if (ev.type === "error") { out.push({ error: ev.error }); ws.close(); resolve({ model, out }); }
    });
    ws.on("error", (e) => resolve({ model, out, err: String(e) }));
    ws.on("unexpected-response", (_q, res) => resolve({ model, out, err: `HTTP ${res.statusCode}` }));
  });
}

for (const m of models) {
  const r = await run(m);
  console.log(`\n=== ${m} ${r.err ?? ""}`);
  for (const o of r.out) console.log(o.error ? JSON.stringify(o.error) : `ttfa=${o.ttfa}ms total=${o.total}ms words=${o.words} :: ${o.text}`);
  const ok = r.out.filter((o) => !o.error);
  if (ok.length) {
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
    console.log(`SUMMARY ${m}: median ttfa ${med(ok.map((o) => o.ttfa))}ms, median words ${med(ok.map((o) => o.words))}, max words ${Math.max(...ok.map((o) => o.words))}`);
  }
}
