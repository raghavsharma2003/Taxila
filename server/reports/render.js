// Admitted claims → the rendered report in one language (Lane A, deterministic). Section order is fixed
// (strengths first, RRI11): header · strength · rows · tricky · interest · home · footers. Voice-only frame lines
// (disclosure, close) are carried as lines with `voiceOnly` so the spoken script is built from lines only.
import { renderFixed, renderShape } from "./templates.js";

const ORDER = ["header", "exam", "strength", "change", "still", "row", "hold", "hard", "curious", "routine", "ways", "tricky", "interest", "next", "home"];
/** Lines Lane B may never drop from the spoken script. */
const MUST_KEEP = new Set(["header", "strength", "home"]);

/**
 * @param {{ cadence: string, claims: any[], fixedHome: boolean, fixedNext?: boolean }} built
 * @param {{ firstName: string }} child
 * @param {'en'|'hinglish'|'hi'} lang
 */
export function renderLang(built, child, lang) {
  const name = child.firstName;
  const lines = [];
  const fixed = (fixedId, section, extra = {}) => {
    const slots = fixedId === "disclosure" || fixedId === "home.generic" ? { name } : {};
    lines.push({ kind: "fixed", key: fixedId, fixedId, section, slots, text: renderFixed(fixedId, lang, slots), ...extra });
  };
  fixed("disclosure", "frame", { voiceOnly: true, mustKeep: true });
  for (const section of ORDER) {
    // only the FIRST line of a must-keep section is must-keep (a monthly report has up to 3 strengths)
    built.claims.filter((x) => x.section === section).forEach((c, i) => {
      lines.push({ kind: "claim", key: c.id, claimId: c.id, section, text: renderShape(c.shapeId, lang, c.slots), mustKeep: MUST_KEEP.has(section) && i === 0 });
    });
    if (section === "next" && built.fixedNext) fixed("next.generic", "next");
    if (section === "home" && built.fixedHome) fixed("home.generic", "home", { mustKeep: true });
  }
  fixed("close", "frame", { voiceOnly: true, mustKeep: true });
  fixed("footer.howweknow", "footer", { appOnly: true });
  fixed("footer.notamark", "footer", { appOnly: true });
  if (built.cadence === "monthly" || built.cadence === "term") fixed("footer.context", "footer", { appOnly: true });   // S16, once per monthly / term report
  const title = { kind: "fixed", fixedId: `title.${built.cadence}`, text: renderFixed(`title.${built.cadence}`, lang) };
  return { title, lines };
}
