// labelled_parts: each part a separate shape with its name beside it (anchored, and no other part nearer), nothing
// outlined or glowing before the tap, and the asked part grades by the host. The PICTURE's truth (that the shape
// called "root" is a root) is not code-checkable: the archetype is pictureTruth: human_review (library-only).
import { seamPresent, doneCalled, wrongThenRight, anchored, labelsLayout } from "./util.js";

export default {
  seam: ["data-part", "data-label", "data-ask"],
  targets: "[data-part]",
  async play(c) {
    const p = c.params, S = c.strings;
    await seamPresent(c, [...p.parts.map((k) => [`[data-part="${k}"]`]), ...p.parts.map((k) => [`[data-label="${k}"]`]), ["[data-ask]"]]);
    const labels = (await c.visible("[data-label]")).filter((b) => p.parts.includes(b.attrs["data-label"]));
    c.add("G3.labels_text_from_table", p.parts.every((k) => labels.some((l) => l.attrs["data-label"] === k && l.text.includes(S[k]))), "");
    await labelsLayout(c, "[data-label]", "data-label");
    const refs = new Map();
    for (const k of p.parts) refs.set(k, await c.visible(`[data-part="${k}"]`));
    anchored(c, labels, refs, "data-label", { maxGap: 56 });   // a short leader line is allowed (seam)
    // a label written over ANOTHER part reads as that part's name: sample points of the label's box and look at the
    // drawn part under it (through every layer; a group's box is too coarse to decide this)
    const onOther = await c.page.evaluate(() => {
      const out = [];
      for (const l of document.querySelectorAll("[data-label]")) {
        const r = l.getBoundingClientRect(); if (!r.width) continue;
        const own = l.getAttribute("data-label"); const hits = {};
        for (let i = 1; i < 4; i++) for (let j = 1; j < 4; j++) {
          const part = document.elementsFromPoint(r.x + (r.width * i) / 4, r.y + (r.height * j) / 4).map((e) => e.closest("[data-part]")).find(Boolean);
          if (part) hits[part.getAttribute("data-part")] = (hits[part.getAttribute("data-part")] ?? 0) + 1;
        }
        for (const [k, n] of Object.entries(hits)) if (k !== own && n >= 3) out.push(`${own} on ${k}`);
      }
      return out;
    });
    c.add("G4.label_not_on_other_part", onOther.length === 0, [...new Set(onOther)].slice(0, 3));
    // no hint: no part outlined, glowing or dimmed differently from the rest before the tap
    const sig = await c.page.$$eval("[data-part]", (els) => els.map((e) => { const cs = getComputedStyle(e); return [cs.outlineStyle, cs.filter, cs.boxShadow, (+cs.opacity).toFixed(1)].join("|"); }));
    c.add("G8.no_part_marked", new Set(sig).size === 1, [...new Set(sig)].slice(0, 3));
    await wrongThenRight(c, { sel: "[data-part]", attr: "data-part", wrong: p.parts.find((k) => k !== p.ask), right: p.ask });
    await doneCalled(c);
  },
};
