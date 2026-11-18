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

export const D30_PREDICATES = {};
