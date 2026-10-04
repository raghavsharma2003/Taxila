// English chrome strings (PRODUCT-DESIGN-V2 §5.4; BUILD-PLAN §1 rule 4: every new child or parent label goes through
// here). UI copy only: rendered labels, NEVER prompt text (repo law: anything sentence-shaped in a prompt gets recited).
// The older tables stay where they are (src/ui/copy.ts for the shell and the lesson, src/child/copy.ts for the child
// screens); new labels land here, namespaced by the workstream that added them, so parallel streams never collide.
// Rules: sentence case; no exclamation marks; no dashes; digits for numbers; "{T}" is the teacher's name; copy about the
// child uses their name or "they". G-EN-1: English only, no Devanagari, no Hinglish chrome words.

/** W1-A: lesson truth and answer surfaces (refusal screens, help states, the pad, tap-and-type, open now). */
export const W1A = {
  // the start refusal (409 LessonStartRefused), V2 §6.3.3: done, capped and resting are designed screens, never an error
  "refused.done.title": "Done for today",
  "refused.done.body": "Today's lesson is finished. Practice and questions are open from home.",
  "refused.capped.title": "That's all for today",
  "refused.capped.body": "Your grown-up set a daily time for lessons, and today's time is used up. The next lesson is tomorrow.",
  "refused.resting.title": "Lessons open at {time}",
  "refused.resting.body": "Your grown-up set lesson hours from {from} to {to}.",
  "refused.resting.ask": "A grown-up can open lessons now from Controls.",
  "refused.home": "Back home",
  "refused.grownup": "Grown-up: open now",
  // the help states on the Question card: a help request is never "Your answer"
  "help.asked.hint": "Hint asked",
  "help.asked.choices": "Choices asked",
  "help.asked.how": "Asked how",
  "help.asked.why": "Asked why",
  "help.asked.another": "Asked another way",
  "help.asked.slower": "Asked slower",
  "help.asked.skip": "Skipped for now",
  "help.asked.know": "Said they know it",
  "help.menu.back": "Back to the numbers",
  "help.menu.back_choices": "Back to the choices",
  // the pad
  "pad.slash": "Fraction bar",
  // Me: tap and type
  "me.type.title": "Type instead",
  "me.type.on": "Lessons start with typing and tapping. {T} still talks.",
  "me.type.off": "Lessons start with talking. You can always type.",
  // parent Controls
  "controls.type.title": "Tap and type only",
  "controls.type.on": "On this phone, {name}'s lessons start with typing and tapping. {T} still talks.",
  "controls.type.off": "{name} talks to {T}, and can always type instead.",
  "controls.type.device": "This setting is saved on this phone.",
  "controls.open.title": "Open lessons now",
  "controls.open.button": "Open now for 1 hour",
  "controls.open.effect": "Opens lessons for the next hour, today only. The daily limit still holds.",
  "controls.open.done": "Lessons are open until {time} today.",
  "controls.open.busy": "Opening",
} as const;

export type W1AKey = keyof typeof W1A;

/** A W1-A label with its {vars} filled. */
export function tw(key: W1AKey, vars: Record<string, string | number> = {}): string {
  return W1A[key].replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}

/** W1-B: live activities (src/modules/host.tsx system notices over the activity frame). */
export const W1B = {
  "module.slow": "This activity is taking a while to load…",
  "module.dead": "This activity could not load. Your teacher will carry on without it.",
} as const;

export type W1BKey = keyof typeof W1B;
