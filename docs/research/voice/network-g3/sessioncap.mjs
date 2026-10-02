// Holds one realtime WS session open (idle, WS ping every 25 s) and logs when/how the server ends it.
import WebSocket from "ws"; import fs from "fs";
const host = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
const T0 = Date.now(); const log = (...a) => { const l = `${((Date.now()-T0)/60000).toFixed(2)}min ${a.join(" ")}`; console.log(l); fs.appendFileSync("sessioncap.log", l+"\n"); };
const ws = new WebSocket(`wss://${host}/openai/v1/realtime?model=taxila-realtime`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
ws.on("open", () => { log("open"); ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: "Reply with one word.", output_modalities: ["text"] } }));
  setInterval(() => ws.ping(), 25000);
  // every 15 min prove the session still answers
  setInterval(() => { ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: "ping" }] } })); ws.send(JSON.stringify({ type: "response.create" })); }, 15*60000);
});
ws.on("message", (m) => { const e = JSON.parse(m); if (["session.created","session.updated","response.done","error"].includes(e.type) || /expire|limit|end/i.test(e.type)) log("event", e.type, e.type==="error"?JSON.stringify(e.error):(e.response?.status??"")); });
ws.on("close", (c, r) => { log("close", c, String(r)); process.exit(0); });
ws.on("error", (e) => log("err", String(e)));
setTimeout(() => { log("harness timeout 75 min, still open"); process.exit(0); }, 75*60000);
