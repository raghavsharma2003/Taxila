// Child chrome strings outside the lesson (PRODUCT-DESIGN-V2 §5.3, §5.4, §6.3): home, Hello, maps, notebook, ask,
// me and your teacher. ENGLISH ONLY (owner directive; G-EN-1): the family's language choice changes only what the
// teacher says, never a label. The Hindi and Hinglish tables that lived here are deleted (§5.3 "files to change").
// These are rendered labels and NEVER prompt text (repo law: anything sentence-shaped in a prompt gets recited).
// Style (§5.4): sentence case; no exclamation marks; Young labels ≤ 3 words (≤ 4 for B2), spoken on tap; no "kids",
// "champ", "genius", "smart", "buddy"; no dashes; digits for numbers; {T} is the teacher's name from the character
// record and her pronouns come from it; copy about the child uses their name or "they".
// Banned on child surfaces (PD-G18): streak, XP, coins, level up, unlock, rank, score, marks, "come back",
// "miss you", countdowns, and "{T} is resting / sleeping / waiting" (she has no life outside lessons, §6.3.3).
export type Lang = "hinglish" | "hindi" | "english";

const S = {
  // shared chrome
  home: "Home",
  grownups: "Grown-ups",
  grownupsName: "Grown-ups: parent corner",
  me: "Me",
  back: "Back",
  close: "Close",
  list: "List",
  map: "Map",
  garden: "Garden",
  sky: "Sky map",
  practice: "Quick practice",
  practiceYoung: "Practice",
  notebook: "Notebook",
  notesFriend: "Notes for a friend",
  ask: "Ask",
  today: "Today",
  aiTeacher: "AI teacher",
  teacherLabel: "{T} · AI teacher",
  grownupSignIn: "Please ask a grown-up to sign in again.",
  signIn: "Sign in",
  connectionWeak: "Something went wrong. Try again.",
  tryAgain: "Try again",
  loading: "Getting things ready",
  homeLoading: "Getting today ready",
  // home (§6.3.3, §5.4 home.*)
  todayLesson: "Today's lesson",
  firstLesson: "Your first lesson",
  startLesson: "Start a lesson",
  start: "Start",
  continueLesson: "Continue your lesson",
  continue: "Continue",
  doneToday: "Done for today",
  capped: "That's all for today. Your next lesson is tomorrow.",
  resting: "Lessons open again at {time}.",
  // §6.3.3 offline: "Practice works offline." is said ONLY when an offline pack is ready (plan.packReady); no pack
  // exists yet, so the no-pack line drops the promise (and Practice / Ask are not offered offline).
  offline: "Lessons need the internet. Practice works offline.",
  offlineNoPack: "Lessons need the internet.",
  practiseSomething: "Practise something",
  aboutMin: "About {n} min",
  youSaid: "You said",
  onYourOwn: "On your own",
  withAHint: "With a hint",
  triedN: "You tried {n} questions",
  triedOne: "You tried 1 question",
  yourSky: "Your sky",
  yourGarden: "Your garden",
  // maps (§3.8, §6.3.7, §4.8)
  classHere: "Your class is here",
  nOfMSecure: "{n} of {m} Secure",
  emptyGarden: "Let's plant the first one today.",
  emptySky: "Your first star appears after your first lesson.",
  startToday: "Start today's lesson",
  showsSoFar: "This shows what you've shown so far.",
  checkAgain: "{T} will check this again soon.",
  stateNotStarted: "Not started",
  statePractising: "Practising",
  stateGotIt: "Got it",
  stateSecure: "Secure",
  chapterDone: "Chapter complete",
  prevBed: "Previous bed",
  nextBed: "Next bed",
  worldView: "Picture",
  subject: "Subject",
  hiddenMap: "Your grown-up chose not to keep progress between days.",
  // notebook (§3.9)
  emptyNotebook: "Your notes will appear here after your first lesson.",
  // pages come from this device's lessons until the server lists them (open item): true for a child with lessons
  emptyNotebookLater: "Your next lesson will add a page here.",
  yourAnswer: "Your answer:",
  lessonOn: "Lesson",
  // ask (§3.7, §6.3.7)
  askTitle: "Ask {T} a question",
  askTile: "Ask a question",
  askField: "Your question",
  askPlaceholder: "Type your question",
  askGo: "Ask",
  askReason: "Type your question first",
  askType: "Type",
  // me (§6.3.8)
  yourTeacher: "Your teacher",
  wordsYoung: "Always show words",
  captions: "Captions",
  captionsAlways: "Always",
  captionsNeeded: "When needed",
  soundsYoung: "Sounds",
  soundsOlder: "Sound effects",
  talkMode: "Talk mode",
  tapToTalk: "Tap to talk",
  openMic: "Open mic (headphones only)",
  openMicNeeds: "Plug in headphones to use open mic.",
  teacherFace: "Teacher's face",
  faceMoving: "Moving",
  faceStill: "Still picture",
  faceVoice: "Voice only",
  calmer: "Calmer screen",
  lessMotion: "Less motion",
  biggerText: "Bigger text",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "Match phone",
  myPicture: "My picture",
  changePicture: "Change picture",
  whoSees: "What your grown-ups can see",
  whoSeesYoung: "Your grown-ups can see what you learn with {T}.",
  whoSeesList1: "What you have learned, and the answers that show it",
  whoSeesList2: "Short quotes from your lessons",
  whoSeesList3: "What you are still practising",
  whoSeesList4: "How long each lesson took",
  switchLearner: "Switch learner",
  on: "on",
  off: "off",
  // your teacher (§6.3.9)
  teacherOne: "{T} is your teacher.",
  teacherPickTitle: "Who would you like as your teacher?",
  teacherChoose: "Choose {T}",
  teacherChooseForMe: "Choose for me",
  teacherConfirm: "{T} will teach your next lesson. {T} will know what you've learned.",
  teacherYes: "Yes, choose {T}",
  teacherKeep: "Keep my teacher",
  teacherBetween: "You can change your teacher after this lesson.",
  teacherAskGrownup: "Ask a grown-up to change your teacher.",
  teacherCurrent: "Your teacher now",
  // Hello (§3.3, §6.3.2)
  tapToHear: "Tap to hear {T}",
  hearAgain: "Hear again",
  playing: "Playing",
  aiLine1: "I'm a computer teacher, not a person.",
  aiLine2: "Your grown-ups can see what we learn.",
  gotIt: "Got it",
  pickPicture: "Pick your picture",
  morePictures: "More pictures",
  thatsMe: "That's me",
  likesQ: "Your grown-up chose these. Are they right?",
  likesPick: "Pick up to 3",
  thatsRight: "That's right",
  change: "Change",
  done: "Done",
  helloNext: "Next",
  storyStart: "Let's start the first lesson.",
  olderStart: "Let's find what you already know. Nobody sees a score.",
} as const;

export type CopyKey = keyof typeof S;

/**
 * A chrome string. `vars` fills {T}, {n}, {time}…; the values are data (a name, a number), the template is chrome.
 * The second argument may still be the teacher's language from older call sites; it is ignored (English only).
 */
export function t(key: CopyKey, vars?: Record<string, string | number> | string): string {
  const v = typeof vars === "object" && vars ? vars : {};
  return S[key].replace(/\{(\w+)\}/g, (m, k: string) => (v[k] === undefined ? m : String(v[k])));
}

/** `lang` attribute of the chrome: always English (her captions carry their own lang). */
export const langAttr = (_lang?: string) => "en";

/** Every chrome string, for the G-EN-1 unit test. */
export const CHILD_STRINGS: readonly string[] = Object.values(S);

/** Local time "5:42 pm" from "HH:MM" (§5.4: times in the device's local time, lower-case am/pm). */
export function clock(hhmm: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? "");
  if (!m) return "7:00 am";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}
