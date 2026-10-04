// Fixed-wording safety openings, per language mode (RELATIONAL-OS R3, §9.4; BUILD-PLAN W2-I #4). OWNED BY W2-I.
// W2 seam commit: src/lesson/floor.ts imports this module so the SAFETY floor state can play a vetted opening without the
// model (a heavy turn rate-limited into silence must still be answered: RELATIONAL-OS §15 failure modes). The wording is
// reviewed by the owner and a child-safety reviewer (O24) before it ships; it must carry Childline 1098 and Tele-MANAS
// 14416 digit-exact, never promise secrecy, name a trusted adult (not an assumed parent), and have no preface.
//
// Until W2-I fills it: safetyOpening returns null, and the safeguarding path is exactly today's (the server's fixed line
// with both helplines, the Help sheet).

export type SafetyLangMode = "hi" | "hinglish" | "en";

/** A vetted opening the client can speak or show at once on a safety turn. */
export interface SafetyOpening { mode: SafetyLangMode; text: string; helplines: { childline: "1098"; teleManas: "14416" } }

export function safetyOpening(_mode: SafetyLangMode): SafetyOpening | null {
  return null;
}
