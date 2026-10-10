// The intake card (BUILD-SPEC §3.2; K3), drawn at the top of the Desk's Question card (patch K-P12) from the server's
// ui.intake (patch K-P11). It only names what the server mapped: the title and the class · subject · chapter trail come from
// the syllabus graph, never from a model's words and never from what the child said. Her questions stay in her caption and
// the card's ask; the chips stay in the tray; the mic and the lamp stay on the dock: the card adds no control of its own.
//   ask     a quiet "Today at school" label
//   which   "Which one was it?" (the two chapters are the tray's chips)
//   mapped  the target frame: the trail in mono, the topic title large (the confirm question sits under it as the ask)
//   plan    the mapped topic and one dot per planned part (no titles: TUTOR-MODEL's agenda strip)
import type { DeskModel } from "../../../child/lesson/model.ts";
import { kt } from "../copy.ts";

export function IntakeCard({ intake }: { intake: NonNullable<DeskModel["intake"]> }) {
  if (intake.phase === "ask") return <p className="kx-in kx-in--ask kx-label" data-testid="intake" data-phase="ask">{kt("intakeToday")}</p>;
  if (intake.phase === "which") return <p className="kx-in kx-in--ask kx-label" data-testid="intake" data-phase="which">{kt("intakeWhich")}</p>;
  const m = intake.mapped;
  const parts = intake.plan?.segments.length ?? 0;
  return (
    <div className="kx-in kx-in--target" data-testid="intake" data-phase={intake.phase}>
      <p className="kx-label kx-in-kicker">{intake.phase === "plan" ? kt("intakePlan") : kt("intakeFromSchool")}</p>
      {m && (
        <div className="kx-in-frame">
          <i className="kx-in-br kx-in-br--a" aria-hidden="true" /><i className="kx-in-br kx-in-br--b" aria-hidden="true" />
          <p className="kx-in-trail">{m.trail.join(" · ")}</p>
          <p className="kx-in-title">{m.title}</p>
        </div>
      )}
      {intake.phase === "plan" && parts > 0 && (
        <p className="kx-in-plan" role="img" aria-label={kt("intakePlanSteps", { n: String(parts) })}>
          {intake.plan!.segments.map((_, i) => <i key={i} className="kx-in-dot" style={{ animationDelay: `${i * 260}ms` }} />)}
        </p>
      )}
    </div>
  );
}
