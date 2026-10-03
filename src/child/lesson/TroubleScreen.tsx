// The full-screen trouble states (PRODUCT-DESIGN-V2 §4.7): T8 session expired ("Please ask a grown-up to sign in
// again.", the outbox is kept and sent after sign-in) and T9 the lesson could not start. Her still face, one
// sentence, the actions. Never a raw API string; a generic failure gets "Something went wrong. Try again." with a
// support code in meta size.
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import type { DeskActions, DeskModel } from "./model.ts";
import { stripRow } from "./TroubleStrip.tsx";

export function TroubleScreen({ m, id, onAction, code }: { m: DeskModel; id: "T8" | "T9"; onAction: DeskActions["troubleAction"]; code?: string | null }) {
  const row = stripRow(id, { noPack: m.noPack, young: m.family === "young" });
  return (
    <main className="dk-full" data-strip={id} data-testid="trouble-screen">
      <div className="dk-full-face">
        <Teacher teacherId={m.teacher.id} band={m.band} floor="idle" form="plate" label="below" lights="down" />
      </div>
      <h1 className="dk-full-title" tabIndex={-1}><Glyph name={row.glyph} size={28} />{t(row.text, { T: m.teacher.name })}</h1>
      <div className="dk-full-actions">
        {row.actions.map((x, i) => (
          <button key={x.a} type="button" className={`dk-btn ${i === 0 ? "dk-btn--primary" : "dk-btn--secondary"} dk-btn--tall`} onClick={() => onAction(x.a)} data-testid={`full-${x.a}`}>
            {t(x.label)}
          </button>
        ))}
      </div>
      {code && <p className="dk-code">{t("error.generic")} · {code}</p>}
    </main>
  );
}
