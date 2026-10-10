// Round 4 content (the 0c90ebb rollback, 2026-10-10): what the PRODUCTION IMAGE holds is what the server can read. The tray
// gate read its box contract from docs/ (not in the image: .dockerignore), so on taxila.dev every board was refused ("no box
// for this class") and every Studio slot failed, while every local run (the full repository) passed.
//
// This test builds each image's runtime file set from its Dockerfile (the final stage's COPY lines; dist/ is skipped:
// the client build) into a temp directory and, from that file set ALONE:
//   web     the tray gate reads its contract, and a board passes the gate and the tray certificate at the 360 phone
//           (the slot-fill path: board-sync codeBoard → certifyForTray, as seam.js drawn() runs it)
//   worker  server/worker.mjs's static import graph loads from its image's files (ESM resolves every static import
//           before the module body runs, so a missing file fails before the worker's own "DATABASE_URL not set" exit)
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = [];
after(() => { for (const d of tmp) fs.rmSync(d, { recursive: true, force: true }); });

/** The final stage's COPY sources of a Dockerfile (build-stage artefacts and dist/ skipped). */
function runtimeCopies(dockerfile) {
  const lines = fs.readFileSync(path.join(ROOT, dockerfile), "utf8").split("\n");
  const last = lines.map((l, i) => (/^FROM\s/i.test(l) ? i : -1)).filter((i) => i >= 0).at(-1) ?? 0;
  return lines.slice(last).map((l) => l.match(/^COPY\s+(?!--from)(\S+)\s+\S+/i)?.[1]).filter(Boolean)
    .filter((src) => !["package.json", "package-lock.json", "."].includes(src));
}
function packaged(dockerfile) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-image-"));
  tmp.push(dir);
  for (const src of runtimeCopies(dockerfile)) fs.cpSync(path.join(ROOT, src), path.join(dir, src), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(dir, "package.json"));
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  return dir;
}
const node = (cwd, code, env = {}) => spawnSync(process.execPath, ["--input-type=module", "-e", code],
  { cwd, encoding: "utf8", timeout: 60_000, env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "production", ...env } });

describe("r4 content: the production image's file set", () => {
  it("the Dockerfile copies are what this test packages (server, shared, data, src for web)", () => {
    const web = runtimeCopies("Dockerfile");
    for (const d of ["server", "shared", "data", "src"]) assert.ok(web.includes(d), `web image copies ${d}`);
    assert.ok(!web.includes("docs"), "docs/ is not in the image: nothing the server reads may live there");
  });
  it("web: from the packaged files alone, the tray gate has its contract and a board fills the slot at the 360 phone", () => {
    const dir = packaged("Dockerfile");
    const r = node(dir, `
      const g = await import("./server/forge3/tray-gate.js");
      const bs = await import("./server/stagecraft/board-sync.js");
      const h = g.trayGateHealth();
      if (!h.ok) throw new Error("tray gate not ready: " + h.missing.join(", "));
      const box = g.contractBox("p360");
      if (!box) throw new Error("no contract box for p360");
      const text = "Screen par 5 barabar parts dekhiye; 3 shaded hain. Shaded hisse ka fraction kya hoga?";
      const ask = { intent: { intentId: "P:wb:1", lessonId: "P", kind: "whiteboard" }, line: { lessonId: "P", text }, kit: null, mode: "fresh" };
      const b = bs.codeBoard(ask, { lessonId: "P" }, bs.gateCtxFor(ask, {}));
      if (!b?.ok) throw new Error("no board passed the gate");
      const c = g.certifyForTray({ kind: "whiteboard", script: b.script }, { vp: "p360" });
      if (!c.ok) throw new Error("tray gate refused: " + c.why);
      console.log("OK " + JSON.stringify(box));`);
    assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`.slice(0, 1500));
    assert.match(r.stdout, /^OK /m);
    assert.doesNotMatch(r.stderr, /box contract missing/);
  });
  it("worker: server/worker.mjs loads from its image's files (no missing module)", () => {
    const dir = packaged("Dockerfile.worker");
    const r = node(dir, `try { await import("./server/worker.mjs"); } catch (e) { if (/ERR_MODULE_NOT_FOUND|Cannot find module/.test(String(e?.code) + String(e?.message))) { console.error("MISSING " + e.message); process.exit(3); } } process.exit(0);`,
      { DATABASE_URL: "" });
    assert.doesNotMatch(`${r.stderr}`, /MISSING|ERR_MODULE_NOT_FOUND|Cannot find module/, `${r.stderr}`.slice(0, 1500));
  });
  it("the runtime contract and the brief's docs copy are the same bytes", async () => {
    const { CONTRACT_FILE } = await import("../server/forge3/tray-gate.js");
    const doc = path.join(ROOT, "docs", "design", "round4", "build", "box-contract.json");
    assert.equal(fs.readFileSync(CONTRACT_FILE, "utf8"), fs.readFileSync(doc, "utf8"));
  });
});
