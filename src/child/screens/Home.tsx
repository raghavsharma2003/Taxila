// Child home (/c/:cid, PRODUCT-DESIGN §2.5, §2.5.1). Young: "Aaj ka paath" with her figure, ONE ringed
// lesson tile, Bagiya and Abhyaas picture tiles. Older: a study home (continue, doubt, practice, map, notes).
// The `done` variant (after the finish tile) has NO ring: the lesson slot becomes the day's artefact card,
// and another lesson is reached only by the child's own tap on her (Young) or the next row (Older), with
// equal-weight tiles. No counts, dates, greetings about time away, or "ready" badges.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TeacherStage } from "../../stage/TeacherStage.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { Book, Face, MapIcon, ParentDoor, Play, Practice, Question } from "../icons.tsx";
import { readArtefacts } from "../prefs.ts";
import { Aasmaan, Bagiya } from "../progress/worlds.tsx";
import { useChildMap } from "../useChildMap.ts";

const silent = { value: 0 };

export function Home() {
  const { cid, child, band, family, lang, prefs, reducedMotion } = useChild();
  const location = useLocation();
  const navigate = useNavigate();
  const done = !!(location.state as { done?: boolean } | null)?.done;
  const { map } = useChildMap(cid);
  const [asking, setAsking] = useState(false);
  const artefact = readArtefacts(cid).at(-1) ?? null;
  const world = prefs.world ?? (family === "young" ? "bagiya" : "aasmaan");
  const skills = map?.skills ?? [];
  const lessonPath = `/c/${cid}/lesson/new`;

  const her = (
    <TeacherStage
      floor={null}
      teacherId={child.teacher_id}
      band={band}
      mouth={[silent]}
      reducedMotion={reducedMotion}
      badge={family === "young"}
      plainRoom={band === "b4"}
      onTap={done ? () => setAsking(true) : undefined}
      tapLabel={child.teacher_id ?? "teacher"}
    />
  );

  const top = (
    <div className="tx-topbar">
      <Link className="tx-iconbtn" to={`/c/${cid}/me`} aria-label={t("me", lang)}>
        <Face />
      </Link>
      {family === "older" && <strong>{child.first_name}</strong>}
      <Link className="tx-iconbtn tx-door" to="/parent" aria-label="parent">
        <ParentDoor />
      </Link>
    </div>
  );

  if (family === "young") {
    return (
      <main className="tx-screen" data-testid="home" data-home={done ? "done" : "default"}>
        {top}
        <div className="tx-home-hero">{her}</div>
        {asking && (
          <div className="tx-sheet-pair" role="group">
            {/* ⟨that's all⟩ first in reading and focus order; both equal and unringed */}
            <button type="button" className="tx-tile" onClick={() => setAsking(false)}>{t("thatsAll", lang)}</button>
            <button type="button" className="tx-tile" onClick={() => navigate(lessonPath)}>{t("another", lang)}</button>
          </div>
        )}
        <div className="tx-home-tiles">
          {done ? (
            <button type="button" className="tx-artefact-card" aria-label={t("whatWeMade", lang)}>
              <span className="tx-num">{artefact?.chips.slice(-2).join("  ") || "✎"}</span>
              <span>{t("whatWeMade", lang)}</span>
            </button>
          ) : (
            <Link className="tx-tile tx-lessontile tx-ring" to={lessonPath} data-testid="start-lesson">
              <Play /> {t("todayLesson", lang)}
            </Link>
          )}
          <Link className="tx-tile" to={`/c/${cid}/map`} aria-label={t(world === "bagiya" ? "garden" : "sky", lang)}>
            <span style={{ width: 72, height: 72, display: "block" }}>
              {world === "bagiya" ? <MiniGarden /> : <MapIcon />}
            </span>
            {t(world === "bagiya" ? "garden" : "sky", lang)}
          </Link>
          <Link className="tx-tile" to={`/c/${cid}/practice`}>
            <Practice />
            {t("practice", lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="tx-screen" data-testid="home" data-home={done ? "done" : "default"}>
      {top}
      <div className="tx-older-grid">
        <div className="tx-stack" style={{ width: "100%" }}>
          <div className="tx-older-head">
            {artefact?.topic && <span className="tx-muted">{artefact.topic}</span>}
          </div>
          {done ? (
            <button type="button" className="tx-listrow" onClick={() => setAsking(true)}>
              {t("nextTopic", lang)}…
            </button>
          ) : (
            <Link className="tx-tile tx-primary tx-ring" to={lessonPath} data-testid="start-lesson">
              <Play /> {t("continue", lang)}
            </Link>
          )}
          {asking && (
            <div className="tx-sheet-pair" role="group" style={{ width: "100%" }}>
              <button type="button" className="tx-tile" onClick={() => setAsking(false)}>{t("no", lang)}</button>
              <button type="button" className="tx-tile" onClick={() => navigate(lessonPath)}>{t("startLesson", lang)}</button>
            </div>
          )}
          <ul className="tx-list" style={{ width: "100%" }}>
            <li><Link className="tx-listrow" to={`/c/${cid}/doubt`}><Question /> {t("doubt", lang)}</Link></li>
            <li><Link className="tx-listrow" to={`/c/${cid}/practice`}><Practice /> {t("practice", lang)}</Link></li>
            <li><Link className="tx-listrow" to={`/c/${cid}/map`}><MapIcon /> {t("myMap", lang)}</Link></li>
            <li><Link className="tx-listrow" to={`/c/${cid}/notes`}><Book /> {t("myNotes", lang)}</Link></li>
          </ul>
        </div>
        <div className="tx-stack" style={{ width: "100%" }}>
          <div style={{ height: 180, width: "100%" }}>{prefs.face === "voice" ? null : her}</div>
          {world === "aasmaan" ? <Aasmaan skills={skills} lang={lang} /> : <Bagiya skills={skills} lang={lang} />}
        </div>
      </div>
    </main>
  );
}

function MiniGarden() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="tx-icon" style={{ width: 72, height: 72 }}>
      <path d="M6 40 H42" stroke="var(--grow-plot)" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 40 V26 M32 40 V22" stroke="var(--grow-leaf)" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 30 c-6 0-8-4-8-8 c6 0 8 4 8 8 Z M32 28 c6 0 8-4 8-8 c-6 0-8 4-8 8 Z" fill="var(--grow-leaf)" />
      <circle cx="32" cy="18" r="5" fill="var(--grow-flower)" />
    </svg>
  );
}
