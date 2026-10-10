// ship5 p2-face, server half:
//   - the runtime kill switches (server/face-puppet/config.js: TAXILA_FACE_PUPPET2D, TAXILA_DHD_VISEMES) and their route;
//   - the shipped pack revision agrees between server and client and exists in public/;
//   - patch 01 (edgeTrim reports the lead it removed; a cached part's marks round-trip; the visemes flag) and patch 03
//     (server/index.js registers the face route), each skipped (never failed) until its patch is applied.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { faceConfig, routes } from "../server/face-puppet/config.js";
import { PUPPET_REV as SERVER_REV } from "../server/face-puppet/rev.js";
import { PUPPET_REV as CLIENT_REV } from "../src/face-puppet/assets.ts";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

test("face config: both switches ship ON; '0' turns each off on its own; nothing else does", () => {
  assert.deepEqual(faceConfig({}), { puppet2d: true, visemes: true, rev: SERVER_REV, look: SERVER_REV });
  assert.equal(faceConfig({ TAXILA_FACE_PUPPET2D: "0" }).puppet2d, false);
  assert.equal(faceConfig({ TAXILA_FACE_PUPPET2D: "0" }).visemes, true);
  assert.equal(faceConfig({ TAXILA_DHD_VISEMES: "0" }).visemes, false);
  assert.equal(faceConfig({ TAXILA_DHD_VISEMES: "0" }).puppet2d, true);
  for (const v of ["", "1", "false", "off"]) assert.equal(faceConfig({ TAXILA_FACE_PUPPET2D: v }).puppet2d, true, `only "0" kills (${JSON.stringify(v)})`);
});

test("GET /api/face/config answers the switches, short-cached, with no child data", async () => {
  const fn = routes["GET /api/face/config"];
  assert.equal(typeof fn, "function");
  const headers = {};
  let body = "", status = 0;
  const res = { setHeader: (k, v) => { headers[k.toLowerCase()] = v; }, end: (b) => { body = b ?? ""; }, set statusCode(s) { status = s; }, get statusCode() { return status; } };
  const prev = process.env.TAXILA_FACE_PUPPET2D;
  process.env.TAXILA_FACE_PUPPET2D = "0";
  try { await fn({ headers: {} }, res); } finally { if (prev === undefined) delete process.env.TAXILA_FACE_PUPPET2D; else process.env.TAXILA_FACE_PUPPET2D = prev; }
  assert.equal(status, 200);
  assert.match(headers["cache-control"], /max-age=60/);
  assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ["look", "puppet2d", "rev", "visemes"]);
  assert.equal(JSON.parse(body).puppet2d, false);
});

test("the pack revision agrees (server, client) and the pack is in public/", () => {
  assert.equal(SERVER_REV, CLIENT_REV);
  const dir = new URL(`../public/face-puppet/${CLIENT_REV}/`, import.meta.url);
  for (const f of ["geom.json", "face.webp", "rest-medium.webp", "rest-close.webp"]) assert.ok(fs.existsSync(new URL(f, dir)), `${f} shipped`);
});

const P01 = /onLead/.test(read("../server/voice/expressive/pauses.js")) && /staticMarks/.test(read("../server/voice/speech.js"));
const SKIP01 = P01 ? false : "patch 01 (server visemes) not applied yet";

test("patch 01: edgeTrim onLead = the removed lead (silence minus the kept pre-roll), across chunk boundaries", { skip: SKIP01 }, async () => {
  const { edgeTrim, KEEP_MS, RATE } = await import("../server/voice/expressive/pauses.js");
  const tone = (ms, amp = 8000) => { const n = Math.round((RATE * ms) / 1000), b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(amp * Math.sin(i / 3)), i * 2); return b; };
  const quiet = (ms) => Buffer.alloc(Math.round((RATE * ms) / 1000) * 2);
  async function* chunks(...bufs) { for (const b of bufs) yield b; }
  let lead = -1;
  const out = [];
  for await (const c of edgeTrim(chunks(quiet(60), quiet(60), Buffer.concat([quiet(30), tone(200)])), { lead: true, onLead: (n) => { lead = n; } })) out.push(c);
  assert.equal(lead, Math.round((RATE * (150 - KEEP_MS)) / 1000));
  assert.equal(lead + (Buffer.concat(out).length >> 1), Math.round((RATE * 350) / 1000));
  let called = false;
  for await (const _ of edgeTrim(chunks(tone(50)), { onLead: () => { called = true; } })) { /* drain */ }
  assert.equal(called, false, "no lead trim, no call");
});

test("patch 01: cached marks round-trip; TAXILA_DHD_VISEMES=0 restores REST", { skip: SKIP01 }, async () => {
  const { staticMarks, marksOf, dhdVisemesOn } = await import("../server/voice/speech.js");
  const m = staticMarks({ visemes: [[0, 0], [120, 21]], words: [[100, 200, "mama"]] });
  const got = [];
  m.onMarks((x) => got.push(x));
  assert.equal(got.length, 1);
  assert.deepEqual(marksOf({ marks: m }), { visemes: [[0, 0], [120, 21]], words: [[100, 200, "mama"]] });
  assert.equal(marksOf({ marks: staticMarks({}) }), null);
  assert.equal(dhdVisemesOn({}), true);
  assert.equal(dhdVisemesOn({ TAXILA_DHD_VISEMES: "0" }), false);
});

test("patch 01: the websocket client frames and pools as specified (no network)", { skip: P01 && fs.existsSync(new URL("../server/voice/azureTtsWs.js", import.meta.url)) ? false : "patch 01 not applied yet" }, async () => {
  const ws = await import("../server/voice/azureTtsWs.js");
  assert.equal(ws.WS_PCM_FORMAT, "raw-24khz-16bit-mono-pcm");
  assert.ok(ws.POOL_MAX >= 3, "at least one speaking child (LOOKAHEAD 2 + the playing part) per pool");
  assert.deepEqual(ws.__pool("nowhere"), []);
  await assert.rejects(() => ws.dhdStreamWs("<speak/>", { env: {} }), /not configured/);
});

const P05 = /face-puppet\/config\.js/.test(read("../server/index.js"));
test("patch 03: server/index.js registers GET /api/face/config", { skip: P05 ? false : "patch 03 (server seam, 03-server-face-config.diff) not applied yet" }, () => {
  const src = read("../server/index.js");
  assert.match(src, /import \{ routes as face \} from "\.\/face-puppet\/config\.js"/);
  // registered in the one register() call (ship5 integration: '...lane' stays last, tests/w2d-voice-lanes asserts '...lane }')
  assert.match(src, /register\(\{[^}]*\.\.\.face\b[^}]*\}\);/);
});
