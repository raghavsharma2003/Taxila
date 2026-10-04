// sequence_steps: the cards start in the given (scrambled) order with nothing numbered, a wrong next step is refused,
// the right order places each card with its position.
import { seamPresent, noHint, doneCalled, until } from "./util.js";

export default {
  seam: ["data-step", "data-placed"],
  targets: "[data-step]",
  async play(c) {
    const p = c.params;
    await seamPresent(c, p.shown.map((k) => [`[data-step="${k}"]`]));
    const shown = (await c.visible("[data-step]")).map((b) => b.attrs["data-step"]);
    c.add("G8.shown_order_kept", shown.join() === p.shown.join(), shown);
    c.add("G8.none_placed_at_start", (await c.visible("[data-placed]")).length === 0, "");
    await noHint(c, "[data-step]", "G8.cards_identical");
    let ok = true, placedOk = true; const why = [], pWhy = [];
    const wrong = p.shown.find((k) => k !== p.order[0]);
    const n0 = c.answers().length;
    await c.tap("[data-step]", { attr: "data-step", value: wrong });
    let a = await c.waitAnswer(n0 + 1);
    if (!a || a.correct !== false || a.value?.key !== wrong) { ok = false; why.push(`wrong first posted ${JSON.stringify(a?.value)}`); }
    await c.sleep(700);
    if ((await c.visible("[data-placed]")).length) { ok = false; why.push("a wrong step was placed"); }
    for (const [i, k] of (ok ? p.order : []).entries()) {
      const n1 = c.answers().length;
      if (!(await c.tap("[data-step]", { attr: "data-step", value: k }))) { ok = false; why.push(`step ${k} not tappable`); break; }
      a = await c.waitAnswer(n1 + 1);
      if (!a || a.correct !== true) { ok = false; why.push(`${k} at ${i + 1} posted ${JSON.stringify(a?.value)} (${a?.correct})`); break; }
      const placed = await until(c, async () => (await c.visible(`[data-step="${k}"][data-placed]`)).find((b) => b.attrs["data-placed"] === String(i + 1)), 1500);
      if (!placed) { placedOk = false; pWhy.push(`${k} not placed at ${i + 1}`); }
      await c.sleep(250);
    }
    c.add("G6.placed_in_order", placedOk, pWhy.slice(0, 3));
    c.add("G5.play_truth", ok, why);
    await doneCalled(c);
  },
};
