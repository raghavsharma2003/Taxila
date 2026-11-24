// to-brain 053 G — the offline walk reads as the model does. The dry matrix calls no model: a line code cannot read (classifyFast has no
// result) is read as the model's own parser reads an empty label for that reader — parseClassification({}, target) — never a guess of its
// own. Release 59 did this for the teach-back reader; G does it for every reader the walk has:
//   - a card, an asked worked step, the closing question graded as a card (052 B2) — mode "item": no_evidence
//   - a why after a card — mode "why": no_evidence
//   - a check-in, an aside's return, the wrap's reply — mode "none" (nothing on the table): no_evidence
//   - the closing question's own reader — mode "teachback": incorrect where the kit lists ideas (nothing covered), else no_evidence
import { parseClassification } from "../../server/director/classify.js";

/** The offline reading of a line no code path read, for this reader (targetFor's target). */
export function dryReading(target) {
  const { modelFlags: _f, ...lab } = parseClassification({}, target);
  return { ...lab, flags: {}, source: "dry" };
}
