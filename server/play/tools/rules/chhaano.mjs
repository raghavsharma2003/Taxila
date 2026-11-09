// Play coverage rules for the chhaano family (round 7: separating mixtures, class 6 science; never timed). Authored:
// choosing a pile and a method, the law splitting it by the one difference the method uses (threshing frees grain from the
// stalks; in winnowing the lighter part is carried farther and the heavier falls near; handpicking takes the few visible
// pieces of another colour or shape; a sieve lets through what is smaller than its holes), IS describing each method and
// the difference it uses (c6-science-ch09-t01 s2: farak, two parts and the one method their difference allows); taking a
// mixture of three or four parts apart with two or three methods in turn, threshing first, IS choosing a method or a
// sequence of methods (s3: kram). A beaker of water left undisturbed one wait at a time until its heavier insoluble solid
// has settled, then its clearer liquid poured off, IS sedimentation and decantation (ch09-t02 s1: nithaar); passing it
// through filter paper (the insoluble solid stays on the paper, the liquid and anything dissolved pass) IS filtration (s2:
// chhaan); drying the filtrate in the sun so the water goes and the dissolved salt or sugar stays, after the filter could
// not take it, IS recovering a dissolved solid by evaporation (s3, s2: namak).
// Mal-rules map to the topics' own kit misconceptions, the belief the same one: "ho gaya" after a single method with a pile
// still mixed is t01 m1 (any mixture by one method); the grain sack set far before winnowing (the husk lands in it) is t01
// m2 (the heavier part carried farther, or it does not matter which); a pile sieved whose parts are one size (they pass or
// stay together whatever their colour or weight) is t01 m3. Pouring away a liquid that holds the dissolved part the jars
// want (the puddle dries and the salt shows) is t02 m1; scooping the filter paper for the salt is t02 m2; "ho gaya" while a
// clear-looking liquid still holds it (a drop dries and leaves it) is t02 m3. Not admitted: t01 s1 (why we separate) and
// the nithaar / chhaan goals' beliefs (none of the kit's three shows there): no honest consequence yet.
import { R } from "./rule.mjs";

export const family = "chhaano";
const F = "chhaano";
export const RULES = [
  R("c6-science-ch09-t01", F, "sukha", "farak", { "heavy-far": "m2", "same-size": "m3" }, {}),
  R("c6-science-ch09-t01", F, "sukha", "kram", { "one-method": "m1", "heavy-far": "m2", "same-size": "m3" }, {}),
  R("c6-science-ch09-t02", F, "geela", "nithaar", {}, {}),
  R("c6-science-ch09-t02", F, "geela", "chhaan", {}, {}),
  R("c6-science-ch09-t02", F, "geela", "namak", { "salt-gone": "m1", "filter-salt": "m2", "clear-pure": "m3" }, {}),
];

export const ACTS = {
  "c6-science-ch09-t01|farak": ["s2"],          // each method and the difference it uses
  "c6-science-ch09-t01|kram": ["s3", "s2"],     // a sequence of methods for a mixture
  "c6-science-ch09-t02|nithaar": ["s1"],        // sedimentation and decantation
  "c6-science-ch09-t02|chhaan": ["s2"],         // filtration of insoluble solids
  "c6-science-ch09-t02|namak": ["s3", "s2"],    // a dissolved solid back by evaporation; filtration cannot remove it
};
