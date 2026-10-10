// Hello /c/:cid/hello: the child's first meeting (PRODUCT-DESIGN-V2 §3.3, §6.3.2; audit #16 "first run says
// nothing", #10 "asked to start twice", #7 "interests replaced by a random set", #17 "an unlabelled arrow").
// Five cards under her window (360 tall; 1280: the face left 520, the cards right 560):
//   1 Greeting: her name + "AI teacher". "Tap to hear {T}" plays her pre-rendered greeting (the tap is the audio
//     unlock); her lips follow the clip.
//   2 The AI card: states/ai-teacher-card + "I'm a computer teacher, not a person." + "Your grown-ups can see what we
//     learn." + Got it (always a labelled button).
//   3 Pick your picture: 6 of the 24 avatar discs, "More pictures", "That's me". This is the Who tile from now on.
//   4 Confirm what you like: the parent's picks preselected; That's right · Change. When the parent chose none (the
//     5-step set-up no longer asks, round 4 audit #12) she picks them herself: the Change card, up to 3.
//   5 Say hi to {T}: the set-up's microphone check, now hers. A tap listens on this device for up to 6 s (nothing is
//     recorded or sent); heard → "{T} heard you!" and on; no mic → this device starts in tap-and-type. Skip is always there.
//   There is no teacher card: ONE teacher, Asha, for every child (dc-r4-single-teacher-asha). The pick-a-teacher card
//   and the name-your-teacher card are gone (round 4); a name a child gave her before is still honoured everywhere
//   (the server sends it), and the naming code stays in src/child/teacher for the owner's one-line restore.
// Then STRAIGHT into lesson 1: no second start gate (the Desk carries none). Every label is English; what she says
// is in the family's language.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { updateChild } from "../api.ts";
import { Spot } from "../art.tsx";
import { useChild } from "../ChildShell.tsx";
import { INTERESTS, interestIds } from "../interests.ts";
import { t } from "../copy.ts";
import { AVATARS, Avatar, avatarName, Icon, Picto } from "../pictos.tsx";
import { helloClip, useVoiceClip } from "../voice.ts";
import { listenOnce } from "../sayHi.ts";

const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

type Card = "greet" | "ai" | "picture" | "likes" | "change" | "hi";

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
  const { cid, child, band, family, lang, setPrefs, reducedMotion, refresh } = useChild();
  const nav = useNavigate();
  const young = family === "young";
  const rec = useTeacher(child.teacher_id, band);
  const clip = useVoiceClip(helloClip(rec.id, lang));
  const parentPicks = useMemo(() => interestIds(child.interests), [child.interests]);
  const [card, setCard] = useState<Card>("greet");
  const [avatar, setAvatar] = useState<string | null>(child.avatar ?? null);
  const [page, setPage] = useState(0);
  const [likes, setLikes] = useState<string[]>(parentPicks);
  const [hi, setHi] = useState<"idle" | "listening" | "heard" | "none">("idle");
  const stopHi = useRef<() => void>(() => {});
  useEffect(() => () => stopHi.current(), []);
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
      // journey audit #14 (A32 vs A33): the shell's child record was the one loaded before the pick, so Home showed the
      // old picture until a reload; re-read it now, as Me does after a change of picture
      refresh();
    } catch {
      /* the lesson still starts; the picks stay on this device */
    }
    nav(`/c/${cid}/lesson/new`, { replace: true });
  };
  const afterLikes = (picks: string[]) => { setLikes(picks); setCard("hi"); };
  const afterPicture = () => setCard(parentPicks.length ? "likes" : "change");
  const sayHi = () => {
    setHi("listening");
    const l = listenOnce(6000);
    stopHi.current = l.stop;
    void l.done.then((r) => {
      if (r === "stopped") return;
      setHi(r);
      // no working mic: this device's lessons start in tap-and-type (she can turn talking on in Me)
      if (r === "none") setPrefs({ quiet: true });
      if (r === "heard") setTimeout(() => void finish(), 900);
    });
  };
  const skipHi = () => { stopHi.current(); void finish(); };

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
    case "hi":
      body = (
        <>
          <h2 tabIndex={-1} className="hello-q">{hi === "heard" ? t("sayHiHeard", { T: rec.name }) : hi === "listening" ? t("sayHiListening", { T: rec.name }) : t("sayHiQ", { T: rec.name })}</h2>
          {hi === "none" && <p className="hello-line2" role="status">{t("sayHiNone")}</p>}
          <div className="hello-row">
            <button type="button" className="cs-btn cs-btn--secondary" onClick={skipHi} data-testid="hello-skip">{hi === "none" ? t("helloNext") : t("skip")}</button>
            {hi !== "none" && (
              <button type="button" className="cs-btn cs-btn--primary" onClick={sayHi} disabled={hi !== "idle"} data-testid="hello-sayhi">
                <Icon name="mic" /> <span>{t("sayHiStart")}</span>
              </button>
            )}
          </div>
          <p className="hello-framing">{framing}</p>
        </>
      );
      break;
  }

  return (
    <div className={`cs hello ${young ? "cs--young" : "cs--older"}`} data-testid="hello" data-card={card}>
      <main className="hello-main" id="main" data-compact={card !== "greet" || undefined}>
        <div className="hello-face">
          <Teacher teacherId={rec.id} band={band} form="live" floor={clip.playing ? "speaking" : card === "greet" ? "idle" : "your_turn"}
            meters={[clip.meter]} label="below" lights="up" reducedMotion={reducedMotion} aiPicto={young} />
        </div>
        {/* no aria-live here: each card moves focus to its title, which announces it once (a live region too = twice) */}
        <section className="cs-card hello-card">{body}</section>
      </main>
    </div>
  );
}
