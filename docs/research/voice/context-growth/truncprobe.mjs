// G2 (a): what the Azure GA realtime endpoint does with each documented `truncation` value on taxila-realtime and
// gpt-realtime-2.1-mini. session.update only (no responses, no cost). Records the echoed session.truncation or the error.
const ep = process.env.AZURE_OPENAI_ENDPOINT.replace(/^https/, "wss").replace(/\/$/, "");
const VALUES = { auto: "auto", disabled: "disabled", rr05: { type: "retention_ratio", retention_ratio: 0.5 },
  rr05_tl: { type: "retention_ratio", retention_ratio: 0.5, token_limits: { post_instructions: 8000 } } };
const out = [];
for (const model of ["taxila-realtime", "gpt-realtime-2.1-mini"]) for (const [k, v] of Object.entries(VALUES)) {
  const r = await new Promise((res) => {
    const ws = new WebSocket(`${ep}/realtime?model=${model}`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
    const t = setTimeout(() => { res({ timeout: true }); ws.close(); }, 15000);
    ws.onmessage = (m) => { const e = JSON.parse(m.data);
      if (e.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", truncation: v } }));
      else if (e.type === "session.updated" || e.type === "error") { clearTimeout(t); res({ event: e.type, truncation: e.session?.truncation, error: e.error?.message }); ws.close(); } };
    ws.onerror = (e) => { clearTimeout(t); res({ wsError: e.message }); };
  });
  out.push({ model, sent: k, ...r }); console.log(JSON.stringify(out.at(-1)));
}
(await import("fs")).writeFileSync(new URL("truncprobe.results.json", import.meta.url), JSON.stringify({ date: "2026-10-02", out }, null, 1));
process.exit(0);
