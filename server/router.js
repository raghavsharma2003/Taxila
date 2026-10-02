// One function, one router: Vercel Hobby caps functions per deployment, and one cold start beats twelve.
import { HttpError, readJson, send } from "./http.js";
import * as account from "./routes/account.js";

const ROUTES = {
  "POST /api/auth/signup": account.signup,
  "POST /api/auth/login": account.login,
  "POST /api/auth/logout": account.logout,
  "GET /api/me": account.me,
  "POST /api/consent": account.setConsent,
  "POST /api/children": account.createChild,
  "PATCH /api/children": account.updateChild,
  "DELETE /api/children": account.deleteChild,
  "GET /api/health": async (req, res) => {
    const out = { ok: true, at: new Date().toISOString(), driver: process.env.DB_DRIVER || "neon-http", revision: process.env.CONTAINER_APP_REVISION || null };
    if ((req.url || "").includes("db=1")) {       // DB round-trip probe: 5 sequential `select 1`
      const { q } = await import("./db.js");
      const ms = [];
      for (let i = 0; i < 5; i++) { const t0 = performance.now(); await q("select 1"); ms.push(Math.round(performance.now() - t0)); }
      out.dbMs = ms;
    }
    send(res, 200, out);
  },
};

export function register(table) { Object.assign(ROUTES, table); }

export async function handle(req, res) {
  const path = (req.url || "/").split("?")[0].replace(/\/+$/, "");
  const key = `${req.method} ${path}`;
  const fn = ROUTES[key];
  try {
    if (!fn) return send(res, 404, { error: `no route ${key}` });
    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) ? await readJson(req) : {};
    await fn(req, res, body);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...(e.extra || {}) });
    console.error("route error", key, e);
    send(res, 500, { error: "internal error" });
  }
}
