// Play coverage rules for yantra/roshni (round 7: sources of light and materials, class 7 science c7-science-ch11-t01; never
// timed: a switch, a screen or a cover changes only on a tap, and LOOK asks the law what the eye sees). Authored:
// - Placing the kit's screens (clear glass, clean water, air in an empty slot; butter paper, frosted glass, oiled paper;
//   cardboard, wood, a steel plate, a brick wall) between lit sources and the eye so the eye sees each light clearly, not
//   clearly, or not at all as the card shows IS classifying materials by how much light passes (s2: parda). Butter paper,
//   frosted glass or oiled paper in a lane the card wants clear (blur-clear) IS m3, translucent taken for transparent: the
//   eye sees that light, but not clearly.
// - Switching kit-named sources on and off (and, at looks 2-3, blocking a light with an opaque screen) so the eye sees
//   exactly the card's things IS seeing a non-luminous thing only by light from a source reflected into the eye (s3:
//   roshan). LOOK with the Moon wanted and no sunlight on it (moon-alone) IS m1, the Moon taken for a source: it stays dark.
//   LOOK with no light on at all (look-hard) IS m2: in the dark nothing is seen, however the eye looks.
// - Covering, with exactly as many cardboard covers as there are sources, everything that gives out its own light so the
//   eye sees nothing IS telling luminous from non-luminous (s1: dhak). A cover on the Moon (moon-cover) IS m1: the Sun
//   still shines on it; once the Sun is covered the Moon goes dark by itself.
import { R } from "../rule.mjs";

const Y = "yantra", T = "c7-science-ch11-t01";
export const RULES = [
  R(T, Y, "roshni", "parda", { "blur-clear": "m3" }, {}),
  R(T, Y, "roshni", "roshan", { "moon-alone": "m1", "look-hard": "m2" }, {}),
  R(T, Y, "roshni", "dhak", { "moon-cover": "m1" }, {}),
];
export const ACTS = {
  [`${T}|parda`]: ["s2"],          // transparent / translucent / opaque by what the eye sees through them
  [`${T}|roshan`]: ["s3"],         // a non-luminous thing is seen by a source's light reflected into the eye
  [`${T}|dhak`]: ["s1"],           // which things give out their own light (the Moon does not)
};
