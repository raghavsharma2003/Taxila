// Step 1 "Which class is your child in?" (PRODUCT-DESIGN-V2 §3.2, §6.2). Asked FIRST, so step 2 introduces the
// teacher the child will actually get (`eligibleTutors(class)`; audit #4: the parent met Asha, the Class 5 child got
// Arjun). Nine class tiles (3 × 3) and a board choice. While Continue is disabled its reason sits beside it.
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, TileGroup } from "../../ui/index.ts";
import { nextStep, StepFrame } from "../Layout.tsx";
import { useDraft } from "../draft.ts";

const BOARDS = [{ value: "cbse", label: "CBSE" }, { value: "rbse", label: "RBSE" }, { value: "other-state", label: "Other" }];

export function ClassStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const adding = sp.has("add");
  const [d, set] = useDraft();
  const c = d.child ?? {};
  const setC = (patch: Partial<NonNullable<typeof d.child>>) => set((cur) => ({ child: { ...(cur.child ?? {}), ...patch } }));
  const ready = !!c.classLevel && !!c.board;
  return (
    <StepFrame step="class" back={adding} title={adding ? "Add a child: which class are they in?" : "Which class is your child in?"} docTitle="Class and board"
      footer={
        <div className="onb-go">
          {!ready && <span className="t-note" id="class-why">Choose a class and a board</span>}
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
      {!adding && <Link to="/start/student" className="t-meta block-link">I am a student</Link>}
    </StepFrame>
  );
}
