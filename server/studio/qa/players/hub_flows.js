// hub_flows (the probe's photosynthesis, generalised): particles move in the scientifically right direction relative to
// the hub (in → toward, out → away, up_in → upward), pause freezes them, next drives the caption through the steps,
// every label sits beside its own referent (anchoring, LIVE-STUDIO §14.5), and the check question grades by the host.
import { seamPresent, noHint, doneCalled, wrongThenRight, labelsLayout, anchored, med } from "./util.js";

const snap = (page, keys) => page.evaluate((keys) => {
  const c = (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const out = {}; for (const k of keys) out[k] = [...document.querySelectorAll(`[data-flow="${k}"]`)].map((e) => { const r = e.getBoundingClientRect(); return { c: c(e), b: { x: r.x, y: r.y, w: r.width, h: r.height } }; });
  return out;
}, keys);

export default {
  seam: ["data-entity", "data-flow", "data-label", "data-action", "data-caption", "data-option"],
  targets: "[data-action],[data-option]",
  async play(c) {
    const { page, params: p, strings: S } = c;
    const flows = p.flows.map((f) => f.key);
    await seamPresent(c, [[`[data-entity="${p.hub}"]`], ...p.entities.map((e) => [`[data-entity="${e}"]`]), ...flows.map((f) => [`[data-flow="${f}"]`, 3]),
      ...[p.hub, ...p.entities, ...flows].map((k) => [`[data-label="${k}"]`]), ["[data-action=play]"], ["[data-action=next]"], ["[data-caption]"],
      ...p.options.map((o) => [`[data-option="${o}"]`])]);
    const labelKeys = [p.hub, ...p.entities, ...flows];
    const labels = (await c.visible("[data-label]")).filter((b) => labelKeys.includes(b.attrs["data-label"]));
    const textOk = labelKeys.every((k) => labels.some((l) => l.attrs["data-label"] === k && l.text.includes(S[k])));
    c.add("G3.labels_text_from_table", textOk, labelKeys.filter((k) => !labels.some((l) => l.attrs["data-label"] === k && l.text.includes(S[k]))));
    await labelsLayout(c, "[data-label]", "data-label");
    // flows over time (particles move): sample 8 frames for the anchoring referents and 2 for direction
    const hub = (await c.visible(`[data-entity="${p.hub}"]`))[0];
    const refs = new Map();
    for (const e of [p.hub, ...p.entities]) refs.set(e, await c.visible(`[data-entity="${e}"]`));
    for (const f of flows) refs.set(f, []);
    const frames = [];
    for (let i = 0; i < 8; i++) { frames.push(await snap(page, flows).catch(() => ({}))); await c.sleep(150); }
    for (const f of flows) for (const fr of frames) for (const pt of fr[f] ?? []) if (pt.b.w > 0) refs.get(f).push(pt.b);
    // a label beside a flow is anchored if near any particle of that flow at some moment
    anchored(c, labels, refs, "data-label", { maxGap: 40, rivals: new Set([p.hub, ...p.entities]) });
    // direction: per particle step between consecutive frames (respawns and idles skipped), median sign
    const H = hub ? [hub.x + hub.w / 2, hub.y + hub.h / 2] : null;
    const why = [];
    if (!H) why.push("no hub");
    for (const f of p.flows) {
      const dd = [], dy = [];
      for (let i = 1; i < frames.length; i++) {
        const a = frames[i - 1][f.key] ?? [], b = frames[i][f.key] ?? [];
        if (a.length !== b.length) continue;
        for (let j = 0; j < a.length; j++) {
          const step = Math.hypot(b[j].c[0] - a[j].c[0], b[j].c[1] - a[j].c[1]); if (step > 60 || step < 0.5) continue;
          dy.push(b[j].c[1] - a[j].c[1]);
          if (H) dd.push(Math.hypot(b[j].c[0] - H[0], b[j].c[1] - H[1]) - Math.hypot(a[j].c[0] - H[0], a[j].c[1] - H[1]));
        }
      }
      if (dd.length < 3) { why.push(`${f.key}: not moving`); continue; }
      if (f.dir === "in" && !(med(dd) < 0)) why.push(`${f.key} not moving into the hub`);
      if (f.dir === "out" && !(med(dd) > 0)) why.push(`${f.key} not moving out of the hub`);
      if (f.dir === "up_in" && !(med(dy) < 0)) why.push(`${f.key} not moving up`);
    }
    c.add("G6.flow_directions", why.length === 0, why);
    // pause freezes
    await c.tap("[data-action=play]"); await c.sleep(300);
    const p1 = await snap(page, flows); await c.sleep(400); const p2 = await snap(page, flows);
    const moved = flows.some((k) => (p1[k] ?? []).some((pt, i) => p2[k]?.[i] && Math.hypot(p2[k][i].c[0] - pt.c[0], p2[k][i].c[1] - pt.c[1]) > 1));
    c.add("G5.pause_freezes", !moved, moved ? "particles still moving after pause" : "");
    await c.tap("[data-action=play]");
    // next drives the caption: step1 at start, then step2, step3 ...
    const cap = () => page.$eval("[data-caption]", (e) => e.textContent.trim()).catch(() => "");
    const capWhy = [];
    if (!(await cap()).includes(S.step1)) capWhy.push(`start caption "${(await cap()).slice(0, 30)}"`);
    for (let s = 2; s <= Math.min(p.steps, 3); s++) {
      await c.tap("[data-action=next]", { wait: 300 });
      if (!(await cap()).includes(S[`step${s}`])) capWhy.push(`after next: "${(await cap()).slice(0, 30)}", want step${s}`);
    }
    c.add("G5.next_drives_caption", capWhy.length === 0, capWhy);
    await noHint(c, "[data-option]", "G8.options_identical");
    const wrong = p.options.find((o) => o !== p.answer);
    await wrongThenRight(c, { sel: "[data-option]", attr: "data-option", wrong, right: p.answer });
    await doneCalled(c);
  },
};
