// timeline: each marker at its year's x (linear in the year, earlier on the left, ≤ 3 units), years true, cards not
// overlapping and identical before the answer; the asked event grades by the host.
import { seamPresent, noHint, doneCalled, wrongThenRight, overlaps } from "./util.js";

export default {
  seam: ["data-axis", "data-event", "data-year", "data-card"],
  targets: "[data-card]",
  async play(c) {
    const p = c.params;
    await c.sleep(600);
    await seamPresent(c, [["[data-axis]"], ...p.events.map((e) => [`[data-event="${e.key}"]`]), ...p.events.map((e) => [`[data-card="${e.key}"]`])]);
    const ms = (await c.visible("[data-event]")).map((b) => ({ key: b.attrs["data-event"], year: Number(b.attrs["data-year"]), x: b.x + b.w / 2 }));
    const yearsOk = p.events.every((e) => ms.find((m) => m.key === e.key)?.year === e.year);
    const pts = p.events.map((e) => ({ y: e.year, x: ms.find((m) => m.key === e.key)?.x })).filter((q) => q.x != null).sort((a, b) => a.y - b.y);
    let err = Infinity;
    if (pts.length >= 2) {
      const a = pts[0], z = pts.at(-1), slope = (z.x - a.x) / (z.y - a.y);
      err = slope > 0 ? Math.max(...pts.map((q) => Math.abs(a.x + slope * (q.y - a.y) - q.x))) : Infinity;
    }
    c.add("G6.markers_at_years", yearsOk && err <= 3, { yearsOk, maxErr: Number.isFinite(err) ? +err.toFixed(1) : "not increasing" });
    const cards = await c.visible("[data-card]");
    c.add("G4.cards_no_overlap", overlaps(cards, "data-card", 0.05).length === 0, overlaps(cards, "data-card", 0.05).slice(0, 3));
    await noHint(c, "[data-card]", "G8.cards_identical");
    const pick = p.question === "earliest" ? (a, b) => (b.year < a.year ? b : a) : (a, b) => (b.year > a.year ? b : a);
    const right = p.events.reduce(pick).key;
    await wrongThenRight(c, { sel: "[data-card]", attr: "data-card", wrong: p.events.find((e) => e.key !== right).key, right });
    await doneCalled(c);
  },
};
