// balance_scale: pan totals tell the truth, the beam tilts toward the heavier pan (attribute AND drawing: the heavier
// pan's centre is lower), level only when equal; each item played wrong-then-right.
import { seamPresent, noHint, doneCalled, until } from "./util.js";

const sum = (xs) => xs.reduce((s, x) => s + x, 0);

export default {
  seam: ["data-pan", "data-total", "data-weight", "data-beam", "data-tilt", "data-option"],
  targets: "[data-option]",
  async play(c) {
    const p = c.params;
    await seamPresent(c, [["[data-pan=left]"], ["[data-pan=right]"], ["[data-beam]"], ["[data-option]", 3], ["[data-weight]"]]);
    const state = async () => {
      const L = (await c.visible("[data-pan=left]"))[0], R = (await c.visible("[data-pan=right]"))[0], B = (await c.visible("[data-beam]"))[0];
      if (!L || !R || !B) return null;
      return { lt: Number(L.attrs["data-total"]), rt: Number(R.attrs["data-total"]), tilt: B.attrs["data-tilt"], dy: (L.y + L.h / 2) - (R.y + R.h / 2) };
    };
    // truth of a state: tilt names the heavier side; the heavier pan is drawn lower (larger y); level = |dy| ≤ 3
    const truthful = (s, lt, rt) => {
      if (!s || s.lt !== lt || s.rt !== rt) return false;
      const want = lt > rt ? "left" : lt < rt ? "right" : "level";
      if (s.tilt !== want) return false;
      return want === "level" ? Math.abs(s.dy) <= 3 : want === "left" ? s.dy > 4 : s.dy < -4;
    };
    let ok = true, tiltOk = true; const why = [], tWhy = [];
    await noHint(c, "[data-option]", "G8.options_identical");
    for (let i = 0; i < p.items.length && ok; i++) {
      const it = p.items[i];
      const lt = sum(it.left), rt = sum(it.right), miss = lt - rt;
      const s0 = await until(c, async () => { const s = await state(); return truthful(s, lt, rt) ? s : null; }, 1800);
      if (!s0) { tiltOk = false; tWhy.push(`item${i} start: ${JSON.stringify(await state())}, want ${lt} vs ${rt}`); }
      const wrong = it.options.find((o) => o !== miss);
      const n0 = c.answers().length;
      if (!(await c.tap("[data-option]", { attr: "data-option", value: wrong }))) { ok = false; why.push(`item${i}: no option ${wrong}`); break; }
      let a = await c.waitAnswer(n0 + 1);
      if (!a || a.correct !== false || Number(a.value?.value) !== wrong) { ok = false; why.push(`item${i}: wrong posted ${JSON.stringify(a?.value)}`); break; }
      const sW = await until(c, async () => { const s = await state(); return truthful(s, lt, rt + wrong) ? s : null; }, 1800);
      if (!sW) { tiltOk = false; tWhy.push(`item${i} with ${wrong}: ${JSON.stringify(await state())}`); }
      // the wrong weight goes back: the option is tappable again
      const back = await until(c, async () => (await c.visible(`[data-option="${miss}"]`)).length && (await state())?.rt === rt, 3000);
      if (!back) { ok = false; why.push(`item${i}: the wrong weight never went back`); break; }
      const n1 = c.answers().length;
      await c.tap("[data-option]", { attr: "data-option", value: miss });
      a = await c.waitAnswer(n1 + 1);
      if (!a || a.correct !== true) { ok = false; why.push(`item${i}: right posted ${JSON.stringify(a?.value)}`); break; }
      const sR = await until(c, async () => { const s = await state(); return truthful(s, lt, lt) ? s : null; }, 1800);
      if (!sR) { tiltOk = false; tWhy.push(`item${i} balanced: ${JSON.stringify(await state())}`); }
      await c.sleep(1500);
    }
    c.add("G6.tilt_tells_truth", tiltOk, tWhy.slice(0, 3));
    c.add("G5.play_truth", ok, why);
    await doneCalled(c);
  },
};
