// Child first run (/c/:cid/hello, PRODUCT-DESIGN §2.4), C1-C3 on the client: hello (Young picks a picture,
// Older picks tum / aap), the fixed "computer teacher, who can see" disclosure, and interest tiles. C4-C6
// (placement, first win, show someone) are Director-run lesson steps: the last tile hands over to the lesson.
// Picks are saved to the child profile (PATCH /api/children) and to device prefs.
import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherStage } from "../../stage/TeacherStage.tsx";
import { updateChild } from "../api.ts";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { Arrow, EyeAdult, Play } from "../icons.tsx";

const silent = { value: 0 };

/** Fixed, never unlockable pictures (C1). Everyday objects, no festival or religious images. */
const PICTURES: { id: string; label: string; draw: ReactElement }[] = [
  { id: "kite", label: "patang", draw: <path d="M24 4 L40 22 L24 40 L8 22 Z M24 4 V40 M8 22 H40 M24 40 q-4 6 2 8" fill="#F5D46B" stroke="currentColor" strokeWidth="2.5" /> },
  { id: "mango", label: "aam", draw: <g><path d="M24 10 C36 10 40 22 36 32 C32 42 16 42 12 32 C8 22 14 10 24 10 Z" fill="#F2A93B" stroke="currentColor" strokeWidth="2.5" /><path d="M24 10 q4 -6 10 -6" stroke="#2F7A3E" strokeWidth="3" fill="none" /></g> },
  { id: "ball", label: "gend", draw: <g><circle cx="24" cy="24" r="16" fill="#2A72C6" stroke="currentColor" strokeWidth="2.5" /><path d="M8 24 H40 M24 8 C16 16 16 32 24 40 M24 8 C32 16 32 32 24 40" stroke="#fff" strokeWidth="2" fill="none" /></g> },
];

/** Interest tiles (C3): a gender-neutral vetted set, order randomised per visit. */
const INTERESTS: Record<string, [string, string, string]> = {
  animals: ["Jaanwar", "जानवर", "Animals"],
  sports: ["Khel", "खेल", "Sports"],
  trains: ["Rail gaadi", "रेल गाड़ी", "Trains"],
  drawing: ["Drawing", "चित्रकारी", "Drawing"],
  music: ["Gaana", "संगीत", "Music"],
  space: ["Antariksh", "अंतरिक्ष", "Space"],
  cooking: ["Khaana banana", "खाना बनाना", "Cooking"],
  plants: ["Paudhe", "पौधे", "Plants"],
};

export function Hello() {
  const { cid, child, band, family, lang, prefs, setPrefs, reducedMotion } = useChild();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const order = useMemo(() => Object.keys(INTERESTS).sort(() => Math.random() - 0.5).slice(0, family === "young" ? 6 : 4), [family]);
  const label = (row: [string, string, string]) => (lang === "hindi" ? row[1] : lang === "english" ? row[2] : row[0]);

  const finish = async () => {
    const chosen = [...interests.map((k) => INTERESTS[k][2].toLowerCase()), ...(other.trim() ? [other.trim().slice(0, 30)] : [])];
    setPrefs({ hello: true });
    try {
      if (chosen.length || prefs.picture) await updateChild(cid, { ...(chosen.length && { interests: chosen }), ...(prefs.picture && { avatar: prefs.picture }) });
    } catch {
      /* the lesson still starts; the picks stay on this device */
    }
    navigate(`/c/${cid}/lesson/new`);
  };

  const her = (
    <div className="tx-home-hero">
      <TeacherStage floor={null} teacherId={child.teacher_id} band={band} mouth={[silent]} reducedMotion={reducedMotion} badge={family === "young"} plainRoom={band === "b4"} />
    </div>
  );
  const next = (
    <button type="button" className="tx-tile tx-ring" style={{ alignSelf: "center", minWidth: 160 }} onClick={() => (step < 2 ? setStep(step + 1) : void finish())} data-testid="hello-next">
      {step < 2 ? <Arrow /> : <Play />}
      {step === 2 && t("startLesson", lang)}
    </button>
  );

  return (
    <main className="tx-screen" data-testid="hello" data-step={step}>
      {her}
      {step === 0 && (
        <section className="tx-stack" style={{ alignItems: "center" }}>
          <h1>{child.first_name}</h1>
          {family === "young" ? (
            <div className="tx-pictures" role="radiogroup" aria-label="picture">
              {PICTURES.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={prefs.picture === p.id} aria-pressed={prefs.picture === p.id} aria-label={p.label}
                  className="tx-tile tx-picture" onClick={() => setPrefs({ picture: p.id })}>
                  <svg viewBox="0 0 48 48" aria-hidden="true">{p.draw}</svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="tx-sheet-pair" role="radiogroup" aria-label="tum / aap" style={{ width: "100%", maxWidth: 360 }}>
              {(["tum", "aap"] as const).map((a) => (
                <button key={a} type="button" role="radio" aria-checked={prefs.address === a} className="tx-tile" style={prefs.address === a ? { borderColor: "var(--ink)", borderWidth: 3 } : undefined}
                  onClick={() => setPrefs({ address: a })}>
                  {a}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {step === 1 && (
        <section className="tx-stack" aria-label="who sees">
          <div className="tx-disclose">
            <span className="tx-stage-badge" style={{ position: "static", width: 56, height: 56 }} role="img" aria-label="computer teacher">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="13" rx="2.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.6" /><circle cx="9" cy="9.5" r="1.2" fill="var(--ink)" /><circle cx="15" cy="9.5" r="1.2" fill="var(--ink)" /><path d="M9 12.5 Q12 14.5 15 12.5" fill="none" stroke="var(--ink)" strokeWidth="1.4" /></svg>
            </span>
            <span>{lang === "hindi" ? "कंप्यूटर टीचर, इंसान नहीं" : lang === "english" ? "A computer teacher, not a person" : "Computer teacher, insaan nahi"}</span>
          </div>
          <div className="tx-disclose">
            <EyeAdult />
            <span>{lang === "hindi" ? "घर के बड़े देख सकते हैं" : lang === "english" ? "Your grown-ups can see your lessons" : "Ghar ke bade dekh sakte hain"}</span>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="tx-stack" style={{ width: "100%" }}>
          <div className="tx-tiles-grid" style={{ width: "100%" }} role="group" aria-label="interests">
            {order.map((k) => {
              const on = interests.includes(k);
              return (
                <button key={k} type="button" className="tx-tile" aria-pressed={on} style={on ? { borderColor: "var(--ink)", borderWidth: 3 } : undefined}
                  onClick={() => setInterests((xs) => (on ? xs.filter((x) => x !== k) : [...xs, k].slice(-3)))}>
                  {label(INTERESTS[k])}
                </button>
              );
            })}
          </div>
          {family === "older" && (
            <input className="tx-input" style={{ width: "100%" }} value={other} onChange={(e) => setOther(e.target.value)} placeholder={lang === "english" ? "Something else" : "Kuch aur"} aria-label="something else" />
          )}
        </section>
      )}
      {next}
    </main>
  );
}
