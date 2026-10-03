// Picker UI strings: interface labels only, English on every surface, never teacher lines (nothing here reaches
// compile()). Shapes from tutor-selection-ux §5.2: the frame question is a picture plus a verb-final question,
// gender-neutral in Hindi ("tumhe kaun padhaye" rather than a gendered "chahoge"); no friendship claim, no
// streak/reward words, no "come back".
export type PickLang = "hinglish" | "hindi" | "english";

const S = {
  question: "Who would you like to learn with?",
  sub: "Pick one teacher.",
  choose: "Choose",
  meet: "See",
  dice: "Pick for me",
  aiTeacher: "AI teacher",
  chosen: "Your teacher now",
  changeLater: "You can change later in My teacher.",
  start: "Let's start",
  only: "Your teacher",
  live: "Change teacher after the lesson",
  askGrownup: "Ask a grown-up",
  weak: "Connection is slow. Try again.",
  current: "Your teacher",
} as const;

export type PickKey = keyof typeof S;
/** English chrome on every surface (PRODUCT-DESIGN-V2 §5.3, G-EN-1): the family's language changes only what the
 *  teacher says, never a label (the Hinglish and Hindi columns are gone: scripts/lint-ui.mjs L-DEVA). */
export const p = (k: PickKey, _lang: string): string => S[k];

export const ROLE: Record<string, string> = { didi: "didi", bhaiya: "bhaiya", maam: "ma'am", sir: "sir" };
export const role = (r: string, _lang: string) => ROLE[r] ?? r;
