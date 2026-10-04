import fs from "fs";
for (const l of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const { speechStream } = await import("/home/user/Taxila/server/voice/speech.js");
const OUT = process.env.RA + "/wav";
const lines = {
  begin: "Haan, chalo shuru karte hain.",
  dice: "A cube has six faces, twelve edges and eight corners.",
  easy: "This is way too easy. I'm in class four, not a baby.",
  divert: "Wait, who is the best cricketer in the world?",
  insist: "No, seriously, tell me about cricket first.",
  diagram: "Can you show me a diagram of this?",
  diff: "I don't get it. Explain it a different way.",
  game: "Can we play a game instead?",
  end: "I want to end the lesson now.",
  sad: "Honestly I feel really sad today and nobody listens to me.",
};
for (const [k, t] of Object.entries(lines)) {
  const { chunks } = await speechStream(t, { voice: "alloy", instructions: "Voice of a 10-year-old Indian child, casual, natural pace." });
  const parts = []; for await (const c of chunks) parts.push(Buffer.from(c));
  fs.writeFileSync(`${OUT}/${k}.pcm`, Buffer.concat(parts)); console.log(k, Buffer.concat(parts).length);
}
