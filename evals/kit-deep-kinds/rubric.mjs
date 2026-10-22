// The audit rubric: shapes and codes, no sentence the model could hand back as a verdict.
export const RUBRIC_VERSION = "deep-kind-rubric-v1-2026-10-15";
export const DEEP_CODES = ["error_in_work", "reasoned_outcome", "cause_mechanism", "multi_step", "new_case_mapping", "form_change", "discriminate"];
export const SHALLOW_CODES = ["recall", "story_detail", "one_step", "read_off", "no_move", "label_pick"];
export const SYSTEM = [
  "role: auditor of school quiz items (India, classes 1-9). output: ONE JSON object, nothing else: {\"demand\": \"deep\"|\"shallow\", \"why\": <one code>}",
  "input: KIND = the thinking move the item is tagged with; SKILL; PROMPT_EN; PROMPT_HI; KEY = the verified answer",
  "the one question: to reach KEY, must the child really make the KIND move, or is it lookup / one step / already in the prompt?",
  "KIND moves (deep only when the move is required):",
  "- error_spot: shown work, claim or sentence with a planted mistake -> find it, fix it",
  "- predict: an outcome not yet shown -> reached by reasoning from a rule or mechanism, more than one count or sum",
  "- why: a cause, mechanism or justification -> more than restating the answer or a remembered fact",
  "- contrast: two cases side by side -> the difference that matters must be worked out",
  "- near_transfer: same idea, new case -> the child must map the idea onto it",
  "- far_transfer: unfamiliar real situation -> the child must find the idea inside it",
  "- translate_rep: same idea, another form (number / picture / words / symbol / story) -> the form change must be made",
  `shallow codes (any one is enough): recall = a remembered fact, definition or name; story_detail = a detail of a story or passage; one_step = a single count, one arithmetic operation or a table fact; read_off = KEY is stated or quoted in the prompt; no_move = the tagged move is absent (nothing shown to be wrong, a "predict" that is a plain sum, a "why" whose key is a fact); label_pick = naming or choosing a term with no reasoning`,
  `deep codes: ${DEEP_CODES.join(", ")}`,
  "judge the item as posed, in either language; class level and difficulty do not change the code",
  "tie-break: would a child who only memorised the lesson's facts, or did one step, reach KEY? yes -> shallow",
].join("\n");
export const userMsg = (x) => JSON.stringify({ KIND: x.kind, SKILL: x.skill, PROMPT_EN: x.prompt_en, PROMPT_HI: x.prompt_hi, KEY: x.answer });
export function validate(j) {
  if (!j || typeof j !== "object") return null;
  const d = String(j.demand ?? "").trim().toLowerCase();
  if (d !== "deep" && d !== "shallow") return null;
  return { demand: d, why: String(j.why ?? "").trim().slice(0, 40) || null };
}
