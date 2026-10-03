// Child home /c/:cid (PRODUCT-DESIGN-V2 §6.3.3; audit #9, #4.5). ONE primary card, chosen by GET /api/child/plan:
// Start today's lesson · Your first lesson · Continue your lesson · Done for today · That's all for today · Lessons
// open again at … · offline. When the plan read fails the home is never an empty card (src/child/plan.ts fallback).
//   Young (B1-B2): the sunlit courtyard; she stands at the veranda door (live B+ or plate); the PrimaryCard; three
//     picture tiles (Garden · Practice · Notebook). No tab bar; the Grown-ups door top-right.
//   Older (B3-B4): the rooftop at dusk; avatar = Me; her window; the PrimaryCard (subject spot, "Today", the short
//     title, "About n min", Start); Quick practice · Ask a question; the 4-item bar; "Your sky" below the fold.
// Rules (§3.4, §4.8, §8): no "one more" offer, no "come back tomorrow", no countdown, no streak, no counts; the home
// looks the same after 1 day away or 30 (only her greeting may differ); she never "rests", "waits" or "misses" anyone.
// No lamp anywhere on home: the Start button is the nib primary (the lamp is the lesson dock's alone, G-LAMP-1).
import { Link, Navigate } from "react-router-dom";
import type { DidCard } from "../../../shared/contracts.ts";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { artTierD, Spot, useTopicArt } from "../art.tsx";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { clock, t } from "../copy.ts";
import { Icon, Picto } from "../pictos.tsx";
import { usePlan, type HomePlan } from "../plan.ts";
import { SkyStar } from "../progress/StateShape.tsx";
import { useChildMap } from "../useChildMap.ts";

/** The face form the child chose (Me → Teacher's face): Moving (live), Still picture (plate), Voice only (tier E). */
export function faceFormOf(face: string): { form: "live" | "plate"; tier?: "D" | "E" } {
  if (face === "voice") return { form: "plate", tier: "E" };
  if (face === "small") return { form: "plate" };
  return { form: "live" };
}

export function Home() {
  const { cid, child, band, family, prefs, reducedMotion } = useChild();
  const { plan, reload } = usePlan(cid);
  const young = family === "young";
  const sky = useChildMap(cid, "sky", !young && plan.surfaces.map && plan.source !== "loading");
  // §3.13: "Later" never skips Hello or the AI disclosure. A child who has never met her goes there first.
  if (!prefs.hello && !child.avatar) return <Navigate to={`/c/${cid}/hello`} replace />;

  // Tier D (§7.4): the flat stage instead of the painted ground, and the plate instead of the live face.
  const face = artTierD() ? { form: "plate" as const, tier: "D" as const } : faceFormOf(prefs.face);
  const her = (
    <Teacher teacherId={child.teacher_id} band={band} form={face.form} tier={face.tier} floor="idle" label="below" lights="up"
      reducedMotion={reducedMotion} aiPicto={young} className="home-teacher" />
  );
  const resting = plan.state === "resting";

  return (
    <ChildScreen testid="home" ground={young ? "courtyard" : "rooftop"} rest={resting} home surfaces={plan.surfaces}
      className={`home home--${young ? "young" : "older"}`}>
      <div className="home-grid" data-plan-state={plan.state} data-plan-source={plan.source}>
        <div className="home-her">{resting ? <RestingStill /> : her}</div>
        <PrimaryCard plan={plan} reload={reload} />
        {young ? <YoungTiles plan={plan} /> : <OlderTiles plan={plan} />}
        {!young && plan.surfaces.map && sky.map && !sky.map.empty && <SkyPeek skills={sky.map.skills} />}
      </div>
    </ChildScreen>
  );
}

/** resting: her rendered `reading` still (never a live face waiting; never "{T} is resting"). */
function RestingStill() {
  const { child, band } = useChild();
  const rec = useTeacher(child.teacher_id, band);
  return (
    <figure className="home-still" data-teacher-id={rec.id}>
      <Spot id={rec.stills.reading} size={200} fallback={<Teacher teacherId={rec.id} band={band} form="plate" floor="idle" label="none" lights="up" />} />
      <figcaption className="teacher-label">{t("teacherLabel", { T: rec.name })}</figcaption>
    </figure>
  );
}

function StartLink({ to, label, testid = "start-lesson" }: { to: string; label: string; testid?: string }) {
  return (
    <Link to={to} className="cs-btn cs-btn--primary cs-btn--start" data-testid={testid}>
      <Icon name="play" size={22} />
      <span>{label}</span>
    </Link>
  );
}

function DidCardMini({ card }: { card: DidCard }) {
  return (
    <div className="didmini" data-testid="did-card">
      {card.ask && <p className="didmini-ask">{card.ask}</p>}
      <p className="didmini-answer">
        <span className="didmini-label">{t("youSaid")}</span> <strong data-speech="">{card.answer}</strong>
        {card.tick && (
          <span className={`didmini-tick ${card.withHelp ? "didmini-tick--help" : ""}`} role="img" aria-label={card.withHelp ? t("withAHint") : t("onYourOwn")}>
            <Icon name="tick" size={20} />
          </span>
        )}
      </p>
    </div>
  );
}

export function PrimaryCard({ plan, reload }: { plan: HomePlan; reload: () => void }) {
  const { cid, family } = useChild();
  const young = family === "young";
  const topicPic = useTopicArt(plan.topic?.id);
  const subject = (plan.topic?.subject ?? "maths").toLowerCase().replace(/\s+/g, "-");
  const startTo = `/c/${cid}/lesson/new${plan.topic ? `?topic=${encodeURIComponent(plan.topic.id)}` : ""}`;
  const title = plan.topic ? plan.topic.shortTitle ?? plan.topic.title : null;
  const picture = young
    ? <Spot id={topicPic} size={96} fallback={<span className="spot-tile"><Icon name="notebook" size={44} /></span>} />
    : <Spot id={`subjects/${subject}`} size={72} fallback={<span className="spot-tile"><Icon name="practice" size={36} /></span>} />;

  let body;
  switch (plan.state) {
    case "first":
    case "start": {
      const head = plan.state === "first" ? t("firstLesson") : young ? t("todayLesson") : t("today");
      const label = !plan.topic && plan.source === "fallback" ? t("startLesson") : t("start");
      body = (
        <>
          {picture}
          <div className="hpc-text">
            <h2 className="hpc-head">{head}</h2>
            {title && !young && <p className="hpc-title">{title}</p>}
            {!young && plan.topic && <p className="hpc-meta">{t("aboutMin", { n: plan.topic.minutes })}</p>}
          </div>
          <StartLink to={startTo} label={label} />
        </>
      );
      break;
    }
    case "resume":
      body = (
        <>
          <div className="hpc-text">
            <h2 className="hpc-head">{t("continueLesson")}</h2>
            {plan.resume?.ask && <p className="hpc-thumb" data-speech="">{plan.resume.ask}</p>}
            {!plan.resume?.ask && plan.resume?.topicTitle && <p className="hpc-sub">{plan.resume.topicTitle}</p>}
          </div>
          <StartLink to={`/c/${cid}/lesson/${encodeURIComponent(plan.resume?.lessonId ?? "new")}`} label={t("continue")} testid="continue-lesson" />
        </>
      );
      break;
    case "done":
      body = (
        <>
          <Spot id="states/done-for-today" size={young ? 96 : 72} fallback={<span className="spot-tile spot-tile--got"><Icon name="tick" size={40} /></span>} />
          <div className="hpc-text">
            <h2 className="hpc-head">{t("doneToday")}</h2>
            {plan.did[0] ? <DidCardMini card={plan.did[0]} /> : plan.tried ? <p className="hpc-sub">{plan.tried === 1 ? t("triedOne") : t("triedN", { n: plan.tried })}</p> : null}
          </div>
          <Link to={`/c/${cid}/practice`} className="cs-link" data-testid="practise-something">{t("practiseSomething")}</Link>
        </>
      );
      break;
    case "capped":
      body = (
        <>
          <Spot id="states/rest-until-tomorrow" size={young ? 96 : 72} fallback={<span className="spot-tile"><Icon name="theme" size={40} /></span>} />
          <div className="hpc-text"><h2 className="hpc-head pc-head--line">{t("capped")}</h2></div>
        </>
      );
      break;
    case "resting":
      body = (
        <div className="hpc-text"><h2 className="hpc-head pc-head--line">{t("resting", { time: clock(plan.opensAt) })}</h2></div>
      );
      break;
    case "offline":
      body = (
        <>
          <Spot id="states/no-internet" size={young ? 96 : 72} fallback={<span className="spot-tile"><Icon name="wifiOff" size={40} /></span>} />
          <div className="hpc-text"><h2 className="hpc-head pc-head--line">{t("offline")}</h2></div>
          <button type="button" className="cs-btn cs-btn--secondary" onClick={reload} data-testid="try-again">{t("tryAgain")}</button>
        </>
      );
      break;
  }
  return (
    <section className={`cs-card hpc hpc--${plan.state}`} aria-label={t("todayLesson")} data-testid="primary-card" data-state={plan.state}>
      {body}
    </section>
  );
}

function YoungTiles({ plan }: { plan: HomePlan }) {
  const { cid } = useChild();
  const practice = plan.state !== "capped" && plan.state !== "resting";
  return (
    <nav className="home-tiles" aria-label={t("home")}>
      {plan.surfaces.map && (
        <Link to={`/c/${cid}/map`} className="ptile" data-testid="tile-garden">
          <Picto id="picto/garden" size={56} /><span>{t("garden")}</span>
        </Link>
      )}
      {practice && (
        <Link to={`/c/${cid}/practice`} className="ptile" data-testid="tile-practice">
          <Picto id="picto/practice" size={56} /><span>{t("practiceYoung")}</span>
        </Link>
      )}
      {plan.surfaces.notebook && (
        <Link to={`/c/${cid}/notebook`} className="ptile" data-testid="tile-notebook">
          <Picto id="picto/notebook" size={56} /><span>{t("notebook")}</span>
        </Link>
      )}
    </nav>
  );
}

function OlderTiles({ plan }: { plan: HomePlan }) {
  const { cid } = useChild();
  const practice = plan.state !== "capped" && plan.state !== "resting";
  return (
    <nav className="home-tiles home-tiles--older" aria-label={t("home")}>
      {practice && (
        <Link to={`/c/${cid}/practice`} className="otile" data-testid="tile-practice">
          <Icon name="practice" size={28} /><span>{t("practice")}</span>
        </Link>
      )}
      <Link to={`/c/${cid}/ask`} className="otile" data-testid="tile-ask">
        <Icon name="ask" size={28} /><span>{t("askTile")}</span>
      </Link>
    </nav>
  );
}

/** Older, below the fold: the last 3 stars touched; tap → Map. Pure function of the ledger (no dates, no counts). */
function SkyPeek({ skills }: { skills: { skillId: string; title: string; state: "not_started" | "practising" | "got_it" | "secure" }[] }) {
  const { cid } = useChild();
  const touched = skills.filter((s) => s.state !== "not_started").slice(-3);
  if (!touched.length) return null;
  return (
    <Link to={`/c/${cid}/map`} className="cs-card skypeek" data-testid="sky-peek">
      <span className="skypeek-title">{t("yourSky")}</span>
      <svg viewBox="0 0 300 80" className="skypeek-sky" aria-hidden="true" focusable="false">
        <rect width="300" height="80" rx="12" fill="var(--sky-panel)" />
        {touched.length > 1 && <path d={touched.map((_, i) => `${i ? "L" : "M"}${60 + i * 90} ${i % 2 ? 30 : 50}`).join(" ")} stroke="var(--sky-edge)" strokeWidth="1.5" fill="none" />}
        {touched.map((s, i) => (
          <g key={s.skillId} transform={`translate(${60 + i * 90} ${i % 2 ? 30 : 50})`}><SkyStar state={s.state} r={11} /></g>
        ))}
      </svg>
      <span className="skypeek-names">{touched.map((s) => s.title).join(" · ")}</span>
    </Link>
  );
}
