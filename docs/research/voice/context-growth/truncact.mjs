// G2 (a) part 2: does an accepted `truncation` value ACT on Azure? Text-only: 40 user text items (~6k tokens of
// filler) then one text response; compare usage.input_tokens across truncation values. A cap that acts shows
// input_tokens near post_instructions + instructions; one that is echoed but ignored shows the full ~6k.
const ep = process.env.AZURE_OPENAI_ENDPOINT.replace(/^https/, "wss").replace(/\/$/, "");
const filler = (i) => `Note ${i}: ` + Array.from({ length: 110 }, (_, k) => `word${(i * 131 + k) % 997}`).join(" ");
const VALUES = { auto: "auto", rr_tl1500: { type: "retention_ratio", retention_ratio: 0.5, token_limits: { post_instructions: 1500 } },
  rr_tl3000: { type: "retention_ratio", retention_ratio: 1.0, token_limits: { post_instructions: 3000 } } };
const out = [];
for (const model of ["taxila-realtime"]) for (const [k, v] of Object.entries(VALUES)) {
  const r = await new Promise((res) => {
    const ws = new WebSocket(`${ep}/realtime?model=${model}`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
    const t = setTimeout(() => { res({ timeout: true }); ws.close(); }, 60000);
    let n = 0;
    ws.onmessage = (m) => { const e = JSON.parse(m.data);
      if (e.type === "error") console.log("err", e.error?.message);
      if (e.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", output_modalities: ["text"], instructions: "Reply with the single word ok.", truncation: v } }));
      if (e.type === "session.updated") { for (let i = 0; i < 40; i++) ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: filler(i) }] } }));
        ws.send(JSON.stringify({ type: "response.create", response: { max_output_tokens: 20 } })); }
      if (e.type === "response.done") { clearTimeout(t); res({ status: e.response.status, usage: e.response.usage?.input_tokens, details: e.response.usage?.input_token_details }); ws.close(); } };
  });
  out.push({ model, sent: k, ...r }); console.log(JSON.stringify(out.at(-1)));
}
(await import("fs")).writeFileSync(new URL("truncact.results.json", import.meta.url), JSON.stringify({ date: "2026-10-02", out }, null, 1));
process.exit(0);
