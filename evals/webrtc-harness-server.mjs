import http from "http"; import fs from "fs";
const E = process.env.AZURE_OPENAI_ENDPOINT, K = process.env.AZURE_OPENAI_API_KEY;
const MODEL = process.env.RT_MODEL || "taxila-realtime";
http.createServer(async (req, res) => {
  if (req.url === "/token") {
    const vad = process.env.VAD === "server"
      ? { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900, create_response: false, interrupt_response: true }
      : { type: "semantic_vad", eagerness: "low", create_response: false, interrupt_response: true };
    const r = await fetch(`${E}/realtime/client_secrets`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" },
      body: JSON.stringify({ session: { type: "realtime", model: MODEL, output_modalities: ["audio"],
        audio: { input: { noise_reduction: { type: "near_field" }, transcription: { model: process.env.STT || "taxila-transcribe" }, turn_detection: vad },
                 output: { voice: "marin" } } } }) });
    const j = await r.json(); res.writeHead(r.status, { "content-type": "application/json" });
    return res.end(JSON.stringify({ token: j.value, raw: r.ok ? undefined : j, base: E }));
  }
  res.writeHead(200, { "content-type": "text/html" }); res.end(fs.readFileSync("web/index.html"));
}).listen(8787, () => console.log("up"));
