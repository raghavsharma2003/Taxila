// GET /api/duplex/config: the hands-free duplex kill switch at RUNTIME (p1-duplex, owner-ship-five-2026-10-05). Ships ON.
//   TAXILA_DUPLEX=0 | off      → { duplex: "off" }    every lesson not yet started uses today's cascade path (tap-to-talk);
//   TAXILA_DUPLEX=shadow       → { duplex: "shadow" } the engine runs beside today's path and only logs;
//   unset / 1 / on             → { duplex: "on" }.
// No auth (it carries no data, like /api/face/config); the client fails OPEN to its build default if this is missing or slow.
// Registered by docs/design/ship5/p1-duplex/patches/04-server-duplex-config.diff (server/index.js is a shared hot file).
export function duplexMode(env = process.env) {
  const v = String(env.TAXILA_DUPLEX ?? "").trim().toLowerCase();
  if (v === "0" || v === "off" || v === "false") return "off";
  if (v === "shadow") return "shadow";
  return "on";
}

export const duplexConfigRoutes = {
  "GET /api/duplex/config": async (_req, res) => {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify({ duplex: duplexMode() }));
  },
};
