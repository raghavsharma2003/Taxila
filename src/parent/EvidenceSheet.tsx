// "How do we know?" (PRODUCT-DESIGN-V2 §6.5.2): a bottom sheet at 360, a right drawer of 480 at 1280. The skill in
// parent words, its state shape and word (the SAME ledger state the home headline used: G-PARENT-1), then one row per
// check: the date, the kind of check in plain words, the child's own words (≤ 25, server-capped) and the verdict as a
// shape (tick, half tick, magnifier) with its words. Never red. "Next check: {day}" when one is scheduled ahead.
// Deep-linkable at /parent/evidence/:id?c=… . Reads GET /api/parent/evidence (evidence + skill_state rows).
import { Glyph, Sheet, StateChip, STATE_MEANING } from "../ui/index.ts";
import { parentApi } from "./api.ts";
import { fmtDay, fmtDayLong, helpWords, KIND_WORDS, labelTitle, OUTCOME_WORDS, outcomeGlyph } from "./copy.ts";
import { PageState, useParentData } from "./Shell.tsx";

export function EvidenceSheet({ childId, skill, childName, onClose }: { childId: string; skill: string | null; childName: string; onClose: () => void }) {
  return (
    <Sheet open={!!skill} onClose={onClose} title="How do we know?">
      {skill && <EvidenceBody childId={childId} skill={skill} childName={childName} />}
    </Sheet>
  );
}

function EvidenceBody({ childId, skill, childName }: { childId: string; skill: string; childName: string }) {
  const { data, err, reload } = useParentData(() => parentApi.evidence(childId, skill), [childId, skill]);
  if (!data) return <PageState err={err} loading onRetry={reload} />;
  const counted = data.rows.filter((r) => r.outcome !== "no_evidence");
  const label = data.skill.label ? labelTitle(data.skill.label) : data.skill.title;
  const ahead = data.state.nextReview && new Date(data.state.nextReview) > new Date() ? data.state.nextReview : null;
  return (
    <div className="pa-ev" data-evidence-state={data.state.key}>
      <div className="pa-ev-head">
        <p className="pa-ev-skill">{label}</p>
        {data.skill.topic && <p className="pa-meta">{data.skill.topic.chapter} · {data.skill.topic.title}</p>}
        <StateChip state={data.state} lang="en" />
        <p className="pa-muted">{STATE_MEANING[data.state.key]}</p>
      </div>
      {counted.length === 0 ? (
        <p className="pa-note">No checks on this yet for {childName}.</p>
      ) : (
        <ol className="pa-ev-list" aria-label="Checks, newest first">
          {data.rows.map((r) => {
            const g = outcomeGlyph(r.outcome);
            return (
              <li key={r.id} className="pa-ev-row" data-outcome={r.outcome}>
                <span className="pa-ev-date">{fmtDay(r.at)}</span>
                <span className="pa-ev-what">{KIND_WORDS[r.kind] ?? KIND_WORDS.practice}</span>
                <span className="pa-ev-verdict">
                  {g && <Glyph name={g} size={20} className="pa-ev-glyph" />}
                  <span>{OUTCOME_WORDS[r.outcome]}</span>
                  {r.outcome !== "no_evidence" && <span className="pa-muted"> · {helpWords(r.hintsUsed)}</span>}
                </span>
                {r.words && <q className="pa-quote">{r.words}</q>}
                {r.misconception && <span className="pa-meta">The mix-up: {r.misconception}. It's a common, sensible idea to have on the way.</span>}
              </li>
            );
          })}
        </ol>
      )}
      {ahead && <p><strong>Next check:</strong> {fmtDayLong(ahead)}, in a later lesson.</p>}
      <p className="pa-meta">Each row is one check from a lesson. A line on your home page only says what these rows show.</p>
    </div>
  );
}
