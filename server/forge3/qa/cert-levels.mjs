// The served levels the play cert judges (moved out of play-cert.js so the law checks, server/forge3/qa/laws.mjs, read the
// same levels without loading the browser harness; play-cert.js re-exports it).

/**
 * Served levels for a coverage entry, as the play server would serve them to a fresh child of the entry's class: the
 * same session body startSession builds (server/play/start.js), seeds n = 0..k-1, the picker's garam door.
 */
export async function coverageLevels(entry, k = 2, opts = {}) {
  const { currentLevel, entryKey, seedOf } = await import("../../play/levels.js");
  const out = [];
  for (let n = 0; n < k; n++) {
    const key = entryKey(entry);
    const s = { childId: `qa-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
      mis: {}, pL: undefined, n: 0, seed: seedOf(`qa-${n}`, key, 0), door: "garam", recent: [], hist: null };
    try { const lv = currentLevel(s, entry); if (lv && !out.some((x) => x.levelId === lv.levelId)) out.push(lv); } catch { /* a generator that throws serves nothing */ }
  }
  // GAMES-01: the level served after the lesson saw a mapped misconception (the Director's focus) can be a different shape
  // (a judging strip pair, a no-CO2 leaf pair, a small key or scale); one per belief, when it differs from the above
  if (opts.focus) for (const kit of Object.values(entry.misMap ?? {})) {
    const key = entryKey(entry);
    const s = { childId: "qa-0", key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
      mis: { [kit]: 0.7 }, focus: kit, pL: undefined, n: 0, seed: seedOf("qa-0", key, 0), door: "garam", recent: [], hist: null };
    try { const lv = currentLevel(s, entry); if (lv && !out.some((x) => x.levelId === lv.levelId)) out.push(lv); } catch { /* serves nothing */ }
  }
  return out;
}
