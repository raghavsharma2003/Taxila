import WebSocket from "ws";
const E = process.env.AZURE_OPENAI_ENDPOINT, host = new URL(E).host;
const mint = async (sec) => { const r = await fetch(`${E}/realtime/client_secrets`, { method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ expires_after: { anchor: "created_at", seconds: sec }, session: { type: "realtime", model: "taxila-realtime", instructions: "Reply with one word.", output_modalities: ["text"] } }) });
  const j = await r.json(); return { status: r.status, value: j.value, expires_at: j.expires_at, created: Math.floor(Date.now()/1000), err: j.error?.message }; };
const open = (ek) => new Promise((res) => { const ws = new WebSocket(`wss://${host}/openai/v1/realtime?model=taxila-realtime`, { headers: { Authorization: `Bearer ${ek}` } });
  ws.on("open", () => res({ ok: true, ws })); ws.on("unexpected-response", (_q, r) => res({ ok: false, status: r.statusCode })); ws.on("error", (e) => res({ ok: false, err: String(e) })); });
const ask = (ws) => new Promise((res) => { const t = setTimeout(() => res("timeout"), 15000); ws.on("message", (m) => { const e = JSON.parse(m); if (e.type === "response.done") { clearTimeout(t); res(e.response.status); } if (e.type==="error") { clearTimeout(t); res("error "+e.error.message);} });
  ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: "hi" }] } })); ws.send(JSON.stringify({ type: "response.create" })); });
for (let trial = 0; trial < 3; trial++) {
  const k = await mint(10); console.log("mint", k.status, "ttl", k.expires_at - k.created, k.err ?? "");
  const a = await open(k.value); console.log(" open before expiry:", a.ok, a.status ?? "");
  if (!a.ok) continue;
  await new Promise((r) => setTimeout(r, 20000));
  console.log(" 20 s after mint (expired), same session answers:", await ask(a.ws));
  const b = await open(k.value); console.log(" new connection with expired key:", b.ok, b.status ?? b.err ?? "");
  a.ws.close(); b.ws?.close?.();
}
const big = await mint(7200); console.log("max ttl mint", big.status, big.expires_at - big.created); const over = await mint(7201); console.log("over max", over.status, over.err);
