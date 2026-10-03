// The public pages (PRODUCT-DESIGN-V2 §6.1.2): /promises (old /trust redirects), /privacy, /help, /leaving and the
// 404. They share the marketing site's chrome (landing/Site.tsx) and stylesheet. English chrome; parent copy has no
// exclamation marks and no dashes. Helplines are tel: buttons and come first on /help. Privacy is honest about what
// is not written yet. Every image goes through the B2 loader with a flat fallback.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../ui/index.ts";
import { Helplines, PromiseSpot, SiteArt, SitePage } from "./landing/Site.tsx";
import { SITE_PROMISES } from "./promises.ts";
export { PROMISES, SITE_PROMISES, type SitePromise } from "./promises.ts";

/** "Listen" (§3.11 low-literacy parents): the device's own speech engine reads the text aloud. Hidden without one. */
function ListenButton({ text, label }: { text: string; label: string }) {
  const ok = typeof window !== "undefined" && "speechSynthesis" in window;
  const [on, setOn] = useState(false);
  useEffect(() => () => { if (ok) window.speechSynthesis.cancel(); }, [ok]);
  if (!ok) return null;
  return (
    <button type="button" className="btn btn-secondary btn-sm listen-btn" aria-pressed={on} aria-label={on ? `Stop reading: ${label}` : `Listen: ${label}`}
      onClick={() => {
        const s = window.speechSynthesis;
        s.cancel();
        if (on) { setOn(false); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN"; u.rate = 0.95;
        u.onend = () => setOn(false); u.onerror = () => setOn(false);
        setOn(true); s.speak(u);
      }}>
      <Icon name={on ? "stop" : "speaker"} /> {on ? "Stop" : "Listen"}
    </button>
  );
}

export function Promises() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <SitePage title="Our promises">
      <div className="site-wrap page-narrow">
        <h1 className="page-h1">Our promises</h1>
        <p className="sect-lead">These are on record before you give us anything.</p>
        <ul className="promise-rows">
          {SITE_PROMISES.map((p) => {
            const isOpen = open === p.id;
            return (
              <li key={p.id} className="promise-row">
                <PromiseSpot p={p} />
                <div className="promise-row-body">
                  <h2>{p.title}</h2>
                  <p>{p.short}</p>
                  <div id={`pr-${p.id}`} hidden={!isOpen} className="promise-detail">{p.detail.map((d) => <p key={d}>{d}</p>)}</div>
                  <div className="promise-actions">
                    <button type="button" className="btn btn-quiet btn-sm" aria-expanded={isOpen} aria-controls={`pr-${p.id}`} onClick={() => setOpen(isOpen ? null : p.id)}>
                      {isOpen ? "Show less" : "Read more"}
                    </button>
                    <ListenButton text={[p.title, p.short, ...p.detail].join(". ")} label={p.title} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SitePage>
  );
}
/** The old name (/trust), kept so nothing that imports it breaks. */
export const Trust = Promises;

export function Privacy() {
  return (
    <SitePage title="Privacy">
      <div className="site-wrap page-narrow">
        <h1 className="page-h1">Privacy</h1>
        <p className="site-callout">The full privacy notice is still being written. It will be here before paid plans start. Until then, this is what is true today.</p>
        <h2 className="page-h2">What we keep</h2>
        <ul className="plain">
          <li>Your account: your email or phone, and a password we cannot read.</li>
          <li>Your child's first name, class, board and the choices you make at set-up.</li>
          <li>Lessons, your child's answers and the evidence about what they learned, so you can see them.</li>
          <li>Only if you turn them on: what the teacher remembers across days, and what your child likes.</li>
        </ul>
        <h2 className="page-h2">What we never keep</h2>
        <ul className="plain">
          <li>Audio of your child's voice. It is turned into text for the lesson and then dropped.</li>
          <li>Your child's photo or location.</li>
        </ul>
        <h2 className="page-h2">Who runs it</h2>
        <ul className="plain">
          <li>The teacher's voice and thinking run on Microsoft Azure. Lesson records are stored in a Postgres database.</li>
          <li>We do not sell data, and we do not show ads.</li>
        </ul>
        <h2 className="page-h2">Deleting</h2>
        <p>You can delete a child's whole profile, or your whole account, from the parent corner under Data and privacy. It removes every lesson and answer with it.</p>
      </div>
    </SitePage>
  );
}

export function Help() {
  return (
    <SitePage title="Help and safety">
      <div className="site-wrap page-narrow">
        <div className="help-hero">
          <SiteArt id="states/help-calm" className="help-art" fallback={<span className="help-art-fb"><Icon name="shield" size={40} /></span>} />
          <div>
            <h1 className="page-h1">If a child needs help now</h1>
            <p className="sect-lead">These lines are free, open all day and night, and answer in Hindi and English.</p>
          </div>
        </div>
        <Helplines />
        <ul className="plain help-lines">
          <li><strong>Childline 1098</strong>: for any child who is unsafe, hurt, scared or alone.</li>
          <li><strong>Tele-MANAS 14416</strong>: the national mental health line, for a child or a grown-up who is struggling.</li>
          <li>If someone is in danger right now, call <a href="tel:112">112</a>.</li>
        </ul>
        <h2 className="page-h2">What the teacher does</h2>
        <p>If a child says something that sounds unsafe, the teacher stops the lesson, tells them they are not in trouble, gives these numbers and asks them to find a grown-up at home. You see it in the parent corner.</p>
        <h2 className="page-h2">Help with Taxila</h2>
        <p>Signed in? Open the parent corner and choose Help and safety. To sign in again on this or another phone, use <Link to="/start/phone?login=1">Sign in</Link> with your email and password.</p>
        <p>Forgot your password? A reset is not ready yet: it comes with sign-in by a code sent to your phone. Until then a forgotten password cannot be recovered from this page.</p>
      </div>
    </SitePage>
  );
}

/** "You are leaving Taxila" bridge for every external link. */
export function Leaving() {
  const [sp] = useSearchParams();
  const to = sp.get("to") || "";
  let host = "";
  try { const u = new URL(to); if (u.protocol === "https:" || u.protocol === "http:") host = u.host; } catch { /* invalid */ }
  return (
    <SitePage title="Leaving Taxila">
      <div className="site-wrap page-narrow page-center">
        <h1 className="page-h1">You are leaving Taxila</h1>
        {host ? <p className="sect-lead">The next page is on <strong>{host}</strong>. Taxila does not control it.</p> : <p className="sect-lead">This link does not look right.</p>}
        <div className="row-actions">
          <Link to="/" className="btn btn-secondary">Stay here</Link>
          {host && <a className="btn btn-primary" href={to} rel="noopener noreferrer">Open {host}</a>}
        </div>
      </div>
    </SitePage>
  );
}

export function NotFound() {
  return (
    <SitePage title="Page not found">
      <div className="site-wrap page-narrow page-center">
        <SiteArt id="states/404" className="nf-art" fallback={<span className="nf-art-fb" />} />
        <h1 className="page-h1">This page isn't here.</h1>
        <p className="sect-lead">The link may be old, or typed slightly wrong.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </SitePage>
  );
}
