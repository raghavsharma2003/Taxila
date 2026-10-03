// The English chrome string table for the shell and the lesson (PRODUCT-DESIGN-V2 §5.4). UI copy only: these are
// rendered labels and NEVER prompt text (repo law: anything sentence-shaped in a prompt gets recited). The
// teacher's speech is not here; captions show exactly what she says, in her language.
// Rules carried from §5.4: sentence case, no exclamation marks in Older or parent chrome, no dashes, digits for
// numbers, "{T}" is the teacher's name from the character record, copy about the child uses the name or "they".
// G-EN-1: no Devanagari and no Hinglish chrome words anywhere in this file (tests/ui-v2/copy.test.mjs).
// Lives at src/ui/copy.ts because src/copy/** was outside this workstream's paths; src/copy/en.ts can re-export it.

export const EN = {
  // floor (the dock header word, §4.2)
  "floor.idle": "Ready",
  "floor.speaking": "{T} is talking",
  "floor.showing": "Watch",
  "floor.yielding": "Your turn",
  "floor.your_turn": "Your turn",
  "floor.mode.say_or_tap": "Say it, or tap",
  "floor.mode.tap_above": "Tap a picture above",
  "floor.mode.type": "Type it",
  "floor.mode.tray": "Use the activity above",
  "floor.mode.draw": "Draw it above",
  "floor.mode.read": "Read it out loud",
  "floor.mode.pad": "Use the numbers above",
  "floor.listening": "Listening… tap when you're done",
  "floor.listening_open": "Listening…",
  "floor.heard": "Got it",
  "floor.thinking": "{T} is thinking",
  "floor.thinking_s": "Thinking… {s} s",
  "floor.moment": "One moment. {T} is thinking.",
  "floor.last": "Last one",
  // screen reader (§4.2 last column)
  "sr.speaking": "{T} is talking",
  "sr.showing": "Watch the activity",
  "sr.your_turn": "Your turn. {ask}",
  "sr.your_turn_plain": "Your turn",
  "sr.listening": "Listening",
  "sr.heard": "Got it",
  "sr.thinking": "{T} is thinking",
  // question card (§4.3)
  "card.hear": "Hear the question",
  "card.your_answer": "Your answer:",
  "card.your_question": "Your question",
  "card.not_sent": "Not sent yet",
  "card.sent": "Sent",
  "card.not_yet": "Let's look again",
  "card.partly": "Nearly. One part to fix.",
  "card.didnt_catch": "I didn't catch that.",
  "card.know_check": "Two quick ones, then we move on.",
  "card.fix": "Fix",
  "card.hint": "Hint",
  "card.step": "Step {n} of {m}",
  "card.goal": "Today: {topic}",
  // dock
  "dock.talk": "Talk",
  "dock.done": "Done",
  "dock.type": "Type",
  "dock.send": "Send",
  "dock.hint": "Hint",
  "dock.wait": "Wait",
  "dock.help": "Help",
  "dock.again": "Hear again",
  "dock.start": "Start",
  "dock.ready": "Ready",
  "dock.finish": "Finish",
  "dock.type_label": "Type your answer",
  "dock.numbers": "123",
  "dock.delete": "Delete",
  // top bar
  "bar.pause": "Pause",
  "bar.captions_on": "Captions on",
  "bar.captions_off": "Captions off",
  "bar.more": "More",
  "bar.report": "Report a problem",
  "bar.not_me": "That wasn't me",
  "bar.offline": "Offline",
  "bar.phase.warmup": "Warm-up",
  "bar.phase.teach": "Learn",
  "bar.phase.practice": "Try",
  "bar.phase.teachback": "Explain",
  "bar.phase.wrap": "Wrap",
  "bar.practice": "Practice",
  // the teacher label (§6.3.4, §8)
  "teacher.label": "{T} · AI teacher",
  "teacher.tag": "AI",
  "teacher.tag_name": "{T}, AI teacher",
  // tray
  "tray.watch": "Watch",
  "tray.board": "Board",
  "tray.choices": "Choices",
  "tray.activity": "Activity",
  // hint sheet (§6.4.3)
  "hint.title": "Hint",
  "hint.hint": "Hint",
  "hint.why": "Why?",
  "hint.know": "I know this",
  "hint.another": "Explain another way",
  "hint.slower": "Slower, please",
  "hint.skip": "Skip for now",
  // Young help menu (§6.4.4)
  "help.menu.again": "Hear it again",
  "help.menu.choices": "Show me choices",
  "help.menu.how": "Show me how",
  // pause (§6.4.1)
  "pause.title": "Paused",
  "pause.continue": "Continue",
  "pause.end": "End lesson",
  "pause.help": "Need help? Talk to a grown-up",
  // end confirm (§6.4.2)
  "end.title": "End the lesson?",
  "end.keep": "Keep going",
  "end.end": "End lesson",
  // safety help sheet (§6.4.9). Helpline numbers re-verified at launch [M: re-verify].
  "help.title": "You're not in trouble.",
  "help.sub": "You can talk to someone.",
  "help.grownup": "Talk to a grown-up at home",
  "help.childline": "Call Childline 1098",
  "help.telemanas": "Call Tele-MANAS 14416",
  "help.back": "Back to the lesson",
  "help.grownup_card": "{child} would like to talk to you.",
  "help.grownup_here": "I'm a grown-up",
  "help.grownup_back": "Back",
  // no mic (§6.4.7), tap to hear (§6.4.8), push-to-talk fallback (made visible)
  "mic.off_title": "Ask a grown-up to turn on the microphone",
  "mic.off_sub": "You can still answer by typing or tapping.",
  "mic.off_sub_young": "You can still answer by tapping.",
  "mic.not_now": "Not now",
  "mic.ptt": "Tap the mic to talk, then tap Done.",
  "mic.ptt_ok": "OK",
  "audio.tap_to_hear": "Tap to hear {T}",
  // trouble (§4.7)
  "trouble.T1": "Still working on it…",
  "trouble.T2": "No internet. You can keep going offline.",
  "trouble.T2_no_pack": "No internet. Your answers are saved.",
  "trouble.T3": "Voice typing isn't working right now. Tap or type your answer.",
  "trouble.T3_young": "Voice typing isn't working right now. Tap your answer.",
  "trouble.T4": "Your answer didn't send.",
  "trouble.T5": "Sound didn't play. Read it on the card.",
  "trouble.T6": "Can't hear {T}? Turn up the volume.",
  "trouble.T8": "Please ask a grown-up to sign in again.",
  "trouble.T9": "We couldn't start the lesson.",
  "trouble.back_online": "Back online.",
  "trouble.continue_live": "Continue with {T}",
  "trouble.finish_now": "Finish for now",
  "trouble.wait": "Wait",
  "trouble.try_again": "Try again",
  "trouble.use_offline": "Use offline lesson",
  "trouble.type_instead": "Type instead",
  "trouble.send_again": "Send again",
  "trouble.play_again": "Play again",
  "trouble.hear_now": "I can hear now",
  "trouble.sign_in": "Sign in",
  "trouble.go_home": "Go home",
  "trouble.starting": "Getting the lesson ready",
  // summary (§6.3.5)
  "summary.title": "What you did today",
  "summary.next": "Next time: {topic}",
  "summary.finish": "Finish",
  "summary.tried": "You tried {n} questions",
  "summary.tried_one": "You tried 1 question",
  "summary.answered": "You said",
  "summary.on_own": "On your own",
  "summary.with_help": "With a hint",
  "summary.show": "Show a grown-up?",
  "summary.show_yes": "Show",
  "summary.show_no": "Not now",
  "summary.show_title": "{child} did this today",
  "summary.show_done": "Done",
  "summary.nothing": "You listened to {T} today.",
  "summary.ending": "Saving today's lesson",
  // errors (§4.7)
  "error.generic": "Something went wrong. Try again.",
} as const;

export type CopyKey = keyof typeof EN;

/** Fill {T}, {child}, {ask}, {n}… The values are data (a name, a number); the template is chrome. */
export function t(key: CopyKey, vars: Record<string, string | number> = {}): string {
  return EN[key].replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}

/** A teacher's pronouns, from the character record's presented gender (V2 §8: never hard-coded in a string). */
export interface Pronouns { subject: string; object: string; possessive: string }
export function pronounsFor(presentedGender: string | undefined): Pronouns {
  if (presentedGender === "F") return { subject: "she", object: "her", possessive: "her" };
  if (presentedGender === "M") return { subject: "he", object: "him", possessive: "his" };
  return { subject: "they", object: "them", possessive: "their" };
}

/** Code points U+0900–U+097F (Devanagari): chrome must have none (G-EN-1). */
export const DEVANAGARI = /[\u0900-\u097F]/;
/** The Hinglish chrome wordlist of §5.3 (G-EN-1). Whole words, case-insensitive. */
export const HINGLISH_CHROME = [
  "ghar", "ruko", "bolo", "bas", "bhejo", "phir", "shuru", "chalo", "paath", "abhyaas", "pakka", "baari", "agla",
  "kyun", "aata", "karein", "karo", "humne", "banaya", "mera", "meri", "bagiya", "aasmaan", "tumhare", "aage", "chalein",
  "nahi", "haan", "yahan", "likho", "abhi", "baad", "mein", "suno", "kaise", "pata", "hafte", "kaam", "dekhein", "chhoo",
] as const;
const HINGLISH_RE = new RegExp(`\\b(${HINGLISH_CHROME.join("|")})\\b`, "i");
export function chromeViolation(s: string): string | null {
  if (DEVANAGARI.test(s)) return "devanagari";
  const m = s.match(HINGLISH_RE);
  return m ? `hinglish:${m[1]}` : null;
}
