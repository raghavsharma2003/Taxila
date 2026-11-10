// The passage beat (docs/design/round7/learning/PASSAGE.md). A kit stores each story, poem, letter or scene once
// (TopicKit.passages) and an item points at it (KitItem.passageId). Before the first item that depends on a passage the child
// meets the passage: the teacher reads it aloud in classes 1-3, and from class 4 it is put on the board. PURE: no state, no model.
export const PASSAGE_ALOUD_MAX_CLASS = 3;

/** "aloud" (the voice reads the kit's own words, verbatim) for classes 1-3; "board" from class 4. */
export const passageMode = (classLevel) => (Number(classLevel) <= PASSAGE_ALOUD_MAX_CLASS ? "aloud" : "board");

/** The passage an item is about, or null. */
export const passageOf = (kit, item) => (item?.passageId ? (kit?.passages ?? []).find((p) => p.id === item.passageId) ?? null : null);

/**
 * The beat to run before `item` is posed, or null when it has no passage or the child already met it in this lesson.
 * @param {{ kit: import("../../shared/contracts").TopicKit, item: object, classLevel: number, shown?: string[] }} a
 * @returns {{ passageId: string, mode: "aloud" | "board", kind: "text" | "picture", title: string | null, text: string, lines: string[] } | null}
 */
export function passageBeat({ kit, item, classLevel, shown = [] }) {
  const p = passageOf(kit, item);
  if (!p || shown.includes(p.id)) return null;
  return { passageId: p.id, mode: passageMode(classLevel), kind: p.kind ?? "text", title: p.title ?? null, text: p.text, lines: p.text.split("\n").filter(Boolean) };
}

/** The ids of passages met so far, after `beat` ran (the lesson state keeps this list; it is part of the pinned kit's lesson). */
export const shownAfter = (shown, beat) => (beat ? [...new Set([...shown, beat.passageId])] : shown);

/** What the voice says for an "aloud" beat: the title, then the lines in order, as the kit wrote them. */
export const aloudText = (beat) => [beat.title, ...beat.lines].filter(Boolean).join("\n");
