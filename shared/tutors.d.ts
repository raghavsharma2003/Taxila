// Types for shared/tutors.js (the tutor cast manifest + eligibility rules; AVATAR.md §7.5, trimmed to what M0 uses).
export type TutorLang = "english" | "hindi" | "hinglish";
export type RoleChip = "didi" | "bhaiya" | "maam" | "sir";
export type HairStyle = "ponytail" | "curls" | "bun";
export type Band = "b1" | "b2" | "b3" | "b4";

export interface TutorLook {
  rev: number;
  presentedGender: "F" | "M";
  apparentAge: number;
  /** Monk Skin Tone scale 1-10. */
  mst: number;
  signatureColor: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  glasses: "none" | "round" | "rect";
  top: string;
  topShade: string;
  accent: string;
  accentBorder: string;
  attire: "kurti-jacket" | "shirt-tee" | "saree";
  iris: string;
  lip: string;
}

export interface TutorCharacter {
  id: string;
  status: "draft" | "live" | "paused" | "retired";
  displayName: { roman: string; deva: string };
  roleChips: RoleChip[];
  /** B2: a 3-word style chip. */
  styleChip: Record<TutorLang, string>;
  /** B3+: a ≤ 8-word teaching-style note (product copy, reviewed; never persona text). */
  styleNote: Record<TutorLang, string>;
  fit: { offerClasses: [number, number]; wideOfferClasses: [number, number]; serveClasses: [number, number] };
  look: TutorLook;
  /**
   * The rig look this tutor wears (public/assets/teacher/<lookId>/<lookRev>/, src/avatar/looks.gen.json). Looks carry
   * no name: a child-named teacher points at a look id, never the reverse. Swapping the face is an asset change.
   */
  lookId: string;
  faceStyle: { smile: number; headGain: number; browGain: number };
  voice: { cps: number; speakerMeanHz: number };
}

export const CATALOGUE_REV: number;
export const TUTORS: TutorCharacter[];
export function tutorById(id: string | null | undefined): TutorCharacter | null;
export function bandOfClass(cls: number | string): Band;
export const CHOICE: Record<Band, [number, number]>;
export function seedOf(id: string): number;
export function rng32(seed: number): () => number;
export function seededShuffle<T>(list: T[], seed: number): T[];
export function pickCovering(shuffled: TutorCharacter[], max: number): TutorCharacter[];
export interface Eligibility {
  mode: "picker" | "single" | "none";
  band: Band;
  tutors: TutorCharacter[];
}
export function eligibleTutors(
  child: { id: string; class_level: number | string },
  opts?: { catalogue?: TutorCharacter[]; hasSheet?: (id: string) => boolean; allow?: string[] | null; offer?: "sheet" | "wide"; includeDraft?: boolean },
): Eligibility;
export function defaultTutorFor(child: { class_level: number | string }): string;

export const TEACHER_NAME: { readonly min: number; readonly max: number; readonly re: RegExp };
export const NAME_SUGGESTIONS: readonly string[];
export function normalizeTeacherName(raw: string | null | undefined): string;
export function teacherNameShape(name: string | null | undefined): "empty" | "length" | "charset" | null;
export function teacherNameSuggestions(characterId: string | null | undefined, opts?: { childFirstName?: string; exclude?: string | null }): string[];
