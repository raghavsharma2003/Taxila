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
//   off       face.rig OFF (the default): no .glb is requested and the pre-rig face is unchanged.
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
async function openDesk(api, child, { flag, spoof = true, failGlb = false }) {
  const h = await launch({ cookieFrom: api, viewport: { width: 412, height: 860 }, launch: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
  const glb = [];
  const events = [];
  h.page.on("console", (m) => { if (m.type() === "error") events.push(m.text().slice(0, 200)); });
  h.page.on("requestfinished", async (r) => { if (/\.glb(\?|$)/.test(r.url())) glb.push({ url: r.url(), status: (await r.response())?.status() ?? 0 }); });
  h.page.on("requestfailed", (r) => { if (/\.glb(\?|$)/.test(r.url())) glb.push({ url: r.url(), status: 0, failed: r.failure()?.errorText }); });
  await h.context.addInitScript(({ key, on }) => { try { if (on === null) localStorage.removeItem(key); else localStorage.setItem(key, on ? "1" : "0"); } catch {} }, { key: FLAG, on: flag });
  if (spoof) await h.context.addInitScript(SPOOF);
  if (failGlb) await h.page.route("**/*.glb", (route) => route.abort("failed"));
  await h.page.goto(`${BASE}/c/${child.id}/lesson/new`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return { ...h, glb, events };
}

const faceAttrs = (page) => page.evaluate(() => [...document.querySelectorAll(".tx-tutorface")].map((e) => ({
  tier: e.getAttribute("data-tier"), tutor: e.getAttribute("data-tutor"), look: e.getAttribute("data-look"), rev: e.getAttribute("data-look-rev"),
  face: e.getAttribute("data-face"), drawnSvg: !!e.querySelector("svg.tx-tutorface-plate"), canvas: !!e.querySelector("canvas"),
  plateSrc: e.querySelector(".tx-plateperson img")?.getAttribute("src") ?? null,
  plateLoaded: (() => { const i = e.querySelector(".tx-plateperson img"); return !!i && i.complete && i.naturalWidth > 0; })(),
})));

await withTestAccount(async ({ api, child }) => {
  // ───────── hygiene ─────────
  const bake = await head("/assets/teacher-bakeoff/merged/teal/Bplus.glb");
  ok(!bake.glb && !/gltf/.test(bake.type), `bake-off identities are not served: /assets/teacher-bakeoff/merged/teal/Bplus.glb → ${bake.status} ${bake.type.split(";")[0]} (not a GLB)`);
  if (bake.status !== 404) warn(`/assets/teacher-bakeoff/* answers ${bake.status} via the SPA fallback (server/serve.mjs); a strict 404 for missing /assets/* is a serve.mjs change outside W1-F`);
  const old = await head("/assets/teacher/teal/Bplus.glb");
  ok(!old.glb, `the unversioned look URL is gone: /assets/teacher/teal/Bplus.glb → ${old.status} (not a GLB)`);

  const tutor = tutorById(child.tutorId) ?? tutorById(defaultTutorFor({ class_level: child.classLevel ?? child.class_level ?? 5 }));
  const expectLook = tutor?.lookId;
  ok(!!expectLook, `the child's tutor (${tutor?.id}) has a lookId (${expectLook})`);

  // ───────── rig on, GPU-spoof arm ─────────
  {
    const d = await openDesk(api, child, { flag: true });
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
done();
