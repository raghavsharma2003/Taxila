// The marketing site's shared chrome (PRODUCT-DESIGN-V2 §6.1; release 11 "Volt everywhere", dc-r4-volt-everywhere):
// header, footer, the brand mark, the helplines as tel: buttons, the inline ₹ glyph (§5.4: no shipped Latin subset
// covers U+20B9), the teacher portraits and the art hook. Used by the landing and by every public page (Public.tsx), so
// the site reads as one product. The whole site is drawn in Kaksha's Volt night: the page root carries K's own scope
// (`.kx` + data-klook="volt" + data-ktheme="night", src/ui-v3/kaksha/shell-attrs.ts) and every colour is one of K's
// tokens (src/ui-v3/kaksha/tokens.css); landing.css holds layout and no palette of its own.
// English chrome only (§5.3). No teacher name or pronoun is written here (whether the site names her is the owner's
// open call, BUILD-PLAN §5 decision 4), so the site says "the teacher" and shows her unnamed.
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { TUTORS, type TutorCharacter } from "../../../shared/tutors.js";
import { Plate2D } from "../../avatar/Plate2D.tsx";
import { puppetPoster } from "../../face-puppet/assets.ts";
import { usePuppetLook } from "../../face-puppet/useLook.ts";
import { Icon, useArt } from "../../ui/index.ts";
import type { SitePromise } from "../promises.ts";
import "../../ui-v3/tokens.css"; // Geist Mono (K's HUD face) is declared here
import "../../ui-v3/kaksha/tokens.css";
import "../../ui-v3/kaksha/kaksha.css";
import "../../ui-v3/kaksha/futurist.css";
import "../../styles/landing.css";

/** The site root's scope: Kaksha's Volt night, as K's shell sets it on a child screen (never a palette of our own). */
export const VOLT_NIGHT = { className: "kx sv", "data-klook": "volt", "data-ktheme": "night" } as const;

/** The brand mark: an open book whose spine rises into a pen nib. Same glyph as public/favicon.svg (brand.mjs). */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="brand-mark">
      <rect x="3.84" y="3.84" width="56.32" height="56.32" rx="14" fill="var(--k-ink)" />
      <path d="M32 8.5C35.2 14.6 41.5 20.4 41.5 28c0 5-3.4 8.3-6.9 9.9V44h-5.2v-6.1c-3.5-1.6-6.9-4.9-6.9-9.9 0-7.6 6.3-13.4 9.5-19.5z" fill="var(--k-void)" />
      <path d="M32 12.5v14" stroke="var(--k-ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="29.4" r="2.6" fill="var(--k-ink)" />
      <path d="M10 41.5c7.4-3.8 14.6-3.8 20.6.2V53c-6-4-13.2-4-20.6-.2z" fill="var(--k-void)" />
      <path d="M54 41.5c-7.4-3.8-14.6-3.8-20.6.2V53c6-4 13.2-4 20.6-.2z" fill="var(--k-void)" />
    </svg>
  );
}

/** ₹ as an inline SVG (§5.4, §7.2): it never falls back to an unpredictable system font. */
export function Rupee({ label = "rupees" }: { label?: string }) {
  return (
    <svg className="rupee" viewBox="0 0 12 16" width="0.62em" height="0.9em" role="img" aria-label={label}>
      <path d="M1.5 1.5h9M1.5 5.2h9M3 1.5h2.2c2.4 0 3.8 1.5 3.8 3.4S7.6 8.4 5.2 8.4H2.6L8.6 14.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Signed in, or inside the installed app: the CTA changes (§6.1.1 states). Asked when the browser is idle. */
export function useVisitor(): "new" | "signed-in" | "app" {
  const app = typeof window !== "undefined" && !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  const [state, setState] = useState<"new" | "signed-in" | "app">(app ? "app" : "new");
  useEffect(() => {
    if (app) return;
    // no session marker on this browser: nobody is signed in, so no GET /api/me (and no 401 on the public landing)
    if (!/(?:^|; )tx_in=1/.test(document.cookie)) return;
    let live = true;
    const run = () => {
      void import("../api.ts").then((m) => m.loadMe()).then((me) => { if (live && me) setState("signed-in"); }, () => {});
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 2500 }) : window.setTimeout(run, 400);
    return () => { live = false; if (w.cancelIdleCallback) w.cancelIdleCallback(id); else window.clearTimeout(id); };
  }, [app]);
  return state;
}

/** The one lime element of a screen state (K's one-volt law): the chamfered CTA with its breathing glow. */
export function PrimaryCta({ className = "" }: { className?: string }) {
  const who = useVisitor();
  const [to, label] = who === "new" ? ["/start/class", "Start free set-up"] : ["/who", who === "app" ? "Open Taxila" : "Go to Taxila"];
  return <Link className={`kx-cta kx-cut sv-cta ${className}`} to={to}><span className="kx-cta-sweep" aria-hidden="true" />{label}</Link>;
}

export function SiteHeader({ home }: { home?: boolean }) {
  const who = useVisitor();
  return (
    <header className="sv-header">
      <div className="sv-wrap sv-header-row">
        <Link to="/" className="sv-brand" aria-label="Taxila home"><BrandMark size={30} /><span>TAXILA</span></Link>
        <nav className="sv-nav" aria-label="Site">
          {home ? <a href="#lesson">How a lesson works</a> : <NavLink to="/#lesson">How a lesson works</NavLink>}
          <NavLink to="/promises">Our promises</NavLink>
          <NavLink to="/help">Help and safety</NavLink>
        </nav>
        <span className="sv-spacer" />
        {who === "new" ? (
          <>
            <Link className="sv-signin" to="/start/phone?login=1">Sign in</Link>
            <Link className="sv-start kx-cut" to="/start/class">Start</Link>
          </>
        ) : <Link className="sv-start kx-cut" to="/who">{who === "app" ? "Open Taxila" : "Go to Taxila"}</Link>}
      </div>
    </header>
  );
}

/** Childline and Tele-MANAS as real tel: buttons (§6.1.2 Help). Numbers re-verified at launch (§16). */
export function Helplines() {
  return (
    <div className="sv-helplines">
      <a className="sv-tel kx-cut" href="tel:1098"><span className="sv-tel-name">Childline</span> <span className="sv-tel-num">1098</span></a>
      <a className="sv-tel kx-cut" href="tel:14416"><span className="sv-tel-name">Tele-MANAS</span> <span className="sv-tel-num">14416</span></a>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="sv-footer">
      <div className="sv-wrap sv-footer-grid">
        <div className="sv-stack">
          <Link to="/" className="sv-brand" aria-label="Taxila home"><BrandMark size={26} /><span>TAXILA</span></Link>
          <p className="sv-meta">A personal AI teacher for classes 1 to 9. The teacher is an AI and always says so.</p>
        </div>
        <nav className="sv-stack sv-footer-nav" aria-label="Footer">
          <Link to="/help">Help and safety</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/promises">Our promises</Link>
        </nav>
        <div className="sv-stack">
          <p className="kx-label">If a child needs help now</p>
          <Helplines />
        </div>
      </div>
    </footer>
  );
}

/** A public page in the site's scope (Volt night): header, the page, footer. */
export function SitePage({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => { document.title = `${title} · Taxila`; }, [title]);
  return (
    <div {...VOLT_NIGHT}>
      <a className="sv-skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" className="sv-main">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** The teacher a child actually meets: the live looks of shared/tutors.js (round 4: Asha alone; Arjun and Uma are
 *  parked, dc-r4-single-teacher-asha). The site never shows a face the product does not render (audit #4: one
 *  stable teacher). */
export const SITE_TUTORS: TutorCharacter[] = TUTORS.filter((t) => t.status === "live");

/** A teacher's face as the lesson draws it at rest: under the r8 look the code-drawn plate (Plate2D `still`, the same
 *  person as the lesson's tier D face, no bytes to fetch); under lamp1 or lamp2, the grown-up Asha, her rest still from the
 *  pack, never the vector (BUILD-PLAN §3.5 Part B: no fallback changes the face). Nothing paints until the page's look is
 *  known (./face-puppet/look.ts), so the site never shows one face and then another. Hidden from assistive tech: the
 *  caller labels the group. */
export function TeacherPortrait({ tutor, size }: { tutor: TutorCharacter; size: number }) {
  const look = usePuppetLook();
  const grown = look === "lamp1" || look === "lamp2" ? look : null;
  const still = grown !== null && tutor.id === "asha";
  return (
    <span className="rig-portrait" style={{ width: size, height: size }} data-tutor={tutor.id} data-look={look ?? "pending"} aria-hidden="true">
      {still ? (
        <img className="site-still" src={puppetPoster("close", grown ?? undefined)} alt="" width={size} height={size} decoding="async" draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }} />
      ) : look ? (
        <Plate2D tutor={tutor} still reducedMotion className="site-plate" />
      ) : null}
    </span>
  );
}

interface ArtEntry { id: string; url: string; url2x?: string; width: number; height: number; lqip?: string;
  phone?: { url: string; url2x?: string; width: number; height: number } }
let entries: Promise<Map<string, ArtEntry>> | null = null;
/** The full manifest row (2x, the 360 phone crop, the LQIP) for an id the loader says is done. The loader fetched the
 *  same immutable URL first (index.html preloads it on "/"), so this read is a cache hit, not a second download. */
export function useArtEntry(id: string): ArtEntry | null {
  const url = useArt(id);
  const [e, setE] = useState<ArtEntry | null>(null);
  useEffect(() => {
    if (!url) return;
    let live = true;
    entries ??= fetch("/assets/gen/manifest.json", { credentials: "same-origin" }).then((r) => r.json())
      .then((m: { assets?: ArtEntry[] }) => new Map((m.assets ?? []).map((a) => [a.id, a])), () => new Map());
    void entries.then((m) => { if (live) setE(m.get(id) ?? { id, url, width: 0, height: 0 }); });
    return () => { live = false; };
  }, [id, url]);
  return url ? e ?? { id, url, width: 0, height: 0 } : null;
}

/** The hero painting (LCP): the phone crop at <= 600 px, the wide scene above, both 1x/2x; the LQIP paints first. */
export function HeroArt({ id, className, fallback }: { id: string; className?: string; fallback: ReactNode }) {
  const e = useArtEntry(id);
  const [broken, setBroken] = useState(false);
  // No art (not landed, ledger unreachable, or broken): the flat fallback is the hero.
  if (!e || broken) return <span className={`site-art site-art--fallback ${className ?? ""}`} data-art={id} data-art-fallback="" aria-hidden="true">{fallback}</span>;
  const set = (u: string, u2?: string) => (u2 ? `${u} 1x, ${u2} 2x` : u);
  return (
    <span className={`site-art ${className ?? ""}`} data-art={id} style={e.lqip ? { backgroundImage: `url("${e.lqip}")`, backgroundSize: "cover" } : undefined}>
      <picture>
        {e.phone && <source media="(max-width: 600px)" srcSet={set(e.phone.url, e.phone.url2x)} />}
        <img src={e.url} srcSet={set(e.url, e.url2x)} alt="" loading="eager" decoding="async" fetchPriority="high" onError={() => setBroken(true)} />
      </picture>
    </span>
  );
}

/** A generated image through the B2 loader (useArt: only ids the manifest says are done are ever requested), with
 *  a designed flat fallback. `eager` is for the hero (LCP): no lazy loading, high fetch priority. */
export function SiteArt({ id, className, eager, fallback, alt = "" }: { id: string; className?: string; eager?: boolean; fallback: ReactNode; alt?: string }) {
  const url = useArt(id);
  const [broken, setBroken] = useState(false);
  const [shown, setShown] = useState(false);
  if (!url || broken) return <span className={`site-art site-art--fallback ${className ?? ""}`} data-art={id} data-art-fallback="" aria-hidden="true">{fallback}</span>;
  return (
    <span className={`site-art ${className ?? ""}`} data-art={id} data-shown={shown ? "" : undefined}>
      <img src={url} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" {...(eager ? { fetchPriority: "high" } : {})}
        onLoad={() => setShown(true)} onError={() => setBroken(true)} />
    </span>
  );
}

/** A promise's mark: its icon in a HUD tile (Volt night). The painted spot art belonged to the old site and stays unused. */
export function PromiseSpot({ p }: { p: SitePromise }) {
  return <span className="sv-spot kx-cut" aria-hidden="true"><Icon name={p.icon} size={24} /></span>;
}
