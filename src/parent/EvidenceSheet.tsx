// "Kaise pata?" (§6.4): the skill in outcome words, its ledger word, and one row per piece of evidence:
// date · what kind of check · the child's own words (<= 25, server-capped) · help used · next re-check.
// Deep-linkable at /parent/:cid/skill/:skill. Reads GET /api/parent/evidence (real evidence + skill_state rows).
import { Sheet, StateChip, STATE_MEANING, readLang } from "../ui/index.ts";
import { parentApi } from "./api.ts";
import { useParentData, PageState } from "./Shell.tsx";
import { KIND_WORDS, OUTCOME_WORDS, fmtDay, fmtDayLong, helpWords } from "./words.ts";

export function EvidenceSheet({ childId, skill, childName, onClose }: { childId: string; skill: string | null; childName: string; onClose: () => void }) {
  return (
    <Sheet open={!!skill} onClose={onClose} title="Kaise pata? How we know">
      {skill && <EvidenceBody childId={childId} skill={skill} childName={childName} />}
    </Sheet>
  );
}

function EvidenceBody({ childId, skill, childName }: { childId: string; skill: string; childName: string }) {
  const lang = readLang();
  const { data, err } = useParentData(() => parentApi.evidence(childId, skill), [childId, skill]);
  if (!data) return <PageState err={err} loading />;
  const counted = data.rows.filter((r) => r.outcome !== "no_evidence");
  return (
    <div className="stack ev-sheet">
      <div className="stack-sm">
        <h3 className="t-h3">{data.skill.title}</h3>
        {data.skill.topic && <p className="t-meta">{data.skill.topic.chapter} · {data.skill.topic.title}</p>}
        {data.skill.outcomes.length > 0 && (
          <ul className="plain-list t-meta">{data.skill.outcomes.slice(0, 2).map((o) => <li key={o}>{o}</li>)}</ul>
        )}
      </div>
      <div className="stack-sm">
        <StateChip state={data.state} lang={lang} nextReview={data.state.nextReview} />
        <p className="muted">{STATE_MEANING[data.state.key]}</p>
        {data.state.nextReview && <p><strong>Next check:</strong> {fmtDayLong(data.state.nextReview)}, in a later lesson.</p>}
      </div>
      {counted.length === 0 ? (
        <p className="note">No checks on this yet for {childName}.</p>
      ) : (
        <ol className="ev-list" aria-label="Evidence, newest first">
          {data.rows.map((r) => (
            <li key={r.id}>
              <span className="ev-date">{fmtDay(r.at)}</span>
              <span className="ev-what">{KIND_WORDS[r.kind] ?? KIND_WORDS.practice}</span>
              <span>{OUTCOME_WORDS[r.outcome]}{r.outcome !== "no_evidence" && <> · <span className="muted">{helpWords(r.hintsUsed)}</span></>}</span>
              {r.words && <q className="ev-quote">{r.words}</q>}
              {r.misconception && <span className="t-meta">The mix-up: {r.misconception}. This is a common and sensible idea to have on the way.</span>}
            </li>
          ))}
        </ol>
      )}
      <p className="t-meta">Each row is one check she recorded. If a word is not backed by a row, we do not show it.</p>
    </div>
  );
}
