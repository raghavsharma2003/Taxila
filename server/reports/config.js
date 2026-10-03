// Parent report configuration as data (docs/research/psychology/PARENT-REPORT.md, CONDUCTOR.md §7.3, X8, X11).
// Values tagged [U] are unmeasured design defaults. Change them here, never inline, and bump RENDER_VERSION when a
// change alters what a parent reads (stored reports are keyed by it, so an operator re-render is a new row).

/** Stored with every report; a template or rule change that alters parent text must bump it. */
export const RENDER_VERSION = "pr-2";   // pr-2: delayed-success copy, no interest line, no-lesson header, dated re-checks only in the future

/**
 * The calibration gate (COMPREHENSION-ENGINE.md §7.1 K7: ≥ 0.9 delayed accuracy at 1 and 4 weeks, ECE ≤ 0.05,
 * n ≥ 200 children). Until it passes, no parent string says pakka / mastered / learned / understood / can do: rows
 * describe evidence, never a certified state. Flipping this needs a context/measurements.md entry with the K7 numbers.
 */
export const CALIBRATION = Object.freeze({ k7Passed: false });

export const CADENCES = Object.freeze(["daily", "weekly"]);
export const LANGS = Object.freeze(["en", "hinglish", "hi"]);
/** child.language_pref → report language. */
export const LANG_OF_PREF = Object.freeze({ english: "en", hinglish: "hinglish", hindi: "hi" });

/**
 * Section caps per cadence (PARENT-REPORT §2, §9.1; weekly card ≤ 5 body lines). The planner picks by a FIXED
 * priority up to these caps; the gate throws if a render ever exceeds them (it never truncates).
 * Daily is pull-only in v1 (X11) and carries no home activity (PL6: at most one per week).
 */
export const CAPS = Object.freeze({
  daily: { strength: 1, row: 2, tricky: 1, interest: 0, home: 0, body: 5 },
  weekly: { strength: 1, row: 2, tricky: 1, interest: 0, home: 1, body: 5 },
});

/** Spoken-script budgets (PARENT-REPORT §9.1 weekly 60-90 s) at ~2.3 spoken words/s [U]. Over budget → throw. */
export const VOICE_WORDS = Object.freeze({ daily: 110, weekly: 200 });
/** And never longer than one /api/tts request takes (server/routes/tts.js MAX_TTS_CHARS), so speech is never cut. */
export const VOICE_CHARS = 1200;

/** Evidence windows. Delayed = the previous contact with the skill was in another session ≥ 20 h earlier (ledger DELAY_MS). */
export const DELAY_MS = 20 * 3600_000;
export const HISTORY_DAYS = 120;
/** A tricky line needs this many attempts in the window and fewer than half unaided first-try right [U]. */
export const TRICKY_MIN_N = 3;
/** Hedged misconception (PARENT-REPORT §4.5): a diagnostic item set — ≥ 3 discriminating answers, ≥ 2 matching [U]. */
export const MIXUP_MIN_N = 3, MIXUP_MIN_K = 2;
/**
 * No interest line (cap 0 above, no shape, no memory read): memory.text for kind=interest is free model paraphrase
 * written at lesson end (server/routes/lesson.js), not a typed value, so it cannot ride in a reviewed template
 * (decision reports-no-interest-line). Reverses when memory stores a typed interest id from a reviewed list with
 * per-language labels.
 */

/**
 * Lane B routing (MODEL-ROUTER.md row "Parent reports": taxila-brain primary, taxila-fast fallback). Lane B only
 * orders Lane A segments and picks approved connective ids (PARENT-REPORT §10.2); it never writes a claim.
 */
export const WRITER = Object.freeze({ effort: "low", maxTokens: 800, timeoutMs: 30_000 });
/** $ per 1M tokens → µ$ per token (MODEL-ROUTER §2, Azure retail read 2026-10-02). */
export const PRICE_MICRO_USD = Object.freeze({ "taxila-brain": { in: 4, out: 20 }, "taxila-fast": { in: 0.2, out: 1.2 } });
/** Job budgets (µ$) for the Conductor job kinds (server/conductor/config.js reads these). */
/**
 * Room for one worst-case brain call: worstCase() in writer.js = (prompt chars / 3) × 4 + 800 × 20 µ$. Measured
 * prompts (sim-week 2026-10-03 re-run, see context measurement reports-laneb-tokens) put a daily call well under
 * 25k µ$ and a weekly one under 40k with room for the fast fallback; a failed call is charged its worst case.
 * Cost per child-month ≈ per-report cost × (A active days + 4.3 letters); A is not measured on real families.
 */
export const JOB_BUDGET = Object.freeze({ daily: 25_000, weekly: 40_000 });
