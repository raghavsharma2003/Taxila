// The marketing site's shared chrome (PRODUCT-DESIGN-V2 §6.1): header, footer, the hand-drawn brand mark, the
// helplines as tel: buttons, the inline ₹ glyph (§5.4: no shipped Latin subset covers U+20B9), the teacher portraits
// and the art hook. Used by the landing and by every public page (Public.tsx), so the site reads as one product.
// English chrome only (§5.3). No teacher name or pronoun is written here: the child names the teacher (decision
// child-names-teacher), so the site says "the teacher" and shows the looks unnamed.
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { TUTORS, type TutorCharacter } from "../../../shared/tutors.js";
import { Plate2D } from "../../avatar/Plate2D.tsx";
import { Icon, useArt } from "../../ui/index.ts";
import type { SitePromise } from "../promises.ts";
import "../../styles/landing.css";

/** The brand mark: an open book whose spine rises into a pen nib. Same glyph as public/favicon.svg (brand.mjs). */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="brand-mark">
      <rect x="3.84" y="3.84" width="56.32" height="56.32" rx="14" fill="var(--brand-ink)" />
      <path d="M32 8.5C35.2 14.6 41.5 20.4 41.5 28c0 5-3.4 8.3-6.9 9.9V44h-5.2v-6.1c-3.5-1.6-6.9-4.9-6.9-9.9 0-7.6 6.3-13.4 9.5-19.5z" fill="var(--brand-cream)" />
      <path d="M32 12.5v14" stroke="var(--brand-ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="29.4" r="2.6" fill="var(--brand-ink)" />
      <path d="M10 41.5c7.4-3.8 14.6-3.8 20.6.2V53c-6-4-13.2-4-20.6-.2z" fill="var(--brand-cream)" />
      <path d="M54 41.5c-7.4-3.8-14.6-3.8-20.6.2V53c6-4 13.2-4 20.6-.2z" fill="var(--brand-cream)" />
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

export function PrimaryCta({ className = "" }: { className?: string }) {
  const who = useVisitor();
  if (who === "app") return <Link className={`btn btn-primary site-cta ${className}`} to="/who">Open Taxila</Link>;
  if (who === "signed-in") return <Link className={`btn btn-primary site-cta ${className}`} to="/who">Go to Taxila</Link>;
  return <Link className={`btn btn-primary site-cta ${className}`} to="/start/class">Start free set-up</Link>;
}

export function SiteHeader({ home }: { home?: boolean }) {
  const who = useVisitor();
  return (
    <header className="site-header">
      <div className="site-wrap site-header-row">
        <Link to="/" className="site-brand" aria-label="Taxila home"><BrandMark size={32} /><span>Taxila</span></Link>
        <nav className="site-nav" aria-label="Site">
          {home ? <a href="#lesson">How a lesson works</a> : <NavLink to="/#lesson">How a lesson works</NavLink>}
          <NavLink to="/promises">Our promises</NavLink>
          <NavLink to="/help">Help and safety</NavLink>
        </nav>
        <span className="site-spacer" />
        {who === "new" ? <Link className="site-signin" to="/start/phone?login=1">Sign in</Link> : <Link className="site-signin" to="/who">{who === "app" ? "Open Taxila" : "Go to Taxila"}</Link>}
      </div>
    </header>
  );
}

/** Childline and Tele-MANAS as real tel: buttons (§6.1.2 Help). Numbers re-verified at launch (§16). */
export function Helplines() {
  return (
    <div className="site-helplines">
      <a className="btn btn-secondary site-tel" href="tel:1098"><span className="site-tel-name">Childline</span> <span className="site-tel-num">1098</span></a>
      <a className="btn btn-secondary site-tel" href="tel:14416"><span className="site-tel-name">Tele-MANAS</span> <span className="site-tel-num">14416</span></a>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-wrap site-footer-grid">
        <div className="site-stack-sm">
          <Link to="/" className="site-brand" aria-label="Taxila home"><BrandMark size={28} /><span>Taxila</span></Link>
          <p className="site-meta">A personal AI teacher for classes 1 to 9. The teacher is an AI and always says so.</p>
        </div>
        <nav className="site-stack-sm" aria-label="Footer">
          <Link to="/help">Help and safety</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/promises">Our promises</Link>
        </nav>
        <div className="site-stack-sm">
          <p className="site-meta">If a child needs help now</p>
          <Helplines />
        </div>
      </div>
    </footer>
  );
}

export function SitePage({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => { document.title = `${title} · Taxila`; }, [title]);
  return (
    <div className="site">
      <a className="skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" className="site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** The teacher a child actually meets: the live looks of shared/tutors.js (round 4: Asha alone; Arjun and Uma are
 *  parked, dc-r4-single-teacher-asha). The site never shows a face the product does not render (audit #4: one
 *  stable teacher). */
export const SITE_TUTORS: TutorCharacter[] = TUTORS.filter((t) => t.status === "live");

/** A teacher's face as the picker draws its portrait: the code-drawn plate from the look (Plate2D `still`, the
 *  same person as the lesson's tier D face). No bytes to fetch, so it never competes with the hero for the LCP.
 *  The plate's own accessible name carries the catalogue name, so the portrait is hidden from assistive tech and
 *  the caller labels the group. */
export function TeacherPortrait({ tutor, size }: { tutor: TutorCharacter; size: number }) {
  return (
    <span className="rig-portrait" style={{ width: size, height: size }} data-tutor={tutor.id} aria-hidden="true">
      <Plate2D tutor={tutor} still reducedMotion className="site-plate" />
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

/** Spot art for a promise; until the image lands, a tinted disc with the promise's icon. */
export function PromiseSpot({ p }: { p: SitePromise }) {
  return <SiteArt id={p.art} className="promise-spot" fallback={<span className="promise-spot-fb"><Icon name={p.icon} size={28} /></span>} />;
}
