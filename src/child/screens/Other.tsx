// Smaller child screens: map (§8.4-8.6), notes (§8.7), me (§2.8), doubt (§2.7), practice (§2.6) and the
// lesson route wrapper. Every one has a house back to home (Young ≤ 1 level deep).
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { House, Send } from "../icons.tsx";
import { LessonScreen } from "../lesson/LessonScreen.tsx";
import { readArtefacts, type ChildPrefs } from "../prefs.ts";
import { Aasmaan, Bagiya, SkillList } from "../progress/worlds.tsx";
import { useChildMap } from "../useChildMap.ts";
import type { MapSkill } from "../api.ts";

function Frame({ title, children, testid }: { title: string; children: ReactNode; testid: string }) {
  const { cid, lang } = useChild();
  return (
    <main className="tx-screen" data-testid={testid}>
      <div className="tx-topbar">
        <Link className="tx-iconbtn" to={`/c/${cid}`} aria-label={t("home", lang)}>
          <House />
        </Link>
        <h1 style={{ flex: 1 }}>{title}</h1>
      </div>
      {children}
    </main>
  );
}

export function LessonRoute() {
  const { lid } = useParams();
  // "new" (or any id this device is not running) starts the next planned lesson; there is no resume API yet.
  return <LessonScreen variant="lesson" key={lid} />;
}

export function PracticeRoute() {
  const { sid } = useParams();
  return <LessonScreen variant="practice" key={sid ?? "practice"} topicId={sid && sid !== "new" ? sid : undefined} />;
}

export function MapScreen() {
  const { cid, family, lang, prefs } = useChild();
  const { map, loading } = useChildMap(cid);
  const [view, setView] = useState<"world" | "list">("world");
  const [selected, setSelected] = useState<MapSkill | null>(null);
  const world = prefs.world ?? (family === "young" ? "bagiya" : "aasmaan");
  const skills = map?.skills ?? [];
  return (
    <Frame title={t(world === "bagiya" ? "garden" : "sky", lang)} testid="map">
      <div className="tx-row" role="tablist">
        <button type="button" role="tab" aria-selected={view === "world"} className="tx-tile tx-tile--plain" onClick={() => setView("world")}>
          {t(world === "bagiya" ? "garden" : "sky", lang)}
        </button>
        <button type="button" role="tab" aria-selected={view === "list"} className="tx-tile tx-tile--plain" onClick={() => setView("list")}>
          ☰
        </button>
      </div>
      {loading ? (
        <p className="tx-muted">…</p>
      ) : view === "list" || !skills.length ? (
        skills.length ? <SkillList skills={skills} lang={lang} words={family === "older"} /> : world === "bagiya" ? <Bagiya skills={[]} lang={lang} /> : <Aasmaan skills={[]} lang={lang} />
      ) : world === "bagiya" ? (
        <Bagiya skills={skills} lang={lang} />
      ) : (
        <>
          <Aasmaan skills={skills} lang={lang} selected={selected?.skillId} onSelect={setSelected} />
          {selected && (
            <div className="tx-card">
              <strong>{selected.title}</strong>
            </div>
          )}
        </>
      )}
    </Frame>
  );
}

export function Notes() {
  const { cid, family, lang } = useChild();
  const pages = readArtefacts(cid).slice().reverse();
  return (
    <Frame title={family === "young" ? t("notebook", lang) : t("myNotes", lang)} testid="notes">
      {/* Pages appear only from real lessons: no blank pages waiting, no page counts (§8.7). */}
      <ul className="tx-list">
        {pages.map((p) => (
          <li key={p.lessonId} className="tx-card">
            <strong>{p.topic}</strong>
            {p.chips.length > 0 && (
              <div className="tx-ledge tx-ledge--static" style={{ marginTop: 8 }}>
                {p.chips.map((c) => (
                  <span key={c} className="tx-chip"><span className="tx-num">{c}</span></span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function Doubt() {
  const { lang } = useChild();
  const [text, setText] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  if (asked) return <LessonScreen variant="doubt" firstText={asked} />;
  return (
    <Frame title={t("doubt", lang)} testid="doubt">
      <form
        className="tx-stack"
        style={{ width: "100%" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) setAsked(text.trim());
        }}
      >
        <textarea className="tx-input" style={{ width: "100%", minHeight: 120, padding: 12 }} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t("typeHere", lang)} aria-label={t("doubt", lang)} maxLength={600} />
        <button className="tx-tile tx-primary" disabled={!text.trim()}>
          <Send /> {t("send", lang)}
        </button>
      </form>
    </Frame>
  );
}

export function Me() {
  const { family, lang, prefs, setPrefs } = useChild();
  const older = family === "older";
  const row = (label: string, key: keyof ChildPrefs, on: boolean, set: (v: boolean) => void) => (
    <li className="tx-listrow tx-switch" key={key}>
      <label htmlFor={`pref-${key}`} style={{ flex: 1 }}>{label}</label>
      <input id={`pref-${key}`} type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
    </li>
  );
  return (
    <Frame title={t("me", lang)} testid="me">
      <ul className="tx-list">
        {row(t("captions", lang), "captionsAlways", prefs.captionsAlways, (v) => setPrefs({ captionsAlways: v }))}
        {row(lang === "english" ? "Sounds" : "Awaaz ke signal", "sounds", prefs.sounds ?? !older, (v) => setPrefs({ sounds: v }))}
        {row(lang === "english" ? "Quiet mode (type or tap)" : "Chup mode (likh kar)", "quiet", prefs.quiet, (v) => setPrefs({ quiet: v }))}
        {row(lang === "english" ? "Larger text" : "Bade akshar", "largeText", prefs.largeText, (v) => setPrefs({ largeText: v }))}
        {row(lang === "english" ? "Calmer screen" : "Kam halchal", "calm", prefs.calm, (v) => setPrefs({ calm: v }))}
        {row(lang === "english" ? "Garden / sky" : "Bagiya / Aasmaan", "world", (prefs.world ?? (older ? "aasmaan" : "bagiya")) === "aasmaan", (v) => setPrefs({ world: v ? "aasmaan" : "bagiya" }))}
        {older && row(lang === "english" ? "Open mic (headphones on)" : "Open mic (headphone lagaakar)", "talk", prefs.talk === "open", (v) => setPrefs({ talk: v ? "open" : "tap" }))}
        {older && row(lang === "english" ? "Mirror layout" : "Ulta layout", "mirror", prefs.mirror, (v) => setPrefs({ mirror: v }))}
        {row(lang === "english" ? "Bigger kid look" : "Bade bachchon wala look", "bandUp", prefs.bandUp, (v) => setPrefs({ bandUp: v }))}
      </ul>
      {older && (
        <div className="tx-card tx-stack">
          <strong>{lang === "english" ? "Teacher on screen" : "Teacher screen par"}</strong>
          <div className="tx-row" role="radiogroup">
            {(["face", "small", "voice"] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={prefs.face === f} className="tx-tile tx-tile--plain" style={prefs.face === f ? { borderColor: "var(--ink)", borderWidth: 3 } : undefined}
                onClick={() => setPrefs({ face: f })}>
                {f === "face" ? (lang === "english" ? "Face" : "Chehra") : f === "small" ? (lang === "english" ? "Small" : "Chhota") : t("voiceOnly", lang)}
              </button>
            ))}
          </div>
          <strong>{lang === "english" ? "Theme" : "Rang"}</strong>
          <div className="tx-row" role="radiogroup">
            {(["system", "light", "dark"] as const).map((th) => (
              <button key={th} type="button" role="radio" aria-checked={prefs.theme === th} className="tx-tile tx-tile--plain" style={prefs.theme === th ? { borderColor: "var(--ink)", borderWidth: 3 } : undefined}
                onClick={() => setPrefs({ theme: th })}>
                {th}
              </button>
            ))}
          </div>
        </div>
      )}
      {older && (
        <section className="tx-card tx-stack" aria-label="what your parent can see">
          <h2>{lang === "english" ? "What your parent can see" : "Ghar wale kya dekh sakte hain"}</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{lang === "english" ? "Skills and the evidence behind them" : "Skills aur unke saboot"}</li>
            <li>{lang === "english" ? "Short quotes from lessons" : "Paath se chhote quotes"}</li>
            <li>{lang === "english" ? "What you got right and what you are still working on" : "Kya sahi hua, kis par abhi kaam chal raha hai"}</li>
            <li>{lang === "english" ? "Re-check notes" : "Dobara jaanch ke notes"}</li>
            <li>{lang === "english" ? "Time spent" : "Kitna samay laga"}</li>
            <li>{lang === "english" ? "How your teacher teaches you: rules per topic, choices you made, your interests" : "Teacher aapko kaise padhate hain: har topic ke niyam, aapki choices, aapki pasand"}</li>
          </ul>
        </section>
      )}
    </Frame>
  );
}
