// Landing `/` (PRODUCT-DESIGN-V2 §6.1.1), rebuilt for release 11 "Volt everywhere" (dc-r4-volt-everywhere; owner,
// 2026-10-11: "revamp the whole thing", the design sense of owner-modern-futurist-vibe-20261010). Volt night, K's tokens
// only. Trust before ask, for a parent deciding in a minute, and a first screen a 10-year-old wants:
//   hero (the product itself: real captures of Home, the lesson Desk with the AI label, a game) → see a real lesson →
//   play and the world → what you'll see as a parent (the four plain words, a How-do-we-know card labelled "Sample") →
//   our promises → price and where we are → FAQ → helplines → final CTA → footer.
// Rules kept from §6.1.1: English chrome; no exclamation marks, no dashes, digits for numbers; no testimonials, ratings
// or outcome numbers (none exist yet); no "replaces tutors" claim; every claim maps to something shipped; one lime
// element per screen state (K's one-volt law): the CTA. The captures are the app's own screens
// (tests/prod/r11-site-captures.mjs writes public/site/*.webp), never a mock-up or stock art.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../ui/index.ts";
import { useSurface } from "../band.ts";
import { Helplines, PrimaryCta, PromiseSpot, Rupee, SiteFooter, SiteHeader, VOLT_NIGHT } from "./Site.tsx";
import { SITE_PROMISES } from "../promises.ts";

/** A capture of the real app in a device frame with HUD corner brackets. The hero's first one is eager (LCP). */
function Shot({ src, alt, eager, tag, className = "" }: { src: string; alt: string; eager?: boolean; tag?: string; className?: string }) {
  return (
    <figure className={`sv-shot ${className}`}>
      <span className="sv-br sv-br--a" aria-hidden="true" /><span className="sv-br sv-br--b" aria-hidden="true" />
      <img src={src} alt={alt} width={600} height={1333} decoding="async" loading={eager ? "eager" : "lazy"} {...(eager ? { fetchPriority: "high" as const } : {})} />
      {tag && <figcaption className="sv-shot-tag">{tag}</figcaption>}
    </figure>
  );
}

/** The game as it plays: a few seconds of the games harness's own Antariksh recording (public/site/game-loop.webm,
 *  166 KB, 7 s), muted and looping, with the still as its poster. Below the fold only (never the LCP): the video mounts when
 *  the frame nears the viewport; reduced motion keeps the still. */
function LoopShot({ poster, src, alt, tag }: { poster: string; src: string; alt: string; tag: string }) {
  const ref = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setPlay(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <figure className="sv-shot" ref={ref}>
      <span className="sv-br sv-br--a" aria-hidden="true" /><span className="sv-br sv-br--b" aria-hidden="true" />
      {play
        ? <video src={src} poster={poster} width={600} height={1331} autoPlay muted loop playsInline preload="auto" aria-label={alt} />
        : <img src={poster} alt={alt} width={600} height={1331} decoding="async" loading="lazy" />}
      <figcaption className="sv-shot-tag">{tag}</figcaption>
    </figure>
  );
}

/** Ledger state shapes as the parent corner draws them: shape first, colour second (§7.3). */
function StateShape({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="sv-ss">
      {level === 0 && <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.4" />}
      {level === 1 && <><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor" /></>}
      {level === 2 && <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />}
      {level === 3 && <circle cx="8" cy="8" r="7" fill="currentColor" />}
    </svg>
  );
}
const STATES = [
  { level: 0, word: "Not started", what: "not taught yet" },
  { level: 1, word: "Practising", what: "working on it, with help" },
  { level: 2, word: "Got it", what: "right on their own today" },
  { level: 3, word: "Secure", what: "still right on a later day" },
] as const;

/** A real How-do-we-know card, in the parent corner's format, with sample data, labelled "Sample" (§6.1.1). */
function SampleEvidence() {
  return (
    <article className="sv-panel sv-evidence" aria-label="Sample of what a parent sees">
      <span className="sv-br sv-br--a" aria-hidden="true" /><span className="sv-br sv-br--b" aria-hidden="true" />
      <div className="sv-evidence-top">
        <span className="sv-sample">Sample</span>
        <span className="sv-meta">Riya · Class 5 · Maths</span>
      </div>
      <h3 className="sv-evidence-claim">Riya can now find a fraction of a group.</h3>
      <p className="sv-chip sv-chip--got"><StateShape level={2} /> Got it</p>
      <p className="kx-label sv-evidence-q">How do we know?</p>
      <ol className="sv-timeline">
        <li><span className="sv-time">Tue, 5:42 pm</span><span>Explained it in her own words</span>
          <q className="sv-quote" data-speech="">a quarter of 12 rotis is 3, because 4 groups of 3 make 12</q><span className="sv-meta">On her own, no hint</span></li>
        <li><span className="sv-time">Tue, 5:47 pm</span><span>Solved a new kind of question on the same idea</span><span className="sv-meta">With one hint</span></li>
        <li><span className="sv-time">Fri</span><span>Checked again in a later lesson</span><span className="sv-meta">It becomes Secure only if Riya is still right then</span></li>
      </ol>
    </article>
  );
}

const FAQ: { q: string; a: string }[] = [
  { q: "Which classes and boards?", a: "Classes 1 to 9, from your child's own school book: CBSE and NCERT, RBSE and other state boards. Maths, science, English and Hindi to start." },
  { q: "Which language does the teacher speak?", a: "English, Hindi or Hinglish, as you choose at set-up. The buttons and screens are always in simple English, and captions show exactly what the teacher says." },
  { q: "Does my child know it is an AI?", a: "Yes. The teacher says so at the first meeting, an AI label sits next to the teacher on every screen, and the teacher never pretends to be a person." },
  { q: "What does my child need?", a: "Any Android phone or a computer with a browser, internet, and a quiet corner. Headphones help. A lesson is 10 to 45 minutes, as you set it." },
  { q: "What if my child is upset or unsafe?", a: "The teacher stops the lesson, tells your child they are not in trouble, gives the Childline and Tele-MANAS numbers, and asks them to find a grown-up. You are told in the parent corner." },
  { q: "Is my child's voice recorded?", a: "Audio of your child's voice is not stored. Lessons, answers and the evidence about what they learned are kept so you can see them, and you can delete them." },
  { q: "Does it replace school or tuition?", a: "No. It teaches one child at a time from their school book, and shows you what they understood. It works best alongside school." },
];

export default function Landing() {
  useSurface({ surface: "parent" });
  useEffect(() => { document.title = "Taxila · a personal AI teacher for classes 1 to 9"; }, []);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div {...VOLT_NIGHT} data-page="landing">
      <a className="sv-skip" href="#main">Skip to content</a>
      <SiteHeader home />
      <main id="main">
        {/* ── hero: the product itself ── */}
        <section className="sv-hero" aria-labelledby="hero-h">
          <div className="sv-grid-bg" aria-hidden="true" />
          <div className="sv-wrap sv-hero-grid">
            <div className="sv-hero-head">
              <p className="kx-label sv-eyebrow">Classes 1 to 9 · CBSE, NCERT, RBSE</p>
              <h1 id="hero-h" className="sv-h1">An AI teacher that <span className="sv-hl">talks</span>, <span className="sv-hl">draws</span> and <span className="sv-hl">plays</span>.</h1>
            </div>
            <div className="sv-hero-stage" aria-label="The Taxila app" role="group">
              <Shot className="sv-shot--side sv-shot--l" src="/site/home.webp" alt="Taxila's home screen: the AI teacher Asha with her AI teacher label, Evening, Riya, and a big Start button" tag="// HOME" />
              <Shot className="sv-shot--main" src="/site/desk.webp" eager alt="A live lesson: the AI teacher asks how many quarters make one half, and draws one half as two quarters on the board" tag="// LIVE LESSON" />
              <Shot className="sv-shot--side sv-shot--r" src="/site/game.webp" alt="Antariksh, a space game: the child flies a ship to one third on a glowing number line" tag="// GAME" />
            </div>
            <div className="sv-hero-body">
              <p className="sv-sub">Live lessons by voice from your child's own school book, in English, Hindi or both. Your child always knows it's an AI, and you see what they really learned.</p>
              <div className="sv-hero-actions">
                <PrimaryCta />
                <a className="kx-ghost kx-cut sv-ghost" href="#lesson">See a real lesson</a>
              </div>
              <ul className="sv-hud" aria-label="At a glance">
                <li><Icon name="speaker" size={18} /> Voice lessons</li>
                <li><Icon name="shield" size={18} /> AI, and says so</li>
                <li><Icon name="tick" size={18} /> Free set-up</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── a real lesson ── */}
        <section id="lesson" className="sv-sect" aria-labelledby="lesson-h">
          <div className="sv-wrap sv-split">
            <div className="sv-split-text">
              <p className="kx-label">How a lesson works</p>
              <h2 id="lesson-h" className="sv-h2">See a real lesson</h2>
              <p className="sv-lead">One child, one teacher, a live conversation by voice. This is the lesson screen exactly as your child sees it.</p>
              <ol className="sv-points">
                <li><span className="sv-n" aria-hidden="true">01</span><div><h3>The question stays on screen</h3><p>Your child can always read what they are being asked, and hear it again with one tap.</p></div></li>
                <li><span className="sv-n" aria-hidden="true">02</span><div><h3>"Your turn" is never a guess</h3><p>The answer area lights up, the words "Your turn" appear and a soft chime plays, so your child knows when to talk.</p></div></li>
                <li><span className="sv-n" aria-hidden="true">03</span><div><h3>Something to work with</h3><p>A board the teacher draws on, pictures or an activity on screen, so the idea is seen and moved, not only heard.</p></div></li>
              </ol>
            </div>
            <div className="sv-split-media"><Shot src="/site/turn.webp" alt="The lesson screen at the child's turn: the AI teacher with her AI label, the question card, the activity, and the answer area lit with the words Your turn" tag="// YOUR TURN" /></div>
          </div>
        </section>

        {/* ── play and the world ── */}
        <section className="sv-sect sv-sect--alt" aria-labelledby="play-h">
          <div className="sv-wrap sv-split sv-split--rev">
            <div className="sv-split-text">
              <p className="kx-label">Play</p>
              <h2 id="play-h" className="sv-h2">Learning that feels like a game</h2>
              <p className="sv-lead">When a game helps, the idea turns into one: fly a ship to 1/3 on a number line, build, sort and aim. Every skill your child makes secure lights up their own world.</p>
              <p className="sv-note"><Icon name="shield" size={18} /> No points, no streaks, no leaderboards. Nothing shrinks if your child takes a day off.</p>
            </div>
            <div className="sv-split-media sv-pair">
              <LoopShot poster="/site/game.webp" src="/site/game-loop.webm" alt="Antariksh, a space game: the child steers a ship along a glowing number line to find one third" tag="// ANTARIKSH" />
              <Shot src="/site/world.webp" alt="Riya's world: a planet in orbit, and the list of skills she has learned in maths, science and English" tag="// YOUR WORLD" />
            </div>
          </div>
        </section>

        {/* ── what the parent sees ── */}
        <section className="sv-sect" aria-labelledby="see-h">
          <div className="sv-wrap sv-split">
            <div className="sv-split-text">
              <p className="kx-label">For parents</p>
              <h2 id="see-h" className="sv-h2">What you'll see as a parent</h2>
              <p className="sv-lead">Not marks and not stars. For every topic, one of four plain words, and behind each one the actual check, the time and your child's own words.</p>
              <ul className="sv-states">
                {STATES.map((s) => <li key={s.word} className="sv-chip" data-level={s.level}><StateShape level={s.level} /><b>{s.word}</b><span className="sv-meta">{s.what}</span></li>)}
              </ul>
              <p className="sv-note">If we cannot point to a check, we do not make the claim.</p>
            </div>
            <div className="sv-split-media"><SampleEvidence /></div>
          </div>
        </section>

        {/* ── promises ── */}
        <section className="sv-sect sv-sect--alt" aria-labelledby="promise-h">
          <div className="sv-wrap">
            <p className="kx-label">On record</p>
            <h2 id="promise-h" className="sv-h2">Our promises</h2>
            <ul className="sv-promises">
              {SITE_PROMISES.map((p) => (
                <li key={p.id} className="sv-panel sv-promise">
                  <PromiseSpot p={p} />
                  <h3>{p.title}</h3>
                  <p>{p.short}</p>
                </li>
              ))}
            </ul>
            <Link className="sv-more" to="/promises">Read the promises in full <Icon name="chevron" /></Link>
          </div>
        </section>

        {/* ── price ── */}
        <section className="sv-sect" aria-labelledby="price-h">
          <div className="sv-wrap sv-two">
            <div className="sv-panel">
              <p className="kx-label">Price</p>
              <h2 id="price-h" className="sv-h3">Set-up is free</h2>
              <p className="sv-lead">We have not set a price for lessons yet. Before you pay anything, it will be shown here in <Rupee /> per month, with what stays free and how to cancel in two taps.</p>
            </div>
            <div className="sv-panel">
              <p className="kx-label">Where we are</p>
              <h2 className="sv-h3">New, and honest about it</h2>
              <p className="sv-lead">Taxila is new. That is why this page has no reviews, ratings or results. We will add them only when they are real and the families agree.</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sv-sect sv-sect--alt" aria-labelledby="faq-h">
          <div className="sv-wrap sv-narrow">
            <p className="kx-label">FAQ</p>
            <h2 id="faq-h" className="sv-h2">Questions parents ask</h2>
            <ul className="sv-faq">
              {FAQ.map((f, i) => (
                <li key={f.q}>
                  <h3>
                    <button type="button" className="sv-faq-q" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                      <span>{f.q}</span><span className="sv-faq-sign" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`faq-${i}`} className="sv-faq-a" hidden={open !== i}><p>{f.a}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── safety ── */}
        <section className="sv-sect" aria-labelledby="safe-h">
          <div className="sv-wrap sv-panel sv-safety">
            <div>
              <h2 id="safe-h" className="sv-h3"><Icon name="shield" /> If a child is upset or unsafe</h2>
              <p className="sv-lead">The teacher stops the lesson, gives the helpline numbers and asks your child to find a grown-up.</p>
            </div>
            <Helplines />
          </div>
        </section>

        {/* ── final CTA ── */}
        <section className="sv-final" aria-labelledby="cta-h">
          <div className="sv-wrap sv-final-inner">
            <p className="kx-label">Ready</p>
            <h2 id="cta-h" className="sv-h2">Set-up takes a few minutes.</h2>
            <p className="sv-lead">Choose the class, meet the teacher, add your child and decide how much time they get each day.</p>
            <PrimaryCta />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
