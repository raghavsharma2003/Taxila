// sort_bins: cards identical and in the given order before sorting (no grouping by answer), tap-tap sorting graded by
// the host, a wrong card returns unplaced, a right card is shown inside its bin.
import { seamPresent, noHint, doneCalled, until } from "./util.js";

const inside = (a, b) => a.x >= b.x - 3 && a.y >= b.y - 3 && a.x + a.w <= b.x + b.w + 3 && a.y + a.h <= b.y + b.h + 3;

export default {
  seam: ["data-card", "data-selected", "data-bin", "data-placed"],
  targets: "[data-card],[data-bin]",
  async play(c) {
    const p = c.params;
    await seamPresent(c, [...p.cards.map((k) => [`[data-card="${k}"]`]), ...p.bins.map((k) => [`[data-bin="${k}"]`])]);
    const order = (await c.visible("[data-card]")).map((b) => b.attrs["data-card"]);
    c.add("G8.cards_in_given_order", order.join() === p.cards.join(), order);
    c.add("G8.none_placed_at_start", (await c.visible("[data-placed]")).length === 0, "");
    await noHint(c, "[data-card]", "G8.cards_identical");
    let ok = true, placedOk = true; const why = [], pWhy = [];
    const first = p.cards[0], wrongBin = p.bins.find((b) => b !== p.binOf[first]);
    await c.tap("[data-card]", { attr: "data-card", value: first });
    const n0 = c.answers().length;
    await c.tap("[data-bin]", { attr: "data-bin", value: wrongBin });
    let a = await c.waitAnswer(n0 + 1);
    if (!a || a.correct !== false || a.value?.card !== first || a.value?.bin !== wrongBin) { ok = false; why.push(`wrong sort posted ${JSON.stringify(a?.value)}`); }
    await c.sleep(900);
    if ((await c.visible("[data-placed]")).length !== 0) { ok = false; why.push("a wrongly sorted card stayed placed"); }
    for (const card of ok ? p.cards : []) {
      const bin = p.binOf[card];
      if (!(await c.tap("[data-card]", { attr: "data-card", value: card }))) { ok = false; why.push(`card ${card} not tappable`); break; }
      const n1 = c.answers().length;
      await c.tap("[data-bin]", { attr: "data-bin", value: bin });
      a = await c.waitAnswer(n1 + 1);
      if (!a || a.correct !== true) { ok = false; why.push(`${card}→${bin} posted ${JSON.stringify(a?.value)} (${a?.correct})`); break; }
      const placed = await until(c, async () => { const bs = await c.visible("[data-placed]"); const bb = (await c.visible(`[data-bin="${bin}"]`))[0];
        return bs.find((x) => x.attrs["data-placed"] === bin && (x.attrs["data-card"] === card || x.text.includes(c.strings[card])) && bb && inside(x, bb)); }, 1500);
      if (!placed) { placedOk = false; pWhy.push(`${card} not shown inside ${bin}`); }
    }
    c.add("G6.placed_in_bin", placedOk, pWhy.slice(0, 3));
    c.add("G5.play_truth", ok, why);
    await doneCalled(c);
  },
};
