// Step 2 "Meet {T}" (PRODUCT-DESIGN-V2 §3.2, §6.2, §8; audit #4, #24). The parent meets the teacher the child will
// actually get for the class chosen in step 1 (GET /api/child/teacher?classLevel= → the class's teacher; offline: the
// same rule locally, shared/tutors.js). ONE teacher, Asha, for every class (dc-r4-single-teacher-asha): there is no
// pick and no "the child will choose" (round 4). Same face as the lesson (the plate of the one rig), name from the
// character record, pronoun from the record (never hard-coded). The language she speaks is chosen here, once:
// English · Hindi · Hindi and English mix. A ▶ plays her greeting only when a clip exists IN HER OWN VOICE; a clip is
// never played under another teacher's face.
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type { TeacherCard } from "../../../shared/contracts.ts";
import { defaultTutorFor } from "../../../shared/tutors.js";
import { Button, Icon, TeacherFace, useClip, type Lang } from "../../ui/index.ts";
import { teacherRecord } from "../../ui/teacher/useTeacher.ts";
import { getJson } from "../../app/api.ts";
import { helloClip } from "../../child/voice.ts";
import { nextStep, StepFrame } from "../Layout.tsx";
import { setLangPref, useDraft } from "../draft.ts";

export type Speak = "english" | "hindi" | "hinglish";
export const LANGS: { id: Speak; ui: Lang; label: string }[] = [
  { id: "english", ui: "en", label: "English" },
  { id: "hindi", ui: "hi", label: "Hindi" },
  { id: "hinglish", ui: "hinglish", label: "Hindi and English mix" },
];
/** What Asha's greeting clip says, per language: her spoken words (shown on request), not chrome. */
const TRANSCRIPT: Partial<Record<string, Record<Speak, string>>> = {
  asha: {
    hindi: "नमस्ते! मैं आशा दीदी हूँ, एक कंप्यूटर टीचर, इंसान नहीं। मैं आपके बच्चे से बात करके पढ़ाती हूँ, और आपको दिखाती हूँ कि उसने सच में क्या समझा।", // lint-ui: speech
    hinglish: "Namaste! Main Asha didi hoon, ek computer teacher, insaan nahi. Main aapke bacche se baat karke padhaati hoon, aur aapko dikhaati hoon ki usne sach mein kya samjha.", // lint-ui: speech
    english: "Hello! I am Asha didi, a computer teacher, not a person. I teach your child by talking with them, and I show you what they have really understood.",
  },
};

interface Offer { teacher: { id: string; name: string; subject: string } }

function local(classLevel: number): Offer {
  const rec = teacherRecord(defaultTutorFor({ class_level: classLevel }), classLevel <= 4 ? "b2" : "b3");
  return { teacher: { id: rec.id, name: rec.name, subject: rec.pronouns.subject } };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function LangTile({ l, teacherId, selected, onPick }: { l: (typeof LANGS)[number]; teacherId: string; selected: boolean; onPick: () => void }) {
  const src = helloClip(teacherId, l.id);
  const { playing, toggle } = useClip(src ?? "");
  return (
    <div className={`onb-lang ${selected ? "onb-lang--on" : ""}`}>
      <button type="button" role="radio" aria-checked={selected} className="tile lang-tile" onClick={onPick}>
        <span className="lang-text"><span className="lang-word">{l.label}</span></span>
        <Icon name="tick" size={18} className="tile-tick" />
      </button>
      {src && (
        <button type="button" className="iconbtn onb-play" aria-pressed={playing} aria-label={playing ? `Stop: ${l.label}` : `Hear ${l.label}`}
          onClick={() => { onPick(); toggle(); }}>
          <Icon name={playing ? "stop" : "speaker"} />
        </button>
      )}
    </div>
  );
}

export function MeetStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const adding = sp.has("add");
  const [d, set] = useDraft();
  const cl = d.child?.classLevel;
  const [offer, setOffer] = useState<Offer | null>(cl ? local(cl) : null);
  useEffect(() => {
    if (!cl) return;
    let live = true;
    getJson<{ teacher: TeacherCard }>(`/api/child/teacher?classLevel=${cl}`).then((r) => {
      if (!live || !r?.teacher) return;
      setOffer({ teacher: { id: r.teacher.id, name: r.teacher.name, subject: r.teacher.pronouns?.subject ?? "they" } });
    }, () => {});
    return () => {
      live = false;
    };
  }, [cl]);
  if (!cl) return <Navigate to={`/start/class${adding ? "?add=1" : ""}`} replace />;
  const o = offer ?? local(cl);
  const speak = (d.child?.languagePref as Speak | undefined) ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : undefined);
  const pick = (l: (typeof LANGS)[number]) => {
    set((cur) => ({ lang: l.ui, child: { ...(cur.child ?? {}), languagePref: l.id } }));
    setLangPref(l.ui);
  };
  const they = cap(o.teacher.subject === "they" ? "they" : o.teacher.subject);
  const band = cl <= 4 ? "b2" : "b3";
  const transcript = speak ? TRANSCRIPT[o.teacher.id]?.[speak] : undefined;
  const title = `Meet ${o.teacher.name}`;

  return (
    <StepFrame step="meet" title={title} back
      footer={
        <div className="onb-go">
          {!speak && <span className="t-note" id="meet-why">Choose how {o.teacher.subject} speaks</span>}
          <Button block disabled={!speak} aria-describedby={speak ? undefined : "meet-why"} onClick={() => nav(nextStep("meet", adding))}>Continue</Button>
        </div>
      }>
      <div className="onb-meet">
        <figure className="onb-teacher" data-teacher-id={o.teacher.id}>
          <TeacherFace teacherId={o.teacher.id} band={band} size={220} />
        </figure>
      </div>
      <fieldset className="fs">
        <legend className="label">{`${they}'ll speak in:`}</legend>
        <div role="radiogroup" aria-label="Language" className="stack-sm">
          {LANGS.map((l) => <LangTile key={l.id} l={l} teacherId={o.teacher.id} selected={speak === l.id} onPick={() => pick(l)} />)}
        </div>
      </fieldset>
      {transcript && (
        <details className="card card-flat">
          <summary className="summary">What {o.teacher.subject} said</summary>
          <p data-speech="" lang={speak === "hindi" ? "hi" : "en"} style={{ marginTop: "var(--space-2)" }}>{transcript}</p>
        </details>
      )}
    </StepFrame>
  );
}
