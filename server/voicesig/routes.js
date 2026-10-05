// GET /api/voicesig/config (the client's kill switch) and GET /api/voicesig/status (the status page's per-state table,
// VALUES-100 V2 item 3). No auth: neither answer holds child data. Seam: server/index.js registers `routes`
// (docs/design/ship5/p3-voicesig/patches/06-server-index.diff).
import { send } from "../http.js";
import { config, status } from "./lesson.js";

async function configRoute(_req, res) {
  send(res, 200, config(), { "cache-control": "public, max-age=60" });
}

async function statusRoute(_req, res) {
  send(res, 200, status(), { "cache-control": "public, max-age=60" });
}

export const routes = { "GET /api/voicesig/config": configRoute, "GET /api/voicesig/status": statusRoute };
