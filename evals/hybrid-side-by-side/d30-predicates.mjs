// dc-r8-director29 (docs/patches/to-brain/045): the predicates Brain 045 adds, each written from the order's law and pinned non-zero on
// its director29 rows (tests/r8-director29-045.test.mjs) before it is trusted to read 0 on the dry matrix.
//   pictureDrawn   P1: on a picture turn the held panel Studio drew is the board the plan named — its template the preselected board's,
//                  its unit the intent's unit (never the lesson's held unit by default)

/** P1 (steering row 14 in all four pilots): read by dry-predicates' pictureDrawn, with its director22 reads. */
export function pictureNamedFlag(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const pic = !!r.held?.picture || /·\s*visual/.test(String(ctx?.prevRead ?? ""));
    if (!pic || !r.held) return null;
    const pre = r.screen?.preselected ?? null;
    const panel = r.held.layout?.panels?.find((p) => p.role === "held") ?? null;
    const drawn = panel?.template ?? r.held.pages?.[0]?.template ?? null;
    if (pre?.template && drawn && pre.template !== drawn) return `the picture drew ${drawn}, the plan named ${pre.template}`;
    const want = r.held.intent?.unit ?? null;
    if (panel?.unit && want && panel.unit !== want) return `the held panel is ${panel.unit}, the plan named ${want}`;
    return null;
}

/** P2: where a part's own words start — its recorded start, past any lead sentence the record folded into it (a seam's joint form: the
 *  easier-words line, a back-to line) — the one start every page is read against (c5-t01 stuck 8). */
export function partStartOf(r, p) {
  const t = String(r.text ?? "");
  const forms = (r.seams ?? []).filter((x) => x.joint && x.form).map((x) => String(x.form).replace(/\s+/g, " ").trim().toLowerCase());
  let at = p.from ?? 0;
  for (;;) {
    const rest = t.slice(at);
    const lead = rest.match(/^\s*/)[0].length;
    const f = forms.find((x) => rest.slice(lead).toLowerCase().startsWith(x));
    if (!f) return at + lead;
    at += lead + f.length;
  }
}

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en : x) ?? "";

/** P3: a turn that tells an asked step after the step's simpler was said — the second request's answer, as the order rules. */
export function stepToldAfterSimpler(L, r, i, script) {
  if (!r?.stepAnswer?.told) return false;
  const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
  if (!m) return false;
  const sk = (script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
  const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
  if (!simpler) return false;
  return (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").some((x) => low(x.text).includes(simpler.slice(0, 40)));
}

const TAUGHT = new Set(["point", "card", "returnCard", "workedProblem", "stepAsk", "remediation", "help", "quickAsk", "quick", "verdict", "missVerdict", "key"]);

export const D30_PREDICATES = {
  /** P4: the "nothing easier" line is never said before something has been taught (row 4 in stuck c4, c5-t02, c6; offtopic c4; steering c4,
   *  c5-t02, c6: a second request at the greeting). */
  helpSpentCold(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    const UNIT = /^(?:e\d+|rem:|then:|worked|check|c\d)/;
    const taught = (L.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && (x.pageParts ?? []).some((p) => ["body", "card", "simpler", "stepAsk", "quick"].includes(p.part) && UNIT.test(String(p.beat ?? ""))));
    return taught ? null : "the \"nothing easier\" line with nothing taught before it";
  },
  /** P3: at an asked worked step a give-up or a clarify gets the step's simpler first; the step is told only at the second request or after
   *  a wrong answer (c4 stuck 36; c5-t01 stuck 20; c5-t02 stuck 20, offtopic 16, steering 28; c6 stuck 20, offtopic 16, steering 28). */
  stepToldEarly(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.stepAnswer?.told) return null;
    const req = String(ctx?.prevIntent ?? r.cell?.column ?? "");
    if (!["give_up", "clarify"].includes(req) && !["give_up", "clarify"].includes(String(r.cell?.column ?? ""))) return null;
    const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
    if (!m) return null;
    const sk = (ctx.script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
    const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
    if (!simpler) return null;
    const before = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").map((x) => low(x.text)).join(" ");
    return before.includes(simpler.slice(0, 40)) ? null : `the step ${m[3]} told at a ${req} with its simpler unsaid`;
  },
};
