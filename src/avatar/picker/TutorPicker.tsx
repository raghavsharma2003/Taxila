// The tutor picker (C1b and "My teacher"; AVATAR.md §7.1, tutor-selection-ux §4, §5.2, §9). M0 scope:
//  - the offer and its order come from the server (GET /api/tutors): class-based, shuffled per child, NO default
//    highlighted; the current tutor (My teacher) is marked but never pre-selected for a first pick;
//  - tiles: still portrait (the 2D plate of the same person), name in Roman + Devanagari, role chip, B2 style chip /
//    B3+ style note, an always-present "AI teacher" chip, signature colour as a border only;
//  - selecting a tile wakes THAT tutor's live 3D head in place (at most one head at a time: the "one warm head"
//    rule); "Choose" is a separate control (never a second tap on the tile); "Pick for me" selects uniformly at
//    random and still waits for Choose; no timeout ever auto-picks;
//  - radiogroup semantics, arrow keys, 1-4 jump, Enter chooses; targets per band (B1 112 · B2 96 · B3 64 · B4 48 px).
//    The tiles hold NO interactive child (a radio's children are presentational: TalkBack flattens a nested button,
//    and axe flags nested-interactive); the one Choose button sits under the radiogroup, enabled once a tile is on;
//  - while a lesson is open (GET live) the "after the lesson" copy shows up front and Choose stays disabled.
// Not in M0 (open items): voiced previews rendered by the runtime (G-PREV), the name greeting on the head.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { getJson, postJson, ApiError } from "../../lesson/api.ts";
import { eligibleTutors, tutorById, type TutorCharacter } from "../../../shared/tutors.js";
import { Plate2D } from "../Plate2D.tsx";
// V4 patch 06 (Review v4): the face the child picks is the face that teaches. Where the puppet IS the tutor (Asha) and
// face.puppet2d is on, the picker shows the style-C puppet (live when selected, its rest poster on the tiles); every
// other tutor keeps TutorFace / Plate2D exactly as before.
import { LessonFace as TutorFace } from "../../face-puppet/LessonFace.tsx";
import { PuppetFace, PUPPET_TUTORS } from "../../face-puppet/PuppetFace.tsx";
import { puppet2dEnabled } from "../../face-puppet/flag.ts";
import { p, role } from "./copy.ts";
import "../avatar.css";

export interface TutorsResponse {
  /** null when the child row has no teacher_id yet (the class default applies). */
  current: string | null;
  chosen: boolean;
  mode: "picker" | "single" | "none";
  band: string;
  tutors: string[];
  live: boolean;
}

export interface TutorPickerProps {
  childId: string;
  /** Visual band (layout and target sizes). */
  band: "b1" | "b2" | "b3" | "b4";
  lang: string;
  reducedMotion?: boolean;
  /** Called after a successful pick (or "continue" when there is nothing to pick). */
  onDone: (tutorId: string) => void;
  /** Dev / screenshot mode: no API; the offer is computed locally, drafts included. */
  preview?: { classLevel: number; includeDraft?: boolean; offer?: "sheet" | "wide" };
  /** Injectable API (tests). */
  api?: { list(childId: string): Promise<TutorsResponse>; choose(body: unknown): Promise<unknown> };
}

const MIN_TARGET = { b1: 112, b2: 96, b3: 64, b4: 48 } as const;

const httpApi = {
  list: (childId: string) => getJson<TutorsResponse>(`/api/tutors?childId=${encodeURIComponent(childId)}`),
  choose: (body: unknown) => postJson("/api/tutors/choose", body),
};

export function TutorPicker(props: TutorPickerProps) {
  const { childId, band, lang, reducedMotion = false, onDone, preview } = props;
  const api = props.api ?? httpApi;
  const [data, setData] = useState<TutorsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [source, setSource] = useState<"child" | "child_random">("child");
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t0 = useRef(performance.now());
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (preview) {
      const el = eligibleTutors({ id: childId, class_level: preview.classLevel }, { includeDraft: preview.includeDraft, offer: preview.offer });
      setData({ current: "", chosen: false, mode: el.mode, band: el.band, tutors: el.tutors.map((x) => x.id), live: false });
      return;
    }
    let live = true;
    api.list(childId).then((d) => live && setData(d), () => live && setError(p("weak", lang)));
    return () => {
      live = false;
    };
    // The api object is fixed per mount; re-list only when the child or preview changes.
  }, [childId, preview?.classLevel, preview?.includeDraft, preview?.offer]);

  const tutors = useMemo(() => (data?.tutors ?? []).map((id) => tutorById(id)).filter((x): x is TutorCharacter => !!x), [data]);

  const choose = useCallback(async () => {
    if (!selected || busy || data?.live) return;
    setBusy(true);
    setError(null);
    try {
      if (!preview) await api.choose({ childId, tutorId: selected, source, shown: tutors.map((x) => x.id), msToChoose: Math.round(performance.now() - t0.current) });
      setDone(selected);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? p("live", lang) : e instanceof ApiError && (e.status === 423 || e.status === 403) ? p("askGrownup", lang) : p("weak", lang));
    } finally {
      setBusy(false);
    }
  }, [selected, busy, preview, api, childId, source, tutors, lang, data?.live]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tutors.findIndex((x) => x.id === selected);
    const n = tutors.length;
    if (/^[1-4]$/.test(e.key) && Number(e.key) <= n) {
      e.preventDefault();
      pick(tutors[Number(e.key) - 1].id, "child");
      tileRefs.current[Number(e.key) - 1]?.focus();
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const j = ((i < 0 ? (d > 0 ? -1 : 0) : i) + d + n) % n;
      pick(tutors[j].id, "child");
      tileRefs.current[j]?.focus();
    } else if (e.key === "Enter" && selected) {
      e.preventDefault();
      void choose();
    }
  };

  function pick(id: string, how: "child" | "child_random") {
    setSelected(id);
    setSource(how);
  }

  if (error && !data) return <main className="tx-picker"><p role="alert">{error}</p></main>;
  if (!data) return <main className="tx-picker" aria-busy="true" />;

  // Nothing to choose: never a fake one-tile choice.
  if (data.mode !== "picker" && !done) {
    const only = tutorById(data.current) ?? tutors[0] ?? null;
    return (
      <main className="tx-picker tx-picker-chosen" data-mode={data.mode}>
        <h1>{p("only", lang)}</h1>
        {only && <div className="tx-picker-stage"><TutorFace tutorId={only.id} band={band} status={null} teacher={[]} reducedMotion={reducedMotion} framing="medium" lang={lang} /></div>}
        {only && <p className="tx-tile-name">{only.displayName.roman} <small>{only.displayName.deva}</small></p>}
        <button type="button" className="tx-picker-go" style={{ minHeight: MIN_TARGET[band] / 2 + 24 }} onClick={() => onDone(only?.id ?? data.current)}>{p("start", lang)}</button>
      </main>
    );
  }

  if (done) {
    const tutor = tutorById(done)!;
    return (
      <main className="tx-picker tx-picker-chosen" style={{ ["--sig" as string]: tutor.look.signatureColor }} data-chosen={tutor.id}>
        <div className="tx-picker-stage">
          <TutorFace tutorId={tutor.id} band={band} status="your_turn" teacher={[]} reducedMotion={reducedMotion} framing="medium" lang={lang} />
        </div>
        <h1>{tutor.displayName.roman} <small>{tutor.displayName.deva}</small></h1>
        <p className="tx-picker-sub" role="status">{p("chosen", lang)}</p>
        {(band === "b3" || band === "b4") && <p className="tx-picker-note">{p("changeLater", lang)}</p>}
        <button type="button" className="tx-picker-go" onClick={() => onDone(tutor.id)}>{p("start", lang)}</button>
      </main>
    );
  }

  const older = band === "b3" || band === "b4";
  const selectedTutor = selected ? tutorById(selected) : null;
  return (
    <main className="tx-picker" data-band={band}>
      <h1 id="tx-pick-q">{p("question", lang)}</h1>
      <p className="tx-picker-sub">{p("sub", lang)}</p>
      <div className="tx-picker-grid" role="radiogroup" aria-labelledby="tx-pick-q" data-count={tutors.length} onKeyDown={onKey}>
        {tutors.map((tu, i) => {
          const on = selected === tu.id;
          const note = older ? tu.styleNote[lang as "english"] ?? tu.styleNote.hinglish : band === "b2" ? tu.styleChip[lang as "english"] ?? tu.styleChip.hinglish : null;
          return (
            <div
              key={tu.id}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              className="tx-tile-tutor"
              role="radio"
              aria-checked={on}
              aria-label={`${tu.displayName.roman}, ${p("aiTeacher", lang)}${note ? `, ${note}` : ""}`}
              tabIndex={on || (!selected && i === 0) ? 0 : -1}
              style={{ ["--sig" as string]: tu.look.signatureColor }}
              data-tutor={tu.id}
              data-status={tu.status}
              onClick={() => pick(tu.id, "child")}
            >
              <div className="tx-tile-portrait">
                {on && !reducedMotion ? (
                  <TutorFace tutorId={tu.id} band={band} status="your_turn" teacher={[]} reducedMotion={reducedMotion} framing="medium" lang={lang} />
                ) : PUPPET_TUTORS.has(tu.id) && puppet2dEnabled() ? (
                  <PuppetFace tutorId={tu.id} band={band} status={null} teacher={[]} still framing="medium" lang={lang} className="tx-tutorface-plate" />
                ) : (
                  <Plate2D tutor={tu} still reducedMotion={reducedMotion} className="tx-tutorface-plate" lang={lang} />
                )}
              </div>
              <p className="tx-tile-name">{tu.displayName.roman}<small lang="hi">{tu.displayName.deva}</small></p>
              <div className="tx-tile-chips">
                {tu.roleChips.map((r) => <span key={r} className="tx-chip">{role(r, lang)}</span>)}
                <span className="tx-chip tx-chip--ai">{p("aiTeacher", lang)}</span>
              </div>
              {note && <p className="tx-tile-note">{note}</p>}
            </div>
          );
        })}
      </div>
      {data.live && <p className="tx-picker-note" role="status">{p("live", lang)}</p>}
      <div className="tx-tile-actions tx-picker-actions" style={selectedTutor ? { ["--sig" as string]: selectedTutor.look.signatureColor } : undefined}>
        <button type="button" className="tx-choose" style={{ minHeight: MIN_TARGET[band] }} disabled={!selected || busy || data.live}
          onClick={() => void choose()}>
          {p("choose", lang)}
        </button>
      </div>
      <button type="button" className="tx-picker-dice" style={{ minHeight: MIN_TARGET[band] }} onClick={() => pick(tutors[Math.floor(Math.random() * tutors.length)].id, "child_random")}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style={{ verticalAlign: "-4px", marginRight: 6 }}>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          {[[8, 8], [16, 16], [12, 12], [16, 8], [8, 16]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />)}
        </svg>
        {p("dice", lang)}
      </button>
      {error && <p role="alert">{error}</p>}
      <p className="tx-sr" aria-live="polite">{selected ? `${tutorById(selected)?.displayName.roman}` : ""}</p>
    </main>
  );
}
