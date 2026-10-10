// Face UI strings: interface labels only, English on every surface, never teacher lines (nothing here reaches
// compile()). The tutor picker that used the rest of this table is gone (round 4: ONE teacher, Asha,
// dc-r4-single-teacher-asha); what is left is the label every face carries.
const S = {
  aiTeacher: "AI teacher",
} as const;

export type PickKey = keyof typeof S;
/** English chrome on every surface (PRODUCT-DESIGN-V2 §5.3, G-EN-1): the family's language changes only what the
 *  teacher says, never a label (the Hinglish and Hindi columns are gone: scripts/lint-ui.mjs L-DEVA). */
export const p = (k: PickKey, _lang: string): string => S[k];
