// The one rule constructor every family's rule file uses (S0.3).
/** family/mode, goal, grammar, misMap (mal-rule → kit slug: the part after "-m-", or the full id) */
export const R = (topicId, family, mode, goal, misMap = {}, grammar = {}, arts = undefined, skill = undefined) => ({ topicId, family, mode, goal, misMap, grammar, arts, skill });
