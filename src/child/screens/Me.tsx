// /c/:cid/me (PRODUCT-DESIGN-V2 §6.3.8; it replaces the developer panel, audit #21). Each row is plain English with
// a one-line explanation where needed. Every toggle is a switch that announces its name and state ("Sounds, on").
//   Young: Your teacher · Always show words · Sounds · Calmer screen · My picture · What your grown-ups can see
//          (picto strip + one sentence) · Switch learner. Light only.
//   Older: + Captions (Always / When needed) · Sound effects · Talk mode (open mic needs headphones) · Teacher's face
//          (Moving / Still picture / Voice only) · Less motion · Bigger text · Theme (Light / Dark / Match phone) ·
//          the plain list of what the grown-ups see.
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "../../ui/Sheet.tsx";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { updateChild } from "../api.ts";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { tw } from "../../copy/en.ts";
import { useHeadset } from "../lesson/headset.ts";
import { AVATARS, Avatar, avatarName, Icon, Picto, type IconName } from "../pictos.tsx";
import { usePlan } from "../plan.ts";
import type { ChildPrefs } from "../prefs.ts";

function Switch({ id, label, note, on, set, disabled, icon }:
  { id: string; label: string; note?: string; on: boolean; set: (v: boolean) => void; disabled?: boolean; icon: ReactNode }) {
  return (
    <li className="me-row">
      <span className="me-icon">{icon}</span>
      <span className="me-text">
        <span className="me-label" id={`${id}-l`}>{label}</span>
        {note && <span className="me-note" id={`${id}-n`}>{note}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-l`} aria-describedby={note ? `${id}-n` : undefined}
        className="cs-switch" disabled={disabled} onClick={() => set(!on)} data-testid={`switch-${id}`}>
        <span className="cs-switch-knob" aria-hidden="true" />
        <span className="cs-switch-word" aria-hidden="true">{on ? t("on") : t("off")}</span>
      </button>
    </li>
  );
}

function Choice<T extends string>({ id, label, value, options, set, icon }:
  { id: string; label: string; value: T; options: { v: T; label: string }[]; set: (v: T) => void; icon: ReactNode }) {
  return (
    <li className="me-row me-row--choice">
      <span className="me-icon">{icon}</span>
      <span className="me-text"><span className="me-label" id={`${id}-l`}>{label}</span></span>
      <span className="seg" role="radiogroup" aria-labelledby={`${id}-l`}>
        {options.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className="seg-btn" onClick={() => set(o.v)}>{o.label}</button>
        ))}
      </span>
    </li>
  );
}

export function Me() {
  const { cid, child, band, family, prefs, setPrefs, refresh } = useChild();
  const { plan } = usePlan(cid);
  const rec = useTeacher(child.teacher_id, band);
  const older = family === "older";
  const headset = useHeadset();
  const [picking, setPicking] = useState(false);
  const ic = (name: IconName, picto: string) => (older ? <Icon name={name} size={24} /> : <Picto id={picto} size={40} />);
  const sounds = prefs.sounds ?? !older;
  const pick = async (a: string) => {
    setPicking(false);
    try {
      await updateChild(cid, { avatar: a });
      refresh();
    } catch {
      /* the picture stays as it was; nothing to show the child */
    }
  };

  return (
    <ChildScreen testid="me" ground={older ? "plain" : "courtyard"} title={t("me")} surfaces={plan.surfaces} className="me">
      <ul className="cs-card me-list">
        <li className="me-row">
          <span className="me-icon">{ic("teacher", "picto/ai-teacher")}</span>
          <Link to={`/c/${cid}/teacher`} className="me-link" data-testid="me-teacher">
            <span className="me-text"><span className="me-label">{t("yourTeacher")}</span><span className="me-note">{t("teacherLabel", { T: rec.name })}</span></span>
            <Icon name="right" />
          </Link>
        </li>
        {older ? (
          <Choice id="captions" label={t("captions")} value={prefs.captionsAlways ? "always" : "needed"} icon={ic("captions", "picto/captions")}
            options={[{ v: "always", label: t("captionsAlways") }, { v: "needed", label: t("captionsNeeded") }]} set={(v) => setPrefs({ captionsAlways: v === "always" })} />
        ) : (
          <Switch id="words" label={t("wordsYoung")} on={prefs.captionsAlways} set={(v) => setPrefs({ captionsAlways: v })} icon={ic("captions", "picto/captions")} />
        )}
        {/* "Type instead" (W1-A item 9; flows G8): lessons start in the text lane (prefs.quiet); she still talks */}
        <Switch id="type" label={tw("me.type.title")} note={prefs.quiet ? tw("me.type.on", { T: rec.name }) : tw("me.type.off")}
          on={prefs.quiet} set={(v) => setPrefs({ quiet: v })} icon={ic("text", "picto/captions")} />
        <Switch id="sounds" label={older ? t("soundsOlder") : t("soundsYoung")} on={sounds} set={(v) => setPrefs({ sounds: v })}
          icon={ic("sound", sounds ? "picto/sound-on" : "picto/sound-off")} />
        {older && (
          <Choice id="talk" label={t("talkMode")} value={headset && prefs.talk === "open" ? "open" : "tap"} icon={ic("mic", "picto/mic")}
            options={[{ v: "tap", label: t("tapToTalk") }, ...(headset ? [{ v: "open" as const, label: t("openMic") }] : [])]}
            set={(v) => setPrefs({ talk: v as ChildPrefs["talk"] })} />
        )}
        {older && !headset && <li className="me-hint">{t("openMicNeeds")}</li>}
        {older && (
          <Choice id="face" label={t("teacherFace")} value={prefs.face} icon={ic("face", "picto/ai-teacher")}
            options={[{ v: "face", label: t("faceMoving") }, { v: "small", label: t("faceStill") }, { v: "voice", label: t("faceVoice") }]}
            set={(v) => setPrefs({ face: v as ChildPrefs["face"] })} />
        )}
        <Switch id="calm" label={older ? t("lessMotion") : t("calmer")} on={prefs.calm} set={(v) => setPrefs({ calm: v })} icon={ic("calm", "picto/calmer")} />
        {older && <Switch id="bigtext" label={t("biggerText")} on={prefs.largeText} set={(v) => setPrefs({ largeText: v })} icon={ic("text", "picto/captions")} />}
        {older && (
          <Choice id="theme" label={t("theme")} value={prefs.theme} icon={ic("theme", "picto/calmer")}
            options={[{ v: "light", label: t("themeLight") }, { v: "dark", label: t("themeDark") }, { v: "system", label: t("themeSystem") }]}
            set={(v) => setPrefs({ theme: v as ChildPrefs["theme"] })} />
        )}
        <li className="me-row">
          <span className="me-icon"><Avatar id={child.avatar} size={older ? 32 : 48} /></span>
          <span className="me-text"><span className="me-label">{t("myPicture")}</span></span>
          <button type="button" className="cs-btn cs-btn--secondary cs-btn--sm" onClick={() => setPicking(true)} data-testid="change-picture">{t("changePicture")}</button>
        </li>
      </ul>

      <section className="cs-card me-sees" aria-labelledby="sees-h">
        <h2 id="sees-h" className="me-h2">{t("whoSees")}</h2>
        {older ? (
          <ul className="me-bullets">
            <li>{t("whoSeesList1")}</li><li>{t("whoSeesList2")}</li><li>{t("whoSeesList3")}</li><li>{t("whoSeesList4")}</li>
          </ul>
        ) : (
          <p className="me-sees-line"><Picto id="picto/who-sees" size={48} /> <span>{t("whoSeesYoung", { T: rec.name })}</span></p>
        )}
        {!plan.surfaces.map && <p className="me-note">{t("hiddenMap")}</p>}
      </section>

      <Link to="/who" className="cs-btn cs-btn--secondary me-switch" data-testid="switch-learner">
        {older ? <Icon name="switch" /> : <Picto id="picto/switch-learner" size={40} />}
        <span>{t("switchLearner")}</span>
      </Link>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t("pickPicture")} closeLabel={t("close")}>
        <div className="avatar-grid" role="radiogroup" aria-label={t("pickPicture")}>
          {AVATARS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={child.avatar === a} className="avatar-btn" aria-label={avatarName(a)} onClick={() => void pick(a)}>
              <Avatar id={a} size={72} />
            </button>
          ))}
        </div>
      </Sheet>
    </ChildScreen>
  );
}
