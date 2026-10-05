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
  "pad.comma": "Comma",
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

/** W2-A: home states (STUDENT-FLOW §4.2), practice and Ask, the parent's one truth, sign-in and onboarding. */
export const W2A = {
  // home: the new states (one primary action each)
  "home.homework.head": "Homework help",
  "home.homework.sub": "Bring the question you are stuck on.",
  "home.homework.start": "Start",
  "home.homework.lesson": "Today's lesson",
  "home.test.head": "Revision for your {subject} test",
  "home.hold.head": "Let's take a break today.",
  // a grown-up the child TRUSTS, never "at home": a hold follows a safeguarding incident, which can be at home (floor > spec)
  "home.hold.sub": "Talk to a grown-up you trust.",
  "home.hold.lines": "Childline 1098 is free, any time. To talk about worries, Tele-MANAS is 14416.",
  "home.hold.help": "Help",
  "home.madefor.title": "Made for you",
  "home.madefor.play": "Play again",
  // practice
  "practice.count": "Practice · {n} of {of}",
  "practice.done": "That's the set",
  "practice.done.sub": "You did the whole set.",
  // Ask
  "ask.title.prefix": "Your question",
  // subjects in plain words
  "subject.maths": "maths",
  "subject.science": "science",
  "subject.evs": "EVS",
  "subject.english": "English",
  "subject.hindi": "Hindi",
  "subject.sst": "social science",
  // parent: the evidence sheet (who graded it) and the lesson card summary
  "evidence.prompt": "Question",
  "evidence.said": "{name} said",
  "evidence.grader.code": "Checked: exact answer",
  "evidence.grader.llm": "Checked against the book's key idea",
  "evidence.grader.human": "Checked by a person",
  "evidence.result.right": "Right, on their own",
  "evidence.result.right_hint": "Right, with a hint",
  "evidence.result.with_help": "Not yet on their own",
  "evidence.result.partly": "Partly right",
  "evidence.result.not_yet": "Not yet",
  "evidence.result.not_sure": "Said they were not sure",
  "evidence.result.mixup": "A common mix-up",
  "lesson.summary.title": "What the checks show",
  // parent Controls: per-child type-only, homework help, school test
  "controls.type.child": "Saved for {name} on every phone.",
  "controls.homework.title": "Homework help today",
  "controls.homework.on": "{name}'s home shows Homework help today. Today's lesson is still there.",
  "controls.homework.off": "{name}'s home shows today's lesson.",
  "controls.test.title": "School test coming up",
  "controls.test.none": "No test entered.",
  "controls.test.set": "{subject} test, {from} to {to}. Lessons revise {subject} until then.",
  "controls.test.subject": "Subject",
  "controls.test.from": "From",
  "controls.test.to": "To",
  "controls.test.save": "Save test dates",
  "controls.test.clear": "Remove",
  // parent: Made for {child}
  "parent.madefor.title": "Made for {name}",
  "parent.madefor.none": "Nothing made yet. {T} makes things when they help.",
  // sign-in and onboarding (flows G12)
  "auth.show": "Show",
  "auth.hide": "Hide",
  "auth.forgot": "Forgot password?",
  "auth.forgot.title": "Reset your password",
  "auth.forgot.body": "Enter the email you signed up with. We will send a link to set a new password.",
  "auth.forgot.send": "Send the link",
  "auth.forgot.sent": "If that email has an account, a link is on its way. It works for 30 minutes.",
  "auth.reset.title": "Set a new password",
  "auth.reset.save": "Save the new password",
  "auth.reset.done": "Your password is changed. You are signed in.",
  "auth.reset.bad": "This link has expired or was already used. Ask for a new one.",
  "auth.err.email.missing": "Enter your email.",
  "auth.err.email.bad": "That email does not look right. Check it and try again.",
  "auth.err.email.taken": "An account with this email already exists. Sign in instead.",
  "auth.err.password.missing": "Enter a password.",
  "auth.err.password.short": "Use at least 8 characters.",
  "auth.err.signin": "That email and password do not match.",
  "auth.err.name.missing": "Enter your name.",
  "auth.err.network": "We could not reach Taxila. Check the internet and try again.",
  "auth.err.generic": "Something went wrong. Please try again.",
  "auth.err.wait": "Too many tries. Wait a few minutes and try again.",
  // onboarding step 8: the sound and mic check
  "check.title": "Check sound and the microphone",
  "check.body": "So {child} can hear {T} and {T} can hear {child}.",
  "check.sound": "Play a sound",
  "check.sound.ok": "I heard it",
  "check.mic": "Test the microphone",
  "check.mic.listening": "Say something",
  "check.mic.ok": "The microphone works",
  "check.mic.no": "No microphone. {child} can type and tap instead.",
  "check.skip": "Skip for now",
  "check.next": "Continue",
} as const;

export type W2AKey = keyof typeof W2A;

/** A W2-A label with its {vars} filled. */
export function tw2(key: W2AKey, vars: Record<string, string | number> = {}): string {
  return W2A[key].replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}

/** A subject id in plain words (chrome). */
export const subjectWords = (s: string | null | undefined): string =>
  (s && (W2A as Record<string, string>)[`subject.${s}`]) || (s ?? "");

/** W2-H: the Studio stage (LIVE-STUDIO §4, STUDENT-FLOW §5.3): the caption chip, the child's controls, skeleton chrome. */
export const W2H = {
  // the caption chip while a piece is being made (rotated per lesson so it never becomes a tic)
  "making.0": "{T} is making this for you",
  "making.1": "{T} is drawing this for you",
  "making.2": "{T} is putting this together",
  // the child's controls on a piece
  "again": "Show me again",
  "notThis": "Not this one",
  "more": "More",
  // skeleton chrome (used only when the piece has no checked words of its own)
  "check": "Check",
  "right": "That's it",
  "wrong": "Not yet. Look again",
  "done": "All done",
  "shade": "Shade {f}",
  "jump": "Put the marker on {f}",
  "tap.most": "Tap the biggest",
  "tap.least": "Tap the smallest",
  "tap.earliest": "Tap the earliest",
  "tap.latest": "Tap the latest",
  "next": "What comes next?",
  "order": "Tap the steps in order",
  "sort": "Pick a card, then its box",
  "balance": "Which weight balances it?",
  "slider": "Move it, then answer",
  "find": "Find {p}",
  "ask": "Which one?",
  "less": "Less",
  "moreBtn": "More",
  "symbol": "1 symbol = {n}",
} as const;

export type W2HKey = keyof typeof W2H;

/** A W2-H label with its {vars} filled. */
export function tw2h(key: W2HKey, vars: Record<string, string | number> = {}): string {
  return W2H[key].replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}
