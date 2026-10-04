// Shared steps for the W1-A production acceptance files (tests/prod/w1a-*.mjs). The leading underscore keeps it out of
// run.mjs's file pattern (it is not a test). Everything goes through the public API, as a child's client would.
import { askParity } from "../../server/director/say.js";

export { askParity };

/** A turn sender for one lesson: typed text, a chip tap, or a help request (a chip id from the Hint sheet / Help menu). */
export function turner(api, lessonId) {
  let seq = 0;
  const send = (body) => api("POST", "/api/lesson/turn", { lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
  return {
    say: (childText) => send({ childText }),
    tap: (chip) => send({ childText: chip.label, chipId: chip.id }),
    help: (id, label = id) => send({ childText: label, chipId: id }),
    get count() { return seq; },
  };
}

/**
 * Drive a text lesson until a turn grades an answer (ui.verdict), using only what a child can do: tap offered choices,
 * ask for choices on a question, or say "I know this" (help "know") on a teaching turn. Returns the turns.
 */
export async function driveToGraded(api, lessonId, first, { maxTurns = 16 } = {}) {
  const t = turner(api, lessonId);
  let last = first;
  const turns = [];
  for (let i = 0; i < maxTurns; i++) {
    const ui = last?.ui ?? {};
    const r = ui.chips?.length ? await t.tap(ui.chips[0])
      : ui.ask?.itemId ? await t.help("help_choices", "Show me choices")
        : await t.help("know", "I know this");
    turns.push(r);
    last = r;
    if (r.ui?.verdict || r.end) break;
  }
  return { turns, last, turner: t };
}

/** HH:MM now in IST. */
export function istNow() {
  const d = new Date(Date.now() + 330 * 60_000);
  return { h: d.getUTCHours(), m: d.getUTCMinutes() };
}

/** Lesson hours that exclude the current IST time (start < end, no wrap). */
export function closedHours() {
  const { h } = istNow();
  return h >= 2 ? { hoursStart: "00:00", hoursEnd: "01:00" } : { hoursStart: "12:00", hoursEnd: "13:00" };
}

/** Set the parent PIN with the account password: the corner is then unlocked for this session. */
export const setPin = (api, password, pin = "2580") => api("POST", "/api/parent/pin", { pin, password });

/** A second child on the same account, with every consent granted and the given controls. */
export async function addChild(api, child, controls) {
  const { child: c } = await api("POST", "/api/children", child);
  await api("POST", "/api/consent", { childId: c.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  if (controls) await api("POST", "/api/parent/controls", { childId: c.id, ...controls });
  return c;
}

/** Help-request words that must never appear as the child's words (the labels useDesk.ts REQUESTS sends). */
export const HELP_PHRASES = /choices dikhao|विकल्प दिखाइए|show me choices|hint chahiye|can i have a hint|isse abhi chhod|skip this for now|kaise karte hain dikhao|show me how|mujhe yeh aata hai|i know this|kisi aur tarah|explain it differently|thoda dheere|a bit slower|yeh kyun hota hai|show me why/i;
