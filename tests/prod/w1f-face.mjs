// W1-F acceptance (BUILD-PLAN §3 W1-F; teacher-anim gaps 1, 6, 7, 10): the GLB rig behind face.rig, and asset hygiene.
//   NODE_USE_ENV_PROXY=1 node tests/prod/w1f-face.mjs            (TAXILA_BASE=http://localhost:PORT for a local server)
//
// Arms (all on one fresh test account; the account is deleted in withTestAccount's finally):
//   hygiene   no bake-off identity is reachable (/assets/teacher-bakeoff/** is not served as an asset), the old unversioned
//             look URLs are gone, and the published look is served from /assets/teacher/<look>/<rev>/ as immutable.
//   rig       GPU-spoof arm (the audit's: renderer string → Adreno 650, failIfMajorPerformanceCaveat dropped, so the
//             shipped static tier picks B on SwiftShader), face.rig ON for this browser only (localStorage): a .glb from
//             the tutor's own look loads, the canvas is revealed (data-face=rig) at data-tier=B.
//   fallback  the same, with every .glb request failed: the face falls to D and shows THE SAME LOOK (its own plate),
//             never the code-drawn SVG (V-FACE: every face on the page is a pickable face).
//   timeout   the same, with every .glb held past RIG_TIMEOUT_MS (8 s): D with the same look, never revealed.
//   surfaces  flag on: the landing, Hello, the teacher screen and the child home show only look faces (V-FACE).
//   off       face.rig OFF (the default): no .glb is requested and the pre-rig face is unchanged.
//   teal      a class-2 child (Asha → teal, the placeholder look): the rig arm again on the other look.
// The 404 checks need server/serve.mjs to stop the SPA fallback under /assets/ (W1-D's file; the patch is
// scripts/character/seam-patches/w1f-serve-assets-404.patch): until integration applies it they FAIL, on purpose.
// SwiftShader frames are correctness evidence only, never a performance number (teacher-anim §1).
import { withTestAccount, launch, ok, warn, done, BASE } from "./lib.mjs";
import { tutorById, defaultTutorFor } from "../../shared/tutors.js";

const FLAG = "tx.flag.face.rig";
const SPOOF = `(() => {
  const R = 0x9246; // UNMASKED_RENDERER_WEBGL
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    const gp = C.prototype.getParameter;
    C.prototype.getParameter = function (p) { return p === R ? "Adreno (TM) 650" : gp.call(this, p); };
  }
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (attrs && typeof attrs === "object" && "failIfMajorPerformanceCaveat" in attrs) { attrs = { ...attrs }; delete attrs.failIfMajorPerformanceCaveat; }
    return gc.call(this, type, attrs);
  };
})();`;

async function head(path) {
  const res = await fetch(BASE + path, { method: "GET" });
  const buf = new Uint8Array(await res.arrayBuffer());
  const magic = String.fromCharCode(...buf.slice(0, 4));
  return { status: res.status, type: res.headers.get("content-type") || "", cache: res.headers.get("cache-control") || "", glb: magic === "glTF", bytes: buf.length };
}

/** Open the lesson desk for the child in a fresh context; returns the page, the .glb requests and console errors. */
async function openDesk(api, child, { flag, spoof = true, failGlb = false, delayGlbMs = 0, path, puppet }) {
  const h = await launch({ cookieFrom: api, viewport: { width: 412, height: 860 }, launch: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
  const glb = [];
  const events = [];
  h.page.on("console", (m) => { if (m.type() === "error") events.push(m.text().slice(0, 200)); });
  h.page.on("requestfinished", async (r) => { if (/\.glb(\?|$)/.test(r.url())) glb.push({ url: r.url(), status: (await r.response())?.status() ?? 0 }); });
  h.page.on("requestfailed", (r) => { if (/\.glb(\?|$)/.test(r.url())) glb.push({ url: r.url(), status: 0, failed: r.failure()?.errorText }); });
  await h.context.addInitScript(({ key, on }) => { try { if (on === null) localStorage.removeItem(key); else localStorage.setItem(key, on ? "1" : "0"); } catch {} }, { key: FLAG, on: flag });
  // ship5: the style-C 2D puppet is Asha's lesson face (hotfix 27d51a6); "0" forces this device back to TutorFace (the
  // face every kill switch falls back to), which is what the rig arms exercise.
  if (puppet !== undefined) await h.context.addInitScript(({ key, v }) => { try { localStorage.setItem(key, v); } catch {} }, { key: "tx.flag.face.puppet2d", v: puppet });
  if (spoof) await h.context.addInitScript(SPOOF);
  if (failGlb) await h.page.route("**/*.glb", (route) => route.abort("failed"));
  if (delayGlbMs) await h.page.route("**/*.glb", (route) => setTimeout(() => route.continue().catch(() => {}), delayGlbMs));
  await h.page.goto(`${BASE}${path ?? `/c/${child.id}/lesson/new`}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return { ...h, glb, events };
}

const faceAttrs = (page) => page.evaluate(() => [...document.querySelectorAll(".tx-tutorface")].map((e) => ({
  tier: e.getAttribute("data-tier"), tutor: e.getAttribute("data-tutor"), look: e.getAttribute("data-look"), rev: e.getAttribute("data-look-rev"),
  face: e.getAttribute("data-face"), drawnSvg: !!e.querySelector("svg.tx-tutorface-plate"), canvas: !!e.querySelector("canvas"),
  plateSrc: e.querySelector(".tx-plateperson img")?.getAttribute("src") ?? null,
  plateLoaded: (() => { const i = e.querySelector(".tx-plateperson img"); return !!i && i.complete && i.naturalWidth > 0; })(),
})));

function lookOf(child) {
  const tutor = tutorById(child.tutorId) ?? tutorById(defaultTutorFor({ class_level: child.classLevel ?? child.class_level ?? 5 }));
  ok(!!tutor?.lookId, `the child's tutor (${tutor?.id}) has a lookId (${tutor?.lookId})`);
  return tutor?.lookId;
}

/** Rig on, GPU-spoof arm: the look's plate first, its GLB loads, revealed at data-tier=B. */
async function rigArm(api, child, expectLook, { puppet } = {}) {
  {
    const d = await openDesk(api, child, { flag: true, puppet });
    try {
      await d.page.waitForSelector(".tx-tutorface[data-look]", { timeout: 45_000 });
      const f0 = (await faceAttrs(d.page))[0];
      ok(f0?.look === expectLook, `the lesson face wears the tutor's own look: ${f0?.tutor} → ${f0?.look} (expected ${expectLook})`);
      ok(!!f0?.plateSrc?.startsWith(`/assets/teacher/${expectLook}/`), `the plate paints first, from the look's versioned URL (${f0?.plateSrc})`);
      const shown = await d.page.waitForSelector('.tx-tutorface[data-face="rig"]', { timeout: 45_000 }).then(() => true, () => false);
      const f = (await faceAttrs(d.page))[0];
      const hit = d.glb.find((g) => g.url.includes(`/assets/teacher/${expectLook}/`) && g.status === 200);
      ok(!!hit, `a .glb of the look loaded: ${hit ? new URL(hit.url).pathname : JSON.stringify(d.glb)}`);
      ok(shown && f?.tier === "B" && f?.canvas, `the 3D rig is revealed at data-tier=B (tier ${f?.tier}, face ${f?.face}, canvas ${f?.canvas})`);
      ok(!f?.drawnSvg, "no code-drawn SVG plate on the rig path");
      if (hit) {
        const h = await head(new URL(hit.url).pathname);
        ok(/immutable/.test(h.cache) && h.type.startsWith("model/gltf-binary"), `the GLB is served immutable (${h.cache}; ${h.type}; ${h.bytes} B)`);
      }
      if (d.events.length) warn(`console errors: ${d.events.slice(0, 3).join(" | ")}`);
    } finally { await d.browser.close(); }
  }
}

await withTestAccount(async ({ api, child }) => {
  // ───────── hygiene ─────────
  const bake = await head("/assets/teacher-bakeoff/merged/teal/Bplus.glb");
  ok(!bake.glb && !/gltf/.test(bake.type), `bake-off identities are not served: /assets/teacher-bakeoff/merged/teal/Bplus.glb → ${bake.status} ${bake.type.split(";")[0]} (not a GLB)`);
  ok(bake.status === 404, `/assets/teacher-bakeoff/* returns 404 (got ${bake.status}${bake.status === 200 ? ": the SPA fallback; apply w1f-serve-assets-404.patch to server/serve.mjs" : ""})`);
  const old = await head("/assets/teacher/teal/Bplus.glb");
  ok(!old.glb && old.status === 404, `the unversioned look URL is gone: /assets/teacher/teal/Bplus.glb → ${old.status} (expected 404, not a GLB)`);
  const page = await head("/c/x/teacher");
  ok(page.status === 200 && page.type.startsWith("text/html"), `SPA routes still fall back to the app (${page.status} ${page.type.split(";")[0]})`);

  const expectLook = lookOf(child);
  await rigArm(api, child, expectLook);

  // ───────── forced load failure → D, same look ─────────
  {
    const d = await openDesk(api, child, { flag: true, failGlb: true });
    try {
      const fell = await d.page.waitForSelector('.tx-tutorface[data-tier="D"][data-look]', { timeout: 45_000 }).then(() => true, () => false);
      await d.page.waitForTimeout(500);
      const all = await faceAttrs(d.page);
      const f = all[0];
      ok(fell && f?.look === expectLook, `a failed GLB falls to D showing the same look (tier ${f?.tier}, look ${f?.look}, expected ${expectLook})`);
      ok(!!f?.plateLoaded && !!f?.plateSrc?.startsWith(`/assets/teacher/${expectLook}/`), `the D face is the look's own rendered plate (${f?.plateSrc}, loaded ${f?.plateLoaded})`);
      ok(all.every((x) => x.look && !x.drawnSvg), `V-FACE: every face on the page is a pickable look (${all.map((x) => `${x.tutor}:${x.look}`).join(", ")})`);
      ok(d.glb.some((g) => g.failed), `the GLB request was attempted and failed as forced (${d.glb.length} request(s))`);
      // A failed rig is remembered for the page: a later mount (the desk changing layout) must not refetch the GLB.
      const n = d.glb.length;
      await d.page.setViewportSize({ width: 1280, height: 860 });
      await d.page.waitForTimeout(3000);
      await d.page.setViewportSize({ width: 412, height: 860 });
      await d.page.waitForTimeout(3000);
      const after = await faceAttrs(d.page);
      ok(d.glb.length === n && after.every((x) => x.look === expectLook && x.tier === "D"), `after relayouts the face stays on D with no new GLB request (${n} → ${d.glb.length}; ${after.map((x) => `${x.tier}:${x.look}`).join(", ")})`);
    } finally { await d.browser.close(); }
  }

  // ───────── GLB slower than the 8 s timeout → D, same look, never revealed ─────────
  {
    const d = await openDesk(api, child, { flag: true, delayGlbMs: 11_000 });
    try {
      await d.page.waitForSelector(".tx-tutorface[data-look]", { timeout: 45_000 });
      const fell = await d.page.waitForSelector('.tx-tutorface[data-tier="D"][data-look]', { timeout: 30_000 }).then(() => true, () => false);
      await d.page.waitForTimeout(4000); // past the held response: a late GLB must not be revealed
      const f = (await faceAttrs(d.page))[0];
      ok(fell && f?.look === expectLook && f?.face === "plate" && !f?.canvas, `a GLB slower than 8 s leaves her on D with the same look, never revealed (tier ${f?.tier}, look ${f?.look}, face ${f?.face}, canvas ${f?.canvas})`);
    } finally { await d.browser.close(); }
  }

  // ───────── V-FACE on the other surfaces, flag on ─────────
  for (const path of ["/", `/c/${child.id}/hello`, `/c/${child.id}/teacher`, `/c/${child.id}`]) {
    const d = await openDesk(api, child, { flag: true, spoof: false, path });
    try {
      await d.page.waitForTimeout(4000);
      const v = await d.page.evaluate(() => ({
        looks: [...document.querySelectorAll(".tx-plateperson[data-look]")].map((e) => e.getAttribute("data-look")),
        drawn: document.querySelectorAll('svg[viewBox="0 0 200 240"], svg.tx-tutorface-plate').length,
        bareFace: document.querySelectorAll(".tx-tutorface:not([data-look]):not([data-tier=\"E\"])").length,
      }));
      ok(v.drawn === 0 && v.bareFace === 0, `V-FACE ${path}: only look faces (${v.looks.length} look face(s): ${[...new Set(v.looks)].join(",") || "-"}; drawn ${v.drawn}; pre-rig ${v.bareFace})`);
    } finally { await d.browser.close(); }
  }

  // ───────── flag off (the default) ─────────
  {
    const d = await openDesk(api, child, { flag: null });
    try {
      await d.page.waitForSelector(".tx-tutorface", { timeout: 45_000 });
      await d.page.waitForTimeout(6000);
      const f = (await faceAttrs(d.page))[0];
      ok(!f?.look && d.glb.length === 0, `face.rig off: the pre-rig face, no .glb requested (tier ${f?.tier}, look ${f?.look ?? "-"}, ${d.glb.length} glb)`);
    } finally { await d.browser.close(); }
  }
}, { tag: "w1f-face" });

// ───────── teal (the placeholder look): a class-2 child → Asha ─────────
await withTestAccount(async ({ api, child }) => {
  const expectLook = lookOf(child);
  ok(expectLook === "teal", `a class-2 child's tutor wears teal (${expectLook})`);
  // ship5 (owner: the 2D face ships): Asha's lesson face is the style-C puppet by default, not the GLB rig
  {
    const d = await openDesk(api, child, { flag: true });
    try {
      const puppetShown = await d.page.waitForSelector('[data-face="puppet2d"]', { timeout: 45_000 }).then(() => true, () => false);
      const rigAsked = d.glb.length;
      ok(puppetShown, `ship5: Asha's lesson face is the 2D puppet by default (data-face=puppet2d ${puppetShown}; ${rigAsked} glb requested)`);
    } finally { await d.browser.close(); }
  }
  // the kill-switch fallback (TutorFace with her look) still runs the rig path
  await rigArm(api, child, expectLook, { puppet: "0" });
}, { tag: "w1f-face-teal", child: { classLevel: 2 } });
done();
