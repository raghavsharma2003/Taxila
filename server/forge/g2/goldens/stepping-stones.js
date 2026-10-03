// Golden choice mechanic (hand-written; the builder's reference and the QA gate's clean control).
// A frog sits on the bank; the options are stones across a pond; tapping a stone hops the frog there and commits.
defineMechanic({
  id: "stepping-stones@1",
  archetype: "choice",
  init(ctx) {
    return { at: -1, hops: 0, opts: ctx.refs.options() };
  },
  reduce(m, action, ctx) {
    if (action.type !== "hop") return { reject: "invalid" };
    const i = m.opts.findIndex((o) => o.slot === action.ref.slot);
    if (i < 0) return { reject: "invalid" };
    return { model: { at: i, hops: m.hops + 1, opts: m.opts }, commit: true, fx: [{ kind: "pop", target: "stone" + i }] };
  },
  feedback(m, result) {
    return result.correct ? m : { at: -1, hops: m.hops, opts: m.opts };
  },
  targets(m, ctx) {
    const n = m.opts.length, gap = 12, w = Math.min(96, (ctx.W - gap * (n + 1)) / n);
    return m.opts.map((ref, i) => ({ id: "stone" + i, kind: "pad", op: "choose", action: "hop", valueRef: ref,
      rect: { x: gap + i * (w + gap), y: 190, w, h: 72 } }));
  },
  render(m, draw, ctx) {
    draw.rect(0, 0, ctx.W, ctx.H, { fill: "paper" });
    draw.rect(0, 150, ctx.W, 150, { fill: "water", opacity: 0.35, r: 24 });
    draw.rect(0, 320, ctx.W, 80, { fill: "leaf", opacity: 0.6 });
    draw.text("pond", ctx.W / 2, 130, { size: 18, fill: "ink" });
    const n = m.opts.length, gap = 12, w = Math.min(96, (ctx.W - gap * (n + 1)) / n);
    const fx = m.at < 0 ? ctx.W / 2 : gap + m.at * (w + gap) + w / 2, fy = m.at < 0 ? 350 : 180;
    draw.circle(fx, fy, 18, { fill: "leaf", stroke: "ink" });
    draw.circle(fx - 7, fy - 8, 4, { fill: "chalk" });
    draw.circle(fx + 7, fy - 8, 4, { fill: "chalk" });
  },
  facts(m) {
    return { at: m.at, hops: m.hops };
  },
});
