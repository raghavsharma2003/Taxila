// Yantra's words: the hints the 3D bench shows (copy.json, in the lesson language). The goal line, readouts and control
// labels are the beam law's shared words (src/play/engines/words.ts → data/play/engine-words.json), exactly as the 2D
// board twin (src/play/families/yantra/beam.view.ts) shows them, so the voice grammar and the evidence path do not move.
import type { Lang } from "../../../../shared/play.ts";
import COPY from "./copy.json";

export type HintKey = keyof typeof COPY.hint;
export const hint = (lang: Lang, key: HintKey): string => {
  const h = (COPY.hint as Record<string, Record<string, string>>)[key];
  return h?.[lang] ?? h?.en ?? "";
};
/** the BCP-47 tag a label in this lesson language carries (Hinglish is Hindi in Latin script) */
export const LANGTAG: Record<Lang, string> = { hinglish: "hi-Latn", en: "en", hi: "hi" };
