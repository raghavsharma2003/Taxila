// The words a real-game engine shows (and its play chrome: the music toggle), in the lesson's language, from
// data/play/engine-words.json (lesson-language content beside the reaction bank; authored, never a model's). Same fill rule
// as src/play/copy.ts say(): {slot}s from on-screen values only.
import type { Lang } from "../../../shared/play.ts";
import data from "../../../data/play/engine-words.json";

const WORDS = (data as unknown as { words: Record<string, Record<Lang, string>> }).words;
export type WordKey = keyof typeof data.words;
export function word(lang: Lang, key: WordKey, vars: Record<string, string | number> = {}): string {
  const line = WORDS[key]?.[lang] ?? WORDS[key]?.hinglish ?? "";
  return line.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : ""));
}
