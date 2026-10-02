import WebSocket from "ws";
const E = process.env.AZURE_OPENAI_ENDPOINT, host = new URL(E).host;
const mint = async (sec) => (await (await fetch(`${E}/realtime/client_secrets`, { method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ expires_after: { anchor: "created_at", seconds: sec }, session: { type: "realtime", model: "taxila-realtime", instructions: "Reply with one word.", output_modalities: ["text"] } }) })).json()).value;
const run = (ek, label) => new Promise((res) => { const ws = new WebSocket(`wss://${host}/openai/v1/realtime?model=taxila-realtime`, { headers: { Authorization: `Bearer ${ek}` } });
  const ev = []; const t = setTimeout(() => { ws.close(); res(label + " TIMEOUT events=" + ev.join(",")); }, 15000);
  ws.on("open", () => { ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: "hi" }] } })); ws.send(JSON.stringify({ type: "response.create" })); });
  ws.on("message", (m) => { const e = JSON.parse(m); ev.push(e.type); if (e.type === "error") { clearTimeout(t); ws.close(); res(label + " ERROR " + e.error.message); } if (e.type === "response.done") { clearTimeout(t); ws.close(); res(label + " OK " + e.response.status + " instr-from-key=" + ev.includes("session.created")); } });
  ws.on("unexpected-response", (_q, r) => { clearTimeout(t); res(label + " HTTP " + r.statusCode); });
  ws.on("close", (c, r) => { ev.push("close:" + c + ":" + r); });
});
for (let i = 0; i < 3; i++) {
  const k = await mint(10);
  console.log(await run(k, "fresh"));
  console.log(await run(k, "reuse-while-valid"));
  await new Promise((r) => setTimeout(r, 15000));
  console.log(await run(k, "after-expiry"));
}
