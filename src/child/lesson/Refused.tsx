// The designed screens for a refused start (PRODUCT-DESIGN-V2 §6.3.3; BUILD-PLAN W1-A items 1-2; flows G1, smooth G8).
// POST /api/lesson/start answers 409 LessonStartRefused { state, opensAt, capRemaining, control, window } when the plan
// refuses: today's lesson is done (Practice and Ask still pass), the daily limit is used, or it is outside the lesson
// hours. The child sees which one, and when lessons open, never "We couldn't start the lesson". No countdown, no "come
// back", and never "{T} is resting" (§6.3.3; PD-G18).
import { tw, tw2 } from "../../copy/en.ts";
import { clock } from "../copy.ts";

export { refusalOf, type StartRefusal } from "./answers.ts";
import type { StartRefusal } from "./answers.ts";

export function RefusedScreen({ refusal, young, onHome, onGrownUp }:
  { refusal: StartRefusal; young: boolean; onHome: () => void; onGrownUp: () => void }) {
  const r = refusal;
  // a safety hold (the Conductor, after a safeguarding incident): calm copy, both helplines printed, never a start
  // and never the grown-up "open now" (STUDENT-FLOW §4.2; the child-safety floor)
  if (r.state === "safety_hold") {
    return (
      <main className="dk-refused" data-testid="lesson-refused" data-state="safety_hold" data-control="safety" data-young={young ? "1" : undefined}>
        <section className="cs-card dk-refused-card" aria-labelledby="dk-refused-h">
          <h1 id="dk-refused-h" className="dk-refused-title">{tw2("home.hold.head")}</h1>
          <p className="dk-refused-body">{tw2("home.hold.sub")}</p>
          <p className="dk-refused-body" data-testid="refused-helplines">{tw2("home.hold.lines")}</p>
          <div className="dk-refused-actions">
            <button type="button" className="cs-btn cs-btn--primary" onClick={onHome} data-testid="refused-home">{tw("refused.home")}</button>
          </div>
        </section>
      </main>
    );
  }
  const title = r.state === "done" ? tw("refused.done.title")
    : r.state === "capped" ? tw("refused.capped.title")
      : tw("refused.resting.title", { time: clock(r.opensAt ?? r.window?.from ?? null) });
  const body = r.state === "done" ? tw("refused.done.body")
    : r.state === "capped" ? tw("refused.capped.body")
      : r.window ? tw("refused.resting.body", { from: clock(r.window.from), to: clock(r.window.to) }) : null;
  return (
    <main className="dk-refused" data-testid="lesson-refused" data-state={r.state} data-control={r.control ?? undefined} data-young={young ? "1" : undefined}>
      <section className="cs-card dk-refused-card" aria-labelledby="dk-refused-h">
        <h1 id="dk-refused-h" className="dk-refused-title">{title}</h1>
        {body && <p className="dk-refused-body">{body}</p>}
        {r.state === "resting" && <p className="dk-refused-body">{tw("refused.resting.ask")}</p>}
        <div className="dk-refused-actions">
          <button type="button" className="cs-btn cs-btn--primary" onClick={onHome} data-testid="refused-home">{tw("refused.home")}</button>
          {r.state === "resting" && !young && (
            <button type="button" className="cs-btn cs-btn--secondary" onClick={onGrownUp} data-testid="refused-grownup">{tw("refused.grownup")}</button>
          )}
        </div>
      </section>
    </main>
  );
}
