// duplex r3: simulate end-of-turn POLICIES on the pause table (eot-table.mjs) and score them exactly as eot.mjs scores the
// live engine (a commit inside an annotated hold >= 500 ms is a cut-off; the decision gap is the first commit at or after the
// annotated turn end, minus that end). Offline and fast: used to choose a design and its few parameters on the TRAIN half
// (even row ids) before the real engine is changed and re-scored on the replay harness (eot-replay.mjs) and live.
// A policy sees only what the engine saw at that tick (the table row), never the label.
import fs from "node:fs";
import zlib from "node:zlib";

export function loadTable(file) {
  const T = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
  const ix = Object.fromEntries(T.cols.map((c, i) => [c, i]));
  const sessions = T.shards.map((s) => {
    const rows = s.rows.map((r) => { const o = {}; for (const c of T.cols) o[c] = r[ix[c]]; o.text = s.texts[o.ti]; return o; });
    // episodes: consecutive rows with the same device offset
    const eps = [];
    for (const r of rows) {
      const last = eps.at(-1);
      if (last && last.offAt === r.offAt && r.t - last.rows.at(-1).t <= 400) last.rows.push(r); else eps.push({ offAt: r.offAt, rows: [r] });
    }
    for (const e of eps) e.turn = s.turns.find((tr) => e.offAt >= tr.start - 200 && e.offAt < tr.windowEnd) ?? null;
    return { shard: s.shard, turns: s.turns, eps, her: s.her, would: s.would };
  });
  return { rec: T.rec, sessions };
}

const q = (arr, p) => { if (!arr.length) return null; const z = [...arr].sort((a, b) => a - b); return Math.round(z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]); };
function wilson(k, n) { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)]; }

/** split: "all" | "train" (even numeric id) | "test" (odd). */
export const inSplit = (id, split) => split === "all" || (parseInt(id.replace(/\D/g, ""), 10) % 2 === 0) === (split === "train");

/**
 * Score a policy: policy(row, ep, ctx) → true to commit at that row. One commit per episode at most (the first true row);
 * a commit ends the episode. Returns the eot.mjs aggregate on the chosen split.
 */
export function score(table, policy, split = "all", opts = {}) {
  const per = [];
  for (const S of table.sessions) {
    const commits = [];
    for (const ep of S.eps) {
      if (!ep.turn || !inSplit(ep.turn.id, split)) continue;
      const ctx = { S, turn: ep.turn, her: S.her.find((h) => h.end <= ep.turn.start && h.end > ep.turn.start - 1000) ?? null };
      for (const r of ep.rows) if (policy(r, ep, ctx)) { commits.push({ t: r.t + (opts.extraMs ?? 0), why: r.reason ?? r.action, r }); break; }
    }
    for (const tr of S.turns) {
      if (!inSplit(tr.id, split)) continue;
      const inWin = commits.filter((c) => c.t >= tr.start && c.t < tr.windowEnd);
      const holds = tr.spans.slice(0, -1).map(([a, b]) => ({ ms: b - a, cut: inWin.some((c) => c.t > a + 20 && c.t < b), cutBy: inWin.find((c) => c.t > a + 20 && c.t < b) ?? null }));
      const voiced = []; let s = tr.start;
      for (const [a, b] of tr.spans.slice(0, -1)) { voiced.push([s, a]); s = b; }
      voiced.push([s, tr.end]);
      const inSpeech = inWin.filter((c) => voiced.some(([a, b]) => c.t >= a && c.t < b - 200)).length;
      const after = inWin.find((c) => c.t >= tr.end - 200);
      per.push({ id: tr.id, holds, inSpeech, gap: after ? Math.max(0, after.t - tr.end) : null, why: after?.why ?? null, endRow: after?.r ?? null });
    }
  }
  const holds = per.flatMap((p) => p.holds), h500 = holds.filter((h) => h.ms >= 500);
  const gaps = per.map((p) => p.gap).filter((g) => g !== null);
  const k = h500.filter((h) => h.cut).length;
  return {
    turns: per.length, holds500: h500.length, cut500: k, cutRate: h500.length ? +(k / h500.length).toFixed(3) : null, ci95: wilson(k, h500.length),
    cutAll: holds.filter((h) => h.cut).length, holdsAll: holds.length,
    s900: h500.filter((h) => h.ms > 900).length,
    inSpeech: per.reduce((a, p) => a + p.inSpeech, 0),
    gapP50: q(gaps, 0.5), gapP90: q(gaps, 0.9), gapMean: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
    missed: per.length - gaps.length, within350: gaps.filter((g) => g <= 350).length, within600: gaps.filter((g) => g <= 600).length,
    per,
  };
}

export const brief = (r) => ({ turns: r.turns, cut500: `${r.cut500}/${r.holds500} = ${(100 * r.cutRate).toFixed(1)}% [${r.ci95.map((x) => (100 * x).toFixed(1)).join("-")}]`, cutAll: `${r.cutAll}/${r.holdsAll}`, s900: r.s900, inSpeech: r.inSpeech, gap: `${r.gapP50} / ${r.gapP90} (mean ${r.gapMean})`, missed: r.missed, within350: r.within350, within600: r.within600 });
