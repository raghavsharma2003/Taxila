// Minimal request/response helpers shared by every route.
export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
export const bad = (msg, extra) => new HttpError(400, msg, extra);
export const unauthorized = (msg = "not signed in") => new HttpError(401, msg);
export const forbidden = (msg = "forbidden") => new HttpError(403, msg);
export const notFound = (msg = "not found") => new HttpError(404, msg);

/**
 * Largest JSON body any route takes: a push-to-talk clip (server/routes/voice.js MAX_CLIP_BYTES = 2 MB) is
 * ~2.7 MB as base64. Checked as chunks arrive, before auth, so an oversized body is never buffered whole.
 */
export const MAX_BODY_BYTES = 3_000_000;

export async function readJson(req, { maxBytes = MAX_BODY_BYTES } = {}) {
  if (req.body && typeof req.body === "object") return req.body;           // Vercel pre-parses JSON
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) throw new HttpError(413, "request body too large");
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    // Stop reading (nothing more is buffered); Node drops the rest of the body after the 413 is sent.
    if (size > maxBytes) throw new HttpError(413, "request body too large");
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw bad("invalid JSON body"); }
}

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (body === undefined) return res.end();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Require string fields; returns trimmed values. */
export function need(body, ...fields) {
  const out = {};
  for (const f of fields) {
    const v = body?.[f];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) throw bad(`missing field: ${f}`);
    out[f] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}
