// Module planner (T1 engines): which engine to mount for a move, with what params, from the kit's
// formats.engineHints. Unknown engine names are allowed — the ModuleHost falls back. For predict /
// contrast / diagnostic items the engine mounts in "predict" mode (the answer-bearing visual hidden)
// and is revealed only once the item is over or the ladder reaches the hint rung (P5: predict BEFORE reveal).
import { extractValues, promptFor } from "./items.js";

const SHOW_MOVES = new Set(["explain", "reteach", "worked_example", "show_module"]);
const PREDICT_KINDS = new Set(["predict", "contrast", "translate_rep"]);
const CLEAR_MOVES = new Set(["teachback", "wrap", "safeguard", "break", "celebrate"]);
const NEW_ITEM_MOVES = new Set(["practice", "probe", "retrieval", "greet"]);

/** "Fraction bars" → "fraction-bars@1" (catalogue id shape). */
export function engineId(hint) {
  const base = String(hint).trim().toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ver = String(hint).match(/@(\d+)$/)?.[1] ?? "1";
  return `${base}@${ver}`;
}

/** Prefer the hint that shares a word with the remediation's representation; else the kit's first. */
function pickEngine(kit, representation) {
  const hints = kit.formats.engineHints;
  if (!hints.length) return null;
  const words = new Set(String(representation || "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
  return engineId(hints.find((h) => h.toLowerCase().split(/[^a-z]+/).some((w) => words.has(w))) ?? hints[0]);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Plan module commands for this move. Mutates `s.module` (the mounted module, if any).
 * @returns {import("../../shared/contracts").ModuleCommand[]}
 */
export function planModule(s, { move, item, kit, lang, representation }) {
  const cmds = [];
  const close = () => {
    if (s.module) cmds.push({ op: "unmount", moduleId: s.module.id });
    s.module = null;
  };
  if (CLEAR_MOVES.has(move.kind)) { close(); return cmds; }

  const wantsShow = SHOW_MOVES.has(move.kind);
  const wantsPredict = !!item && (PREDICT_KINDS.has(item.kind) || !!item.diagnostic) && NEW_ITEM_MOVES.has(move.kind);
  const cur = s.module;
  if (!wantsShow && !wantsPredict) {
    if (cur?.awaitingReveal) {
      const itemOver = !item || cur.itemId !== item.id;
      const helping = move.kind === "hint" && (move.hintLevel ?? 0) >= 2;
      if (itemOver || helping) { cmds.push({ op: "reveal", moduleId: cur.id }); cur.awaitingReveal = false; }
    }
    // A plain question on a different item gets the whiteboard anchor, not a stale module.
    if (cur && item && cur.itemId !== item.id && NEW_ITEM_MOVES.has(move.kind)) close();
    return cmds;
  }

  const engine = pickEngine(kit, representation);
  if (!engine) return cmds;
  const text = item ? promptFor(item, lang) : kit.workedExample?.problem ?? "";
  const params = {
    topicId: kit.topicId, skillId: move.skillId ?? item?.skillId ?? null, itemId: item?.id ?? null,
    mode: wantsShow ? "show" : "predict", lang, ...extractValues(text), ...(representation ? { representation } : {}),
  };
  if (cur && cur.engine === engine) {
    for (const [name, value] of Object.entries(params)) if (!same(cur.params[name], value)) cmds.push({ op: "set_param", moduleId: cur.id, name, value });
    Object.assign(cur, { params, itemId: params.itemId, awaitingReveal: params.mode === "predict" });
    return cmds;
  }
  close();
  const moduleId = `m${s.turn}`;
  cmds.push({ op: "mount", moduleId, engine, params, ...(params.mode === "predict" ? { goal: "predict" } : {}) });
  s.module = { id: moduleId, engine, params, itemId: params.itemId, awaitingReveal: params.mode === "predict" };
  return cmds;
}
