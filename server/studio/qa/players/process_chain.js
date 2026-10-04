// process_chain: every stage and every arrow present (a cycle closes), names beside their stages, the token TRAVELS
// to the next stage on next (distance falls, ends at the stage) and data-active follows, and the question grades.
import { seamPresent, noHint, doneCalled, wrongThenRight, anchored, boxGap, until } from "./util.js";

export default {
  seam: ["data-stage", "data-label", "data-arrow", "data-token", "data-active", "data-action", "data-option"],
  targets: "[data-action],[data-option]",
  async play(c) {
    const p = c.params;
    const pairs = p.stages.slice(1).map((s, i) => `${p.stages[i]}>${s}`);
    if (p.cycle) pairs.push(`${p.stages.at(-1)}>${p.stages[0]}`);
    await seamPresent(c, [...p.stages.map((s) => [`[data-stage="${s}"]`]), ...p.stages.map((s) => [`[data-label="${s}"]`]),
      ...pairs.map((a) => [`[data-arrow="${a}"]`]), ["[data-token]"], ["[data-active]"], ["[data-action=next]"], ...p.options.map((o) => [`[data-option="${o}"]`])]);
    const stageBox = new Map();
    for (const s of p.stages) stageBox.set(s, await c.visible(`[data-stage="${s}"]`));
    const labels = (await c.visible("[data-label]")).filter((b) => p.stages.includes(b.attrs["data-label"]));
    anchored(c, labels, stageBox, "data-label", { maxGap: 30 });
    const active = async () => (await c.boxes("[data-active]"))[0]?.attrs["data-active"];
    const token = async () => (await c.visible("[data-token]"))[0];
    const why = [];
    if ((await active()) !== p.stages[0]) why.push(`starts at ${await active()}`);
    const steps = p.cycle ? p.stages.length : p.stages.length - 1;
    for (let i = 1; i <= Math.min(steps, 3); i++) {
      const target = p.stages[i % p.stages.length];
      const tb = stageBox.get(target)[0];
      const t0 = await token();
      await c.tap("[data-action=next]", { attr: "data-action", value: "next", wait: 80 });
      const d0 = t0 && tb ? boxGap(t0, tb) : Infinity;
      // sample the journey: some frame strictly between start and end, then the end at (or touching) the stage
      const ds = [];
      for (let k = 0; k < 10; k++) { const t = await token(); if (t && tb) ds.push(boxGap(t, tb)); await c.sleep(120); }
      const arrived = await until(c, async () => { const t = await token(); return t && tb && boxGap(t, tb) <= 6; }, 2000);
      const travelled = ds.some((d) => d > 6 && d < d0 - 4);
      if (!arrived) why.push(`token never reached ${target}`);
      else if (!travelled && d0 > 20) why.push(`token jumped to ${target}`);
      const act = await until(c, async () => (await active()) === target, 1200);
      if (!act) why.push(`data-active ${await active()} after next, want ${target}`);
    }
    c.add("G6.token_travels_in_order", why.length === 0, why.slice(0, 3));
    await noHint(c, "[data-option]", "G8.options_identical");
    const i = p.stages.indexOf(p.askAfter);
    const right = p.stages[(i + 1) % p.stages.length];
    await wrongThenRight(c, { sel: "[data-option]", attr: "data-option", wrong: p.options.find((o) => o !== right), right });
    doneCalled(c);
  },
};
