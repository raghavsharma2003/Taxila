// P0 language + her voice, P1 meet her, P1b taste (§2.2). First audio within a tap, before any field.
// Web: no autoplay (a gesture unlocks audio). Tiles commit on pointer-up; feedback on pointer-down.
import { Button, ButtonLink, Icon, Speaker, TeacherFace, useClip, type Lang } from "../ui/index.ts";
import { StepFrame } from "./Layout.tsx";
import { setLangPref, useDraft } from "./draft.ts";
import { Link, useNavigate } from "react-router-dom";

const LANGS: { id: Lang; label: string; sub: string; hi?: boolean }[] = [
  { id: "hi", label: "हिन्दी", sub: "Hindi", hi: true },
  { id: "hinglish", label: "Hinglish", sub: "Hindi + English" },
  { id: "en", label: "English", sub: "English" },
];
export const CLIP: Record<Lang, string> = { hi: "/audio/hello-hi.mp3", hinglish: "/audio/hello-hinglish.mp3", en: "/audio/hello-en.mp3" };
export const TRANSCRIPT: Record<Lang, string> = {
  hi: "नमस्ते! मैं आशा दीदी हूँ, एक कंप्यूटर टीचर, इंसान नहीं। मैं आपके बच्चे से बात करके पढ़ाती हूँ, और आपको दिखाती हूँ कि उसने सच में क्या समझा।",
  hinglish: "Namaste! Main Asha didi hoon, ek computer teacher, insaan nahi. Main aapke bacche se baat karke padhaati hoon, aur aapko dikhaati hoon ki usne sach mein kya samjha.",
  en: "Hello! I am Asha didi, a computer teacher, not a person. I teach your child by talking with them, and I show you what they have really understood.",
};

function LangTile({ l, selected, onPick }: { l: (typeof LANGS)[number]; selected: boolean; onPick: () => void }) {
  const { playing, toggle } = useClip(CLIP[l.id]);
  return (
    <button type="button" role="radio" aria-checked={selected} className="tile lang-tile"
      onClick={() => { onPick(); toggle(); }}>
      <span className="lang-play" aria-hidden="true"><Icon name={playing ? "stop" : "speaker"} /></span>
      <span lang={l.hi ? "hi" : undefined} className={l.hi ? "deva lang-word" : "lang-word"}>{l.label}</span>
      <span className="tile-sub">{l.sub}{playing ? " · playing, tap to stop" : ""}</span>
      <Icon name="tick" size={18} className="tile-tick" />
    </button>
  );
}

export function LangStep() {
  const [d, set] = useDraft();
  const nav = useNavigate();
  return (
    <StepFrame step="lang" back={false} title="Choose a language, and hear her"
      why="Tap one. She speaks in it. You can change this later."
      footer={<Button block disabled={!d.lang} onClick={() => nav("/start/meet")}>Continue</Button>}>
      <div role="radiogroup" aria-label="Language" className="stack-sm">
        {LANGS.map((l) => (
          <LangTile key={l.id} l={l} selected={d.lang === l.id} onPick={() => { set({ lang: l.id }); setLangPref(l.id); }} />
        ))}
      </div>
      <Link to="/start/student" className="t-meta" style={{ minHeight: 48, display: "inline-flex", alignItems: "center" }}>I am a student</Link>
    </StepFrame>
  );
}

export function MeetStep() {
  const [d] = useDraft();
  const lang: Lang = d.lang ?? "hinglish";
  return (
    <StepFrame step="meet" title="Meet her"
      footer={
        <div className="stack-sm">
          <ButtonLink to="/start/phone" block>Start for my child</ButtonLink>
          <ButtonLink to="/start/taste" variant="secondary" block>Hear more before you start</ButtonLink>
        </div>
      }>
      <div className="meet">
        <TeacherFace size={150} />
        <div className="stack-sm">
          <p className="t-lead"><strong>She is a computer teacher, not a person.</strong> She teaches your child by talking with them, and shows you what they really understood.</p>
          <Speaker src={CLIP[lang]} label="Play her introduction"><span>Play again</span></Speaker>
        </div>
      </div>
      <details className="card card-flat">
        <summary className="summary">What she says (text)</summary>
        <p lang={lang === "hi" ? "hi" : undefined} className={lang === "hi" ? "deva" : undefined} style={{ marginTop: "var(--space-2)" }}>{TRANSCRIPT[lang]}</p>
      </details>
    </StepFrame>
  );
}

/** P1b. A live taste needs a measured connect budget (M-ONB-1) first, so v1 offers the recording, labelled as one. */
export function TasteStep() {
  const [d] = useDraft();
  const lang: Lang = d.lang ?? "hinglish";
  return (
    <StepFrame step={null} title="Hear more"
      footer={<ButtonLink to="/start/phone" block>Start for my child</ButtonLink>}>
      <div className="note">A live one-minute talk with her is not ready yet. This is a <strong>recording</strong> of her voice.</div>
      <Speaker src={CLIP[lang]} label="Play the recording"><span>Play the recording</span></Speaker>
      <p className="muted">In a lesson she listens and answers live. She waits for your child, asks them to explain, and never gives the answer straight away.</p>
    </StepFrame>
  );
}
