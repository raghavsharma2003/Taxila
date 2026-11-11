// Round 7 M5a: the scene's drawing palette (L-HEX, main 2026-11-05: moved out of ScenePlayer.tsx). Like the whiteboard's
// inks (src/modules/whiteboard/palette.ts), these are ART colours painted inside the stage box (sky, sea, leaf, fire), not
// app chrome, so they live in this one table; every scene component reads them from here.
/** Colour tokens → paint (one flat, friendly palette; the stage ground is the scene's background). */
export const PAINT: Record<string, string> = {
  sky: "#CDE8F6", night: "#1B2340", sea: "#3D8BD9", water: "#5BA8E8", land: "#8FBF6A", soil: "#8A5A3B", leaf: "#4CA35A", stem: "#3E7D3C",
  sun: "#F7C548", fire: "#E9762B", cloud: "#FFFFFF", ice: "#DDF1FB", earth: "#3D8BD9", moon: "#E7E3D3", metal: "#9AA5B1", copper: "#C8743A",
  wood: "#A86B3C", food: "#F2D29B", crust: "#C98B46", blood: "#D64550", paper: "#FFFBF2", ink: "#2B2620", soft: "#9AA5B1", accent: "#1F5FBF",
  mark: "#C8641A", good: "#2E7D4F", white: "#FFFFFF", shadow: "#1B2340",
};
export const GROUND: Record<string, string> = { sky: "#E6F4FC", night: "#151B33", paper: "#FFFBF2", lab: "#F2F4F7", field: "#EAF5E1" };
export const INK_ON: Record<string, string> = { night: "#F5F2E8" };
/** The default ink on a light ground. */
export const INK = "#2B2620";
/** The caption's pill behind her words: a deep blue on the night ground, white elsewhere. */
export const CAPTION_PILL = { night: "#2B3560", day: "#FFFFFF" } as const;
