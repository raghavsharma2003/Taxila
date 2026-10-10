// Step 1 "Which class is your child in?" (PRODUCT-DESIGN-V2 §3.2, §6.2). Nine class tiles (3 × 3), a board choice, and
// (round 4 journey audit #12, the 5-step cut: was step 2 "Meet") the language Asha speaks, each with its ▶ sample in her
// own voice. While Continue is disabled its reason sits beside it.
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { defaultTutorFor } from "../../../shared/tutors.js";
import { Button, TileGroup } from "../../ui/index.ts";
import { teacherRecord } from "../../ui/teacher/useTeacher.ts";
import { nextStep, StepFrame } from "../Layout.tsx";
import { setLangPref, useDraft } from "../draft.ts";
import { LangTile, LANGS, type Speak } from "./Meet.tsx";

const BOARDS = [{ value: "cbse", label: "CBSE" }, { value: "rbse", label: "RBSE" }, { value: "other-state", label: "Other" }];

export function ClassStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const adding = sp.has("add");
  const [d, set] = useDraft();
  const c = d.child ?? {};
  const setC = (patch: Partial<NonNullable<typeof d.child>>) => set((cur) => ({ child: { ...(cur.child ?? {}), ...patch } }));
  const speak = (c.languagePref as Speak | undefined) ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : undefined);
  const pick = (l: (typeof LANGS)[number]) => {
    set((cur) => ({ lang: l.ui, child: { ...(cur.child ?? {}), languagePref: l.id } }));
    setLangPref(l.ui);
  };
  const rec = teacherRecord(defaultTutorFor({ class_level: c.classLevel ?? 5 }), (c.classLevel ?? 5) <= 4 ? "b2" : "b3");
  const ready = !!c.classLevel && !!c.board && !!speak;
  const why = !c.classLevel || !c.board ? "Choose a class and a board" : `Choose how ${rec.name} speaks`;
  return (
    <StepFrame step="class" back={adding} title={adding ? "Add a child: which class are they in?" : "Which class is your child in?"} docTitle="Class and board"
      footer={
        <div className="onb-go">
          {!ready && <span className="t-note" id="class-why">{why}</span>}
          <Button block disabled={!ready} aria-describedby={ready ? undefined : "class-why"} onClick={() => nav(nextStep("class", adding))}>Continue</Button>
        </div>
      }>
      <fieldset className="fs"><legend className="label">Class</legend>
        <TileGroup label="Class" columns={3} value={c.classLevel ?? null} onChange={(v) => setC({ classLevel: v, address: undefined })}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: n, label: `Class ${n}` }))} />
      </fieldset>
      <fieldset className="fs"><legend className="label">Board</legend>
        <TileGroup label="Board" columns={3} value={c.board ?? null} onChange={(v) => setC({ board: v })} options={BOARDS} />
      </fieldset>
      <fieldset className="fs">
        <legend className="label">{`${rec.name} will speak in`}</legend>
        <div role="radiogroup" aria-label="Language" className="stack-sm">
          {LANGS.map((l) => <LangTile key={l.id} l={l} teacherId={rec.id} selected={speak === l.id} onPick={() => pick(l)} />)}
        </div>
      </fieldset>
      {!adding && <Link to="/start/student" className="t-meta block-link">I am a student</Link>}
    </StepFrame>
  );
}
