// The illustrated launch cast (PRODUCT-DESIGN §3.5, §4.7; avatar-cast decision ids). Flat fills plus one
// shade tone, rounded primitives, the fewest details needed. Identity anchors are constant across bands:
// face shape, skin tone from the skin ramp (never themed or filtered), scarf with the matka block-print
// border for the woman, chalk in hand. Non-sexualised by spec; no religious marks.

export interface CharacterLook {
  id: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: "bun" | "short" | "braid";
  kurta: string;
  kurtaShade: string;
  scarf: { fill: string; border: string } | null;
  glasses: boolean;
}

// Skin ramp values mirror --skin-1..6 (illustration only, never themed). Kept here because SVG fills are
// set per character, not per theme.
const SKIN = { s3: "#C99366", s3d: "#B07E55", s4: "#A9744A", s4d: "#93633D", s5: "#8A5634", s5d: "#764829" };

export const CAST: Record<string, CharacterLook> = {
  asha: {
    id: "asha", skin: SKIN.s3, skinShade: SKIN.s3d, hair: "#2A1C14", hairStyle: "braid",
    kurta: "#3E7C74", kurtaShade: "#32665F", scarf: { fill: "#F2D9A6", border: "#C2410C" }, glasses: false,
  },
  arjun: {
    id: "arjun", skin: SKIN.s4, skinShade: SKIN.s4d, hair: "#1F1712", hairStyle: "short",
    kurta: "#44607F", kurtaShade: "#384F69", scarf: null, glasses: false,
  },
  nandini: {
    id: "nandini", skin: SKIN.s5, skinShade: SKIN.s5d, hair: "#241812", hairStyle: "bun",
    kurta: "#7A4A6E", kurtaShade: "#653C5B", scarf: { fill: "#EADFC8", border: "#C2410C" }, glasses: true,
  },
};

export const lookFor = (teacherId: string | null | undefined): CharacterLook => CAST[teacherId ?? ""] ?? CAST.asha;

/** Outline weight by band (§4.7): B1 3 · B2 2.5 · B3 1.75 · B4 none. */
export const OUTLINE: Record<string, number> = { b1: 3, b2: 2.5, b3: 1.75, b4: 0 };
