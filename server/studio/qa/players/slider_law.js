// slider_law: the shown output equals the law at every x the child can reach (host computes it), the picture's size is
// y * unitsPer, x stays in its range, and the question grades by the host.
import { seamPresent, noHint, doneCalled, until } from "./util.js";

export default {
  seam: ["data-action", "data-x", "data-output", "data-value", "data-visual", "data-dim", "data-option"],
  targets: "[data-action],[data-option]",
  async play(c) {
    const p = c.params;
    const law = (x) => p.law.k * x + p.law.b;
    await seamPresent(c, [["[data-action=dec]"], ["[data-action=inc]"], ["[data-x]"], ["[data-output]"], ["[data-visual]"], ...p.ask.options.map((o) => [`[data-option="${o}"]`])]);
    const read = async () => {
      const X = (await c.visible("[data-x]"))[0], O = (await c.visible("[data-output]"))[0], V = (await c.visible("[data-visual]"))[0];
      if (!X || !O || !V) return null;
      const dim = V.attrs["data-dim"] === "w" ? V.w : V.h;
      return { x: Number(X.attrs["data-x"]), y: Number(O.attrs["data-value"]), text: O.text, size: dim };
    };
    const truthful = (s) => s && Math.abs(s.y - law(s.x)) <= 0.005 && Math.abs(s.size - law(s.x) * p.y.unitsPer) <= 2 && s.text.includes(String(+law(s.x).toFixed(2)));
    const why = [];
    let s = await until(c, async () => { const r = await read(); return truthful(r) ? r : null; }, 1500);
    if (!s || Math.abs(s.x - p.x.start) > 1e-6) why.push(`start ${JSON.stringify(await read())}`);
    // walk: inc, inc, dec, then dec past the minimum
    for (const act of ["inc", "inc", "dec"]) {
      await c.tap("[data-action]", { attr: "data-action", value: act, wait: 200 });
      s = await until(c, async () => { const r = await read(); return truthful(r) ? r : null; }, 1500);
      if (!s) { why.push(`after ${act}: ${JSON.stringify(await read())}`); break; }
    }
    const steps = Math.round((p.x.max - p.x.min) / p.x.step) + 2;
    for (let i = 0; i < steps; i++) await c.tap("[data-action]", { attr: "data-action", value: "dec", wait: 60 });
    s = await until(c, async () => { const r = await read(); return truthful(r) && Math.abs(r.x - p.x.min) < 1e-6 ? r : null; }, 1500);
    if (!s) why.push(`at the minimum: ${JSON.stringify(await read())}`);
    c.add("G6.output_follows_law", why.length === 0, why.slice(0, 3));
    await noHint(c, "[data-option]", "G8.options_identical");
    const want = law(p.ask.x);
    const right = p.ask.options.find((o) => Math.abs(o - want) < 1e-6);
    const wrong = p.ask.options.find((o) => o !== right);
    // options are keyed by their number: the attribute value as written, the answer posted as {value}
    const n0 = c.answers().length;
    const ok1 = await c.tap("[data-option]", { attr: "data-option", value: String(wrong) });
    let a = await c.waitAnswer(n0 + 1);
    const w1 = ok1 && a && a.correct === false && Number(a.value?.value) === wrong;
    await c.sleep(600);
    const n1 = c.answers().length;
    await c.tap("[data-option]", { attr: "data-option", value: String(right) });
    a = await c.waitAnswer(n1 + 1);
    c.add("G5.play_truth", w1 && a?.correct === true, { wrongOk: w1, right: a?.value });
    await doneCalled(c);
  },
};
