// Golden build mechanic (hand-written; the builder's reference and the QA gate's clean control).
// The child stacks tens-rods and ones-cubes onto a cart, then checks. facts() reports the counts per unit kind
// (n_0, n_1, …) so the kit's shadow can verify them after every action.
defineMechanic({
  id: "tower-build@1",
  archetype: "build",
  init(ctx) {
    const units = ctx.refs.units();
    return { n: units.map(() => 0), units };
  },
  reduce(m, action, ctx) {
    if (action.control === "confirm") return { model: m, commit: true };
    if (action.control === "clear") return { model: { n: m.n.map(() => 0), units: m.units } };
    const k = m.units.findIndex((u) => u.slot === action.ref.slot);
    if (k < 0) return { reject: "invalid" };
    const n = m.n.slice();
    if (action.type === "add") { if (n[k] >= 9) return { reject: "locked" }; n[k] += 1; }
    else if (action.type === "remove") { if (n[k] === 0) return { reject: "no_effect" }; n[k] -= 1; }
    else return { reject: "invalid" };
    return { model: { n, units: m.units }, fx: [{ kind: "pulse", target: (action.type === "add" ? "add" : "rem") + k }] };
  },
  feedback(m, result) {
    return m;
  },
  targets(m, ctx) {
    const out = [];
    m.units.forEach((ref, k) => {
      out.push({ id: "add" + k, kind: "block", op: "add", action: "add", valueRef: ref, rect: { x: 16 + k * 172, y: 250, w: 80, h: 60 } });
      out.push({ id: "rem" + k, kind: "block", op: "remove", action: "remove", valueRef: ref, rect: { x: 100 + k * 172, y: 250, w: 72, h: 60 } });
    });
    out.push({ id: "clear", kind: "control", control: "clear", action: "clear", rect: { x: 16, y: 324, w: 150, h: 60 } });
    out.push({ id: "check", kind: "control", control: "confirm", action: "check", rect: { x: 194, y: 324, w: 150, h: 60 } });
    return out;
  },
  render(m, draw, ctx) {
    draw.rect(0, 0, ctx.W, ctx.H, { fill: "paper" });
    draw.rect(20, 210, 320, 16, { fill: "earth", r: 6 });
    let x = 28;
    for (let i = 0; i < m.n[0]; i++) { draw.rect(x, 60, 14, 140, { fill: "sky", stroke: "ink", width: 1 }); x += 18; }
    for (let i = 0; i < (m.n[1] || 0); i++) { draw.rect(x, 186, 14, 14, { fill: "sun", stroke: "ink", width: 1 }); x += 18; }
    draw.numeral({ readout: "shadow" }, 300, 40, { size: 28, bold: true });
    draw.text("cart", 60, 40, { size: 16 });
  },
  facts(m) {
    const f = {};
    m.n.forEach((c, k) => { f["n_" + k] = c; });
    return f;
  },
});
