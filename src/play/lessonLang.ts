// Round 3 integration (2026-10-09): the lesson's language → play's language. The Desk hands every Studio renderer the
// child's lesson language as the product names it (child.language_pref: "hinglish" | "hindi" | "english"; LessonScreen
// media.lang), while play speaks "hinglish" | "hi" | "en" (shared/play.ts Lang). PlayStudioRenderer accepted only play's
// codes, so an ENGLISH lesson's game showed Hinglish words ("Utni hi roti, par alag tukdon mein", "Wapas", "Ho gaya") and a
// Hindi lesson's showed Roman Hinglish (local production build, c6-maths-ch07-t03, Meher english, phone + laptop). The
// server already maps both spellings the same way (server/play/start.js langOf).
import type { Lang } from "../../shared/play.ts";

const MAP: Record<string, Lang> = { en: "en", english: "en", hi: "hi", hindi: "hi", hinglish: "hinglish" };

/** The play language for a lesson language in either spelling; unknown → Hinglish (the product default). */
export const playLangOf = (l: unknown): Lang => MAP[String(l ?? "").toLowerCase()] ?? "hinglish";
