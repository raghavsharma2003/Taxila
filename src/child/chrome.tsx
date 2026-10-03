// Child screen chrome (PRODUCT-DESIGN-V2 §5.2):
//  - Young: NO tab bar. Home is a hub; every other screen has a 64 dp Home button (house picto + the word) top-left.
//    No back arrows, no hamburger.
//  - Older: a bottom bar of 4 items, icon + label always (Today · Map · Notebook · Ask); a left rail 88 wide from
//    1024 px with the same items + the avatar. Me is the child's avatar at top-left.
//  - The parent door is a small plain text button "Grown-ups", top-right, ink-2, 48 dp, no icon, no enticing colour;
//    its screen-reader name is "Grown-ups: parent corner".
//  - Every child screen has a painted ground on tier A-C, or flat paper on tier D (P10), behind a calm UI.
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Scene } from "./art.tsx";
import { useChild } from "./ChildShell.tsx";
import { t } from "./copy.ts";
import { Avatar, Icon, Picto, type IconName } from "./pictos.tsx";

export type SceneKind = "courtyard" | "rooftop" | "garden" | "sky" | "shelf" | "practice" | "ask" | "plain";

/** The designed flat ground for each scene, used until (and whenever) the painting is not there. Token shapes only. */
export function SceneFallback({ kind }: { kind: SceneKind }) {
  if (kind === "rooftop" || kind === "sky") {
    return (
      <svg className="scene-fb" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="360" height="640" fill="var(--stage)" />
        <g fill="var(--stage-ink-2)" opacity="0.5">
          {[[28, 60], [82, 34], [300, 50], [334, 112], [250, 22], [22, 150], [140, 18]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="1.6" />)}
        </g>
        {kind === "rooftop" && (
          <g>
            <path d="M0 520 H360" stroke="var(--stage-ink-2)" strokeWidth="3" opacity="0.45" />
            <path d="M0 560 H360 M20 520 V640 M120 520 V640 M240 520 V640 M340 520 V640" stroke="var(--stage-ink-2)" strokeWidth="2" opacity="0.3" />
            <rect x="286" y="430" width="56" height="90" rx="10" fill="var(--ink-2)" opacity="0.35" />
            <path d="M0 96 Q90 130 180 104 T360 92" fill="none" stroke="var(--stage-ink-2)" strokeWidth="1" opacity="0.35" />
          </g>
        )}
      </svg>
    );
  }
  if (kind === "courtyard" || kind === "garden" || kind === "practice") {
    return (
      <svg className="scene-fb" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="360" height="640" fill="var(--paper)" />
        <rect width="360" height="70" fill="var(--art-sky)" opacity="0.28" />
        <rect y="470" width="360" height="170" fill="var(--tray)" />
        <path d="M-10 600 q40 -60 80 0 M300 590 q40 -70 80 0" fill="var(--art-leaf)" opacity="0.35" />
        <circle cx="340" cy="110" r="70" fill="var(--art-leaf)" opacity="0.14" />
        <g fill="var(--ink-2)" opacity="0.18">{[60, 90, 120, 240, 270, 300].map((x) => <circle key={x} cx={x} cy="620" r="2.4" />)}</g>
      </svg>
    );
  }
  return (
    <svg className="scene-fb" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="360" height="640" fill="var(--paper)" />
      {kind === "shelf" && <path d="M0 150 H360 M0 330 H360" stroke="var(--tray)" strokeWidth="14" />}
      {kind === "ask" && <circle cx="320" cy="80" r="90" fill="var(--nib-soft)" opacity="0.6" />}
    </svg>
  );
}

const SCENE_ART: Record<SceneKind, string | null> = {
  courtyard: "home-young", rooftop: "home-older", garden: "garden-panorama", sky: "sky-panel", shelf: "notebook-shelf",
  practice: "practice", ask: "ask", plain: null,
};

export function Ground({ kind, rest, flat }: { kind: SceneKind; rest?: boolean; flat?: boolean }) {
  const id = SCENE_ART[kind];
  if (!id) return <div className="scene"><div className="scene-fallback"><SceneFallback kind="plain" /></div></div>;
  return <Scene id={rest ? `${id}-rest` : id} flat={flat} fallback={<SceneFallback kind={kind} />} />;
}

/** "Grown-ups": the plain parent door (§5.2). */
export function GrownUps() {
  return (
    <Link to="/parent" className="cs-grownups" aria-label={t("grownupsName")} data-testid="grownups">
      {t("grownups")}
    </Link>
  );
}

/** Young: the 64 dp Home button on every screen except home. */
export function HomeButton() {
  const { cid } = useChild();
  return (
    <Link to={`/c/${cid}`} className="cs-homebtn" data-testid="home-button">
      <Picto id="picto/home" size={40} />
      <span>{t("home")}</span>
    </Link>
  );
}

/** Older: the avatar at top-left is Me. */
export function MeButton() {
  const { cid, child } = useChild();
  return (
    <Link to={`/c/${cid}/me`} className="cs-mebtn" aria-label={t("me")} data-testid="me-button">
      <Avatar id={child.avatar} size={40} />
    </Link>
  );
}

const NAV: { to: string; label: () => string; icon: IconName; end?: boolean; surface?: "map" | "notebook" }[] = [
  { to: "", label: () => t("today"), icon: "today", end: true },
  { to: "map", label: () => t("map"), icon: "map", surface: "map" },
  { to: "notebook", label: () => t("notebook"), icon: "notebook", surface: "notebook" },
  { to: "ask", label: () => t("ask"), icon: "ask" },
];

/** Older: bottom bar on phones, left rail from 1024 px. Entries for surfaces the parent turned off are absent (P6). */
export function OlderNav({ surfaces }: { surfaces?: { map: boolean; notebook: boolean } }) {
  const { cid, child } = useChild();
  return (
    <nav className="cs-nav" aria-label="Main">
      <Link to={`/c/${cid}/me`} className="cs-nav-me" aria-label={t("me")}>
        <Avatar id={child.avatar} size={48} />
      </Link>
      {NAV.filter((n) => !n.surface || surfaces?.[n.surface] !== false).map((n) => (
        <NavLink key={n.icon} to={`/c/${cid}${n.to ? `/${n.to}` : ""}`} end={n.end} className="cs-nav-item">
          <Icon name={n.icon} size={24} />
          <span>{n.label()}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * One child screen: the ground, the top bar and the content. `home` marks the hub (Young: no Home button; both:
 * the Grown-ups door). Older screens carry the nav; the lesson never uses this frame (it has no navigation).
 */
export function ChildScreen({ testid, ground, rest, title, actions, home, children, surfaces, className, flatGround }:
  { testid: string; ground: SceneKind; rest?: boolean; title?: ReactNode; actions?: ReactNode; home?: boolean; children: ReactNode;
    surfaces?: { map: boolean; notebook: boolean }; className?: string; flatGround?: boolean }) {
  const { family } = useChild();
  const older = family === "older";
  return (
    <div className={`cs ${older ? "cs--older" : "cs--young"} ${className ?? ""}`} data-testid={testid} data-ground={ground}>
      <Ground kind={ground} rest={rest} flat={flatGround} />
      {older && <OlderNav surfaces={surfaces} />}
      <main className="cs-main" id="main">
        <header className="cs-top">
          {older ? <MeButton /> : home ? <span className="cs-top-gap" /> : <HomeButton />}
          {title ? <h1 className="cs-title" tabIndex={-1}>{title}</h1> : <span className="cs-top-fill" />}
          <span className="cs-top-actions">
            {actions}
            {home && <GrownUps />}
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}
