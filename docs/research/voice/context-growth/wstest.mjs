const ep = process.env.AZURE_OPENAI_ENDPOINT.replace(/^https/, "wss").replace(/\/$/, "");
const ws = new WebSocket(`${ep}/realtime?model=taxila-realtime`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
ws.onopen = () => { console.log("open"); ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", truncation: { type: "retention_ratio", retention_ratio: 0.5, token_limits: { post_instructions: 60000 } } } })); };
ws.onmessage = (m) => { const e = JSON.parse(m.data); console.log(e.type, JSON.stringify(e.session?.truncation ?? e.error ?? "").slice(0, 300), e.session?.expires_at ?? "", e.session?.max_output_tokens ?? ""); if (e.type !== "session.created") { ws.close(); } };
ws.onerror = (e) => console.log("err", e.message);
ws.onclose = (e) => { console.log("close", e.code); process.exit(0); };
