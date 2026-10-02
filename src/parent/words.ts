// Plain words for evidence rows (§6.4: "what kind of check in plain words"). Behaviour only, never ability
// or affect (PX4, PX5); written as if the child will read it (PX8); gender-neutral ("they").
import type { EvidenceRow } from "./api.ts";

export const KIND_WORDS: Record<string, string> = {
  teachback: "Explained it in their own words",
  why: "Said why the answer is right",
  near_transfer: "Solved a new kind of question on the same idea",
  far_transfer: "Used it in a different situation",
  predict: "Said what would happen before seeing it",
  error_spot: "Spotted the teacher's deliberate mistake (a recognition check)",
  mixup_check: "A quick check for a common mix-up",
  contrast: "Told two similar things apart",
  retrieval: "Remembered it from an earlier lesson",
  other_representation: "Showed it another way: picture, number or words",
  practice: "A practice question",
};
export const OUTCOME_WORDS: Record<EvidenceRow["outcome"], string> = {
  correct: "Right",
  incorrect: "Not right this time",
  partial: "Partly right",
  misconception: "A common mix-up showed up",
  no_evidence: "Not counted: we could not hear clearly",
};
export const helpWords = (n: number) => (n <= 0 ? "On their own" : n === 1 ? "With 1 hint" : `With ${n} hints`);
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const fmtDayLong = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const SUBJECT_NAME: Record<string, string> = { maths: "Maths", science: "Science", evs: "EVS", english: "English", hindi: "Hindi", sst: "Social Science" };
