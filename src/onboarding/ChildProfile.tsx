// P6 child profile (§2.2): a name, then taps. Class 1-9 as 3 × 3 tiles (>= 48 dp), board, school medium,
// how she should speak, tum / aap (aap default for Class 5-9; the child may override from B3 up), optional
// interests from a gender-neutral vetted set (no festival or religion tiles), optional comfort and
// hard-to-hear switches that never name a condition. Creates via POST /api/children, then stores the
// controls row (address, comfort, captions, report channel) via POST /api/parent/controls.
// `?add=1` is the second-child edge flow (P6 → P8 only).
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Chip, ErrorNote, Field, Icon, TileGroup } from "../ui/index.ts";
import { ApiError, errText, postJson, refreshMe, request } from "../app/api.ts";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";

const BOARDS = [
  { value: "cbse", label: "CBSE" }, { value: "ncert", label: "NCERT books" }, { value: "rbse", label: "RBSE" },
  { value: "icse", label: "ICSE" }, { value: "other-state", label: "Other state board" },
];
const MEDIUM = [{ value: "english", label: "English" }, { value: "hindi", label: "Hindi" }, { value: "other", label: "Other" }];
const SPEAK = [
  { value: "hindi", label: "हिन्दी", sub: "mostly Hindi", lang: "hi" }, { value: "hinglish", label: "Hinglish", sub: "a mix" },
  { value: "english", label: "English", sub: "mostly English" },
];
// Gender-neutral vetted set (§2.4 C3 rule); the child can still say something else in their first lesson.
const INTERESTS = ["Animals", "Cricket", "Cooking", "Drawing", "Music", "Space", "Machines", "Stories", "Plants", "Puzzles", "Football", "Dance"];

export function ChildStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const adding = !!sp.get("add");
  const [d, set] = useDraft();
  const c = d.child ?? {};
  const setC = (patch: Partial<NonNullable<typeof d.child>>) => set((cur) => ({ child: { ...(cur.child ?? {}), ...patch } }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cl = c.classLevel;
  const address = c.address ?? (cl ? (cl >= 5 ? "aap" : "tum") : undefined);
  const ready = !!c.firstName?.trim() && !!cl;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      const body = {
        firstName: c.firstName!.trim(), classLevel: cl, board: c.board ?? "cbse", schoolMedium: c.schoolMedium ?? "english",
        languagePref: c.languagePref ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : "hinglish"), interests: c.interests ?? [],
      };
      // Coming back to this step edits the profile made a moment ago instead of creating a second one.
      let child: { id: string } | null = null;
      if (d.childId) {
        child = await request<{ child: { id: string } }>("PATCH", "/api/children", { childId: d.childId, ...body }).then((r) => r.child, () => null);
      }
      if (!child) child = (await postJson<{ child: { id: string } }>("/api/children", body)).child;
      set({ childId: child.id });
      await postJson("/api/parent/controls", {
        childId: child.id, address, comfortMode: !!c.comfort, captionsAlways: !!c.hardToHear, reportChannel: d.reportChannel ?? "whatsapp",
      }).catch(() => { /* gate already set on a second child: controls are saved on the next step instead */ });
      await refreshMe();
      nav(`/start/controls${adding ? "?add=1" : ""}`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 401) return nav("/start/phone?next=/start/child");
      setErr(errText(e2));
    } finally {
      setBusy(false);
    }
  };

  const toggleInterest = (x: string) => {
    const cur = new Set(c.interests ?? []);
    if (cur.has(x)) cur.delete(x); else if (cur.size < 8) cur.add(x);
    setC({ interests: [...cur] });
  };

  return (
    <StepFrame step="child" title={adding ? "Add a child" : "About your child"} why="She uses this to pick the right chapter and the right way to talk.">
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="Child's first name" hint="Just the name they are called at home is fine." autoComplete="off" maxLength={40}
          value={c.firstName ?? ""} onChange={(e) => setC({ firstName: e.target.value })} required />
        <fieldset className="fs"><legend className="label">Class</legend>
          <TileGroup label="Class" columns={3} value={cl ?? null} onChange={(v) => setC({ classLevel: v, address: undefined })}
            options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: n, label: `Class ${n}` }))} />
        </fieldset>
        <fieldset className="fs"><legend className="label">Board</legend>
          <TileGroup label="Board" columns={2} value={c.board ?? null} onChange={(v) => setC({ board: v })} options={BOARDS} />
        </fieldset>
        <fieldset className="fs"><legend className="label">School teaches in</legend>
          <TileGroup label="School medium" columns={3} value={c.schoolMedium ?? null} onChange={(v) => setC({ schoolMedium: v })} options={MEDIUM} />
        </fieldset>
        <fieldset className="fs"><legend className="label">She should speak</legend>
          <TileGroup label="Teacher's language" columns={3}
            value={c.languagePref ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : "hinglish")} onChange={(v) => setC({ languagePref: v })} options={SPEAK} />
        </fieldset>
        {cl && (
          <fieldset className="fs"><legend className="label">She calls your child</legend>
            <TileGroup label="Address" columns={2} value={address ?? null} onChange={(v) => setC({ address: v as "tum" | "aap" })}
              options={[{ value: "tum", label: "tum" }, { value: "aap", label: "aap" }]} />
            {cl >= 5 && <p className="t-meta">From Class 5 your child can change this themselves.</p>}
          </fieldset>
        )}
        <fieldset className="fs"><legend className="label">Likes <span className="muted">(optional)</span></legend>
          <p className="t-meta">She uses these in examples. Your child can tell her more in the first lesson.</p>
          <div className="chips">
            {INTERESTS.map((x) => <Chip key={x} selected={(c.interests ?? []).includes(x)} onClick={() => toggleInterest(x)}>{x}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="fs"><legend className="label">Anything that helps <span className="muted">(optional)</span></legend>
          <div className="stack-sm">
            <Chip selected={!!c.comfort} onClick={() => setC({ comfort: !c.comfort })}>Larger text and a calmer screen</Chip>
            <Chip selected={!!c.hardToHear} onClick={() => setC({ hardToHear: !c.hardToHear })}>Finds it hard to hear: always show words</Chip>
          </div>
        </fieldset>
        <ErrorNote>{err}</ErrorNote>
        {!ready && <p className="t-meta">Add a name and a class to continue.</p>}
        <Button type="submit" block disabled={!ready || busy} icon={<Icon name="chevron" />}>{busy ? "Saving" : "Continue"}</Button>
      </form>
    </StepFrame>
  );
}
