// Play coverage rules for yantra/pendulum (round 7 E6; c7-science-ch08-t01, measuring time and the simple pendulum).
// Authored: setting the thread so the swing keeps a drum's beat IS predicting how length, bob mass and the size of the
// swing affect the time period (only length does: T = 2π√(L/g)); pressing "one more" each time the bob comes back to its
// start side, then dividing the stopwatch by the count, IS defining one oscillation and measuring the period by timing many.
// Mal-rules map to the topic's own kit misconceptions: changing the bob to change the rhythm is m1 (a heavier bob swings
// faster); changing the pull is m2 (a bigger pull changes the period a lot); one press at every end is m3 (one oscillation
// is only one side to the other). The builder checks every id against the kit.
import { R } from "../rule.mjs";

const T = "c7-science-ch08-t01";
export const RULES = [
  R(T, "yantra", "pendulum", "match", { "heavier-faster": "m1", "amplitude-period": "m2" }, { tol: 0.04 }),
  R(T, "yantra", "pendulum", "oscillation", { "half-oscillation": "m3" }, {}),
];

export const ACTS = {
  [`${T}|match`]: ["s3"],          // predict how thread length, bob mass and the swing affect the time period
  [`${T}|oscillation`]: ["s2"],    // one oscillation; the time period by timing many oscillations and dividing
};
