// Khand's words, shared by the 3D engine and its 2D board twin (src/play/families/nazariya/plot.view.ts): the goal line in
// the lesson language (copy.json; values from the law), never a verdict.
import type { Lang, PlayLevel } from "../../../../shared/play.ts";
import COPY from "./copy.json";
import { termOf, type PowersParams } from "../../families/nazariya/powers.logic.ts";

export const say = (lang: Lang, key: string, slots: Record<string, string | number> = {}): string => {
  const g = (COPY.goal as Record<string, Record<string, string>>)[key];
  const t = g?.[lang] ?? g?.en ?? "";
  return t.replace(/\{(\w+)\}/g, (_, k: string) => String(slots[k] ?? ""));
};
export const viewWord = (lang: Lang, v: string) => (COPY.views as Record<string, Record<string, string>>)[v]?.[lang] ?? v;
export function goalOf(level: PlayLevel, lang: Lang): string {
  const sp = level.params as Record<string, unknown>, mode = level.mode, goal = level.goal, fade = level.fade;
  if (mode === "views") return say(lang, sp.goal === "same" ? "views.same" : "views.build3", { view: viewWord(lang, String(sp.view ?? "front")) });
  if (mode === "array") return say(lang, goal === "turn" ? "array.turn" : fade === 3 ? "array.fill3" : "array.fill");
  if (mode === "floor") return say(lang, `floor.${goal}`, { n: Number(sp.n), a: Number(sp.a ?? 0) });
  if (mode === "powers") { const pw = sp as unknown as PowersParams; return say(lang, `powers.${pw.goal}`, { terms: Array.from({ length: pw.k }, (_, i) => termOf(pw.goal, i + 1)).join(", ") }); }
  if (mode === "mirror") return say(lang, sp.axis === "z" ? "mirror.z" : "mirror.x");
  return "";
}
