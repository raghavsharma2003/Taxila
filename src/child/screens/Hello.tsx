// Hello /c/:cid/hello: the child's first meeting (PRODUCT-DESIGN-V2 §3.3, §6.3.2; audit #16 "first run says
// nothing", #10 "asked to start twice", #7 "interests replaced by a random set", #17 "an unlabelled arrow").
// Five cards under her window (360 tall; 1280: the face left 520, the cards right 560):
//   1 Greeting: her name + "AI teacher". "Tap to hear {T}" plays her pre-rendered greeting (the tap is the audio
//     unlock); her lips follow the clip.
//   2 The AI card: states/ai-teacher-card + "I'm a computer teacher, not a person." + "Your grown-ups can see what we
//     learn." + Got it (always a labelled button).
//   3 Pick your picture: 6 of the 24 avatar discs, "More pictures", "That's me". This is the Who tile from now on.
//   4 Confirm what you like: the parent's picks preselected; That's right · Change. (Skipped when the parent chose none.)
//   5 Pick a teacher: only when ≥ 2 are eligible; no default; "Choose for me". The child's first choice. Deviation:
//     each teacher shows a still, not §6.3.2's "two preview clips" (no per-teacher preview clip exists yet).
//   6 Name your teacher (decision child-names-teacher): every child, after the AI card, names the look they have (Asha,
//     Arjun and Uma are suggestions; "Keep {T}" keeps the look's own name). The name is checked by the server's code
//     predicate; a refusal is a gentle retry. The AI card came first, and the step repeats it: any name, still an AI.
// Then STRAIGHT into lesson 1: no second start gate (the Desk carries none). Every label is English; what she says
// is in the family's language.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { getTutors, updateChild, type TutorsResponse } from "../api.ts";
import { Spot } from "../art.tsx";
import { useChild } from "../ChildShell.tsx";
import { INTERESTS, interestIds } from "../interests.ts";
import { t } from "../copy.ts";
import { AVATARS, Avatar, avatarName, Icon, Picto } from "../pictos.tsx";
import { helloClip, useVoiceClip } from "../voice.ts";
import { offerOf, TeacherChoice } from "./Teacher.tsx";
import { TeacherNamer } from "../teacher/TeacherNamer.tsx";

const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

type Card = "greet" | "ai" | "picture" | "likes" | "change" | "teacher" | "name";

function InterestTile({ id, on, toggle }: { id: string; on: boolean; toggle?: () => void }) {
  const body = (
    <>
      <Spot id={`interests/${id}`} size={72} fallback={<span className="spot-tile spot-tile--sm"><Icon name="picture" size={36} /></span>} />
      <span>{label(id)}</span>
    </>
  );
  return toggle ? (
    <button type="button" className="itile" aria-pressed={on} onClick={toggle}>{body}</button>
  ) : (
    <span className="itile itile--static" data-on={on || undefined}>{body}</span>
  );
}

export function Hello() {
  const { cid, child, band, family, lang, setPrefs, refresh, reducedMotion } = useChild();
  const nav = useNavigate();
  const young = family === "young";
  const rec = useTeacher(child.teacher_id, band);
  const clip = useVoiceClip(helloClip(rec.id, lang));
  const parentPicks = useMemo(() => interestIds(child.interests), [child.interests]);
  const [card, setCard] = useState<Card>("greet");
  const [avatar, setAvatar] = useState<string | null>(child.avatar ?? null);
  const [page, setPage] = useState(0);
  const [likes, setLikes] = useState<string[]>(parentPicks);
  const [tutors, setTutors] = useState<TutorsResponse | null>(null);
  const [named, setNamed] = useState<string | null>(null); // the look being named (the pick, or the one they have)
  useEffect(() => {
    let live = true;
    getTutors(cid).then((d) => live && setTutors(d), () => {});
    return () => {
      live = false;
    };
  }, [cid]);
  const twoTeachers = !!tutors && tutors.mode === "picker" && offerOf(tutors).length >= 2 && !tutors.chosen;
  // The hand-over tap is the audio unlock (flows G14; V2 §3.3): when this page was reached by a tap (the SPA carries
  // user activation), her greeting plays at once, with no second "Tap to hear {T}" gate. A cold load keeps the button.
  const [autoTried, setAutoTried] = useState(false);
  useEffect(() => {
    if (autoTried || card !== "greet" || !helloClip(rec.id, lang)) return;
    setAutoTried(true);
    const active = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;
    if (active) clip.play();
  }, [autoTried, card, rec.id, lang, clip]);
  useEffect(() => {
    document.title = `${t("aiTeacher") ? `${rec.name} · ` : ""}Hello · Taxila`;
  }, [rec.name]);
  // the greeting card moves on by itself once her clip has played
  useEffect(() => {
    if (card === "greet" && clip.played) setCard("ai");
  }, [card, clip.played]);
  // focus each card's title (§11: a new card is announced)
  useEffect(() => {
    document.querySelector<HTMLElement>(".hello-card h1, .hello-card h2")?.focus({ preventScroll: true });
  }, [card]);

  const finish = async (picks: string[] = likes) => {
    setPrefs({ hello: true, picture: avatar });
    try {
      await updateChild(cid, { ...(avatar ? { avatar } : {}), ...(picks.length ? { interests: picks.map(label) } : {}) });
    } catch {
      /* the lesson still starts; the picks stay on this device */
    }
    nav(`/c/${cid}/lesson/new`, { replace: true });
  };
  const toName = (id: string | null | undefined) => { setNamed(id ?? rec.id); setCard("name"); };
  const afterLikes = (picks: string[]) => { setLikes(picks); if (twoTeachers) setCard("teacher"); else toName(rec.id); };
  const afterPicture = () => (parentPicks.length ? setCard("likes") : twoTeachers ? setCard("teacher") : toName(rec.id));

  const pageAvatars = AVATARS.slice((page * 6) % AVATARS.length, ((page * 6) % AVATARS.length) + 6);
  const framing = young ? t("storyStart") : t("olderStart");

  let body;
  switch (card) {
    case "greet":
      body = (
        <>
          <h1 tabIndex={-1} className="hello-name">{rec.name}</h1>
          <p className="hello-role">{t("aiTeacher")}</p>
          {helloClip(rec.id, lang) && !clip.failed ? (
            <button type="button" className="cs-btn cs-btn--primary hello-go" onClick={clip.play} disabled={clip.playing} data-testid="hello-hear">
              <Icon name="speaker" /> <span>{clip.playing ? t("playing") : t("tapToHear", { T: rec.name })}</span>
            </button>
          ) : (
            <button type="button" className="cs-btn cs-btn--primary hello-go" onClick={() => setCard("ai")} data-testid="hello-next">{t("helloNext")}</button>
          )}
          {clip.playing && <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setCard("ai")}>{t("helloNext")}</button>}
        </>
      );
      break;
    case "ai":
      body = (
        <>
          <Spot id="states/ai-teacher-card" size={young ? 128 : 112} fallback={<span className="spot-tile"><Icon name="computer" size={72} /></span>} />
          <h2 tabIndex={-1} className="hello-line">{t("aiLine1")}</h2>
          <p className="hello-line2"><Picto id="picto/who-sees" size={32} /> <span>{t("aiLine2")}</span></p>
          <button type="button" className="cs-btn cs-btn--primary hello-go" onClick={() => setCard("picture")} data-testid="hello-gotit">{t("gotIt")}</button>
        </>
      );
      break;
    case "picture":
      body = (
        <>
          <h2 tabIndex={-1} className="hello-q">{t("pickPicture")}</h2>
          <div className="avatar-grid avatar-grid--hello" role="radiogroup" aria-label={t("pickPicture")}>
            {pageAvatars.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={avatar === a} className="avatar-btn" aria-label={avatarName(a)} onClick={() => setAvatar(a)}>
                <Avatar id={a} size={young ? 88 : 72} />
              </button>
            ))}
          </div>
          <div className="hello-row">
            <button type="button" className="cs-btn cs-btn--secondary" onClick={() => setPage((p) => p + 1)}>
              <Picto id="picto/more-pictures" size={32} /> <span>{t("morePictures")}</span>
            </button>
            <button type="button" className="cs-btn cs-btn--primary" disabled={!avatar} onClick={afterPicture} data-testid="hello-thatsme">{t("thatsMe")}</button>
          </div>
          {!parentPicks.length && !twoTeachers && <p className="hello-framing">{framing}</p>}
        </>
      );
      break;
    case "likes":
      body = (
        <>
          <h2 tabIndex={-1} className="hello-q">{t("likesQ")}</h2>
          <div className="itiles">{parentPicks.map((id) => <InterestTile key={id} id={id} on />)}</div>
          <div className="hello-row">
            <button type="button" className="cs-btn cs-btn--secondary" onClick={() => setCard("change")}><Picto id="picto/pencil" size={32} /> <span>{t("change")}</span></button>
            <button type="button" className="cs-btn cs-btn--primary" onClick={() => afterLikes(parentPicks)} data-testid="hello-right">{t("thatsRight")}</button>
          </div>
          {!twoTeachers && <p className="hello-framing">{framing}</p>}
        </>
      );
      break;
    case "change":
      body = (
        <>
          <h2 tabIndex={-1} className="hello-q">{t("likesPick")}</h2>
          <div className="itiles itiles--all">
            {INTERESTS.map((id) => (
              <InterestTile key={id} id={id} on={likes.includes(id)}
                toggle={() => setLikes((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : xs.length < 3 ? [...xs, id] : xs))} />
            ))}
          </div>
          <button type="button" className="cs-btn cs-btn--primary hello-go" onClick={() => afterLikes(likes)} data-testid="hello-done">{t("done")}</button>
        </>
      );
      break;
    case "teacher":
      body = (
        <>
          <h2 tabIndex={-1} className="hello-q">{t("teacherPickTitle")}</h2>
          {tutors && <TeacherChoice data={tutors} firstPick onDone={(id) => { refresh(); toName(id); }} />}
          <p className="hello-framing">{framing}</p>
        </>
      );
      break;
    case "name":
      body = (
        <>
          <TeacherNamer cid={cid} characterId={named ?? rec.id} band={band} young={young} suggestions={tutors?.suggestions} face={false}
            current={named && named !== rec.id ? null : rec.name}
            onDone={() => { refresh(); void finish(); }} />
          <p className="hello-framing">{framing}</p>
        </>
      );
      break;
  }

  return (
    <div className={`cs hello ${young ? "cs--young" : "cs--older"}`} data-testid="hello" data-card={card}>
      <main className="hello-main" id="main" data-compact={card !== "greet" || undefined}>
        {/* card 5 shows the choice only: no teacher's face is bigger than the other's (no default, §3.3 step 5) */}
        {card !== "teacher" && <div className="hello-face">
          <Teacher teacherId={rec.id} band={band} form="live" floor={clip.playing ? "speaking" : card === "greet" ? "idle" : "your_turn"}
            meters={[clip.meter]} label="below" lights="up" reducedMotion={reducedMotion} aiPicto={young} />
        </div>}
        {/* no aria-live here: each card moves focus to its title, which announces it once (a live region too = twice) */}
        <section className="cs-card hello-card">{body}</section>
      </main>
    </div>
  );
}
