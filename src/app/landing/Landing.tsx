// Landing `/` (PRODUCT-DESIGN-V2 §6.1.1). Trust before ask, for an Indian parent deciding in a minute:
//   hero (the painted study desk + the teachers a child can pick, the promise, one CTA above the fold at 584 dp)
//   → see a real lesson (a captured V-SHOT of the Desk, never a mock-up) → what you'll see as a parent (a real
//   How-do-we-know card with sample data, labelled "Sample") → progress is a garden, not a score → your child picks
//   the teacher → our promises → price → FAQ → helplines → final CTA → footer.
// Rules: English chrome; no exclamation marks, no dashes, digits for numbers; no testimonials, ratings or outcome
// numbers (none exist yet); no "replaces tutors" claim; no teacher name or pronoun, in text or in audio (the child
// names the teacher); every claim maps to something shipped; the lamp colour never appears here (G-LAMP-1). Every
// image goes through the B2 loader with a flat fallback, so the page is complete before any art lands.
// "Hear a lesson" (§6.1.1) is held back: the only recorded clips are the named onboarding greeting ("I am Asha
// didi"), which would give the parent a fixed named teacher. It returns with no-name lesson clips (deviation
// b4-site-no-hear-player).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../ui/index.ts";
import { useSurface } from "../band.ts";
import { HeroArt, Helplines, PrimaryCta, PromiseSpot, Rupee, SITE_TUTORS, SiteFooter, SiteHeader, TeacherPortrait } from "./Site.tsx";
import { SITE_PROMISES } from "../promises.ts";

/** The hero's flat fallback (and tier D look): paper wall, desk edge, a window of dusk. Token colours only. */
function HeroFallback() {
  return (
    <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1200" height="700" fill="var(--hero-wall)" />
      <rect x="210" y="0" width="300" height="400" rx="6" fill="var(--hero-window)" />
      <rect x="0" y="470" width="1200" height="230" fill="var(--hero-desk)" />
      <path d="M90 600c80-30 170-30 250 0v40c-80-30-170-30-250 0zM340 600c80-30 170-30 250 0v40c-80-30-170-30-250 0z" fill="var(--surface)" opacity=".9" />
    </svg>
  );
}

function Phone({ src, alt, w = 240 }: { src: string; alt: string; w?: number }) {
  return (
    <figure className="phone" style={{ width: w }}>
      <img src={src} alt={alt} width={480} height={853} loading="lazy" decoding="async" fetchPriority="low" />
    </figure>
  );
}

/** Ledger state shapes as the parent corner draws them: shape first, colour second (§7.3). */
function StateShape({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="ss">
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
    <article className="evidence" aria-label="Sample of what a parent sees">
      <div className="evidence-top">
        <span className="sample-tag">Sample</span>
        <span className="site-meta">Riya · Class 5 · Maths</span>
      </div>
      <h3 className="evidence-claim">Riya can now find a fraction of a group.</h3>
      <p className="state-word"><StateShape level={2} /> Got it</p>
      <p className="evidence-q">How do we know?</p>
      <ol className="evidence-list">
        <li><span className="ev-date">Tue, 5:42 pm</span><span>Explained it in her own words</span>
          <q className="ev-quote" data-speech="">a quarter of 12 rotis is 3, because 4 groups of 3 make 12</q><span className="site-meta">On her own, no hint</span></li>
        <li><span className="ev-date">Tue, 5:47 pm</span><span>Solved a new kind of question on the same idea</span><span className="site-meta">With one hint</span></li>
        <li><span className="ev-date">Fri</span><span>Checked again in a later lesson</span><span className="site-meta">It becomes Secure only if Riya is still right then</span></li>
      </ol>
    </article>
  );
}

const FAQ: { q: string; a: string }[] = [
  { q: "Which classes and boards?", a: "Classes 1 to 9, from your child's own school book: CBSE and NCERT, RBSE and other state boards. Maths, science, English and Hindi to start." },
  { q: "Which language does the teacher speak?", a: "English, Hindi or Hinglish, as you choose at set-up. The buttons and screens are always in simple English, and captions show exactly what the teacher says." },
  { q: "Does my child know it is an AI?", a: "Yes. The teacher says so at the first meeting, an AI label sits next to the teacher on every screen, and whatever name your child gives the teacher, it never pretends to be a person." },
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
    <div className="site landing">
      <a className="skip" href="#main">Skip to content</a>
      <SiteHeader home />
      <main id="main">
        {/* ── hero ── */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="site-wrap hero-grid">
            <div className="hero-art">
              <HeroArt id="bg/landing-hero" className="hero-paint" fallback={<HeroFallback />} />
              {/* Code-drawn plates (no bytes): they paint with the first frame and never delay the hero image. */}
              <div className="hero-cast" aria-label="AI teachers your child can choose from" role="img" data-ready="">
                {SITE_TUTORS.map((t, i) => <TeacherPortrait key={t.id} tutor={t} size={i === 0 ? 112 : 84} />)}
              </div>
              <p className="hero-cast-label" aria-hidden="true">AI teacher</p>
            </div>
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-long">Classes 1 to 9 · CBSE, NCERT, RBSE and state boards</span><span className="eyebrow-short">CBSE, NCERT, RBSE and state boards</span></p>
              <h1 id="hero-h" className="hero-h1">A personal AI teacher for classes 1 to 9.</h1>
              <p className="hero-sub">Lessons by voice, in English, Hindi or both. Your child always knows it's an AI, and you see what they learn.</p>
              <div className="hero-actions">
                <PrimaryCta />
                <a className="btn btn-secondary site-cta-2" href="#lesson">See a real lesson</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── a real lesson ── */}
        <section id="lesson" className="sect sect-tint" aria-labelledby="lesson-h">
          <div className="site-wrap split">
            <div className="split-text">
              <h2 id="lesson-h" className="sect-h">See a real lesson</h2>
              <p className="sect-lead">One child, one teacher, a live conversation by voice. This is the lesson screen exactly as your child sees it.</p>
              <ol className="points">
                <li><span className="point-n" aria-hidden="true">1</span><div><h3>The question stays on screen</h3><p>Your child can always read what they are being asked, and hear it again with one tap.</p></div></li>
                <li><span className="point-n" aria-hidden="true">2</span><div><h3>"Your turn" is never a guess</h3><p>The answer area lights up, the words "Your turn" appear and a soft chime plays, so your child knows when to talk.</p></div></li>
                <li><span className="point-n" aria-hidden="true">3</span><div><h3>Something to work with</h3><p>A chalkboard, pictures or an activity on screen, so the idea is seen and moved, not only heard.</p></div></li>
              </ol>
            </div>
            <div className="split-media"><Phone src="/landing/shot-lesson.webp" alt="The lesson screen: a question card reading Which one is half, a chalkboard showing one half equals two quarters, and the answer area lit with the words Your turn" /></div>
          </div>
        </section>

        {/* ── what the parent sees ── */}
        <section className="sect" aria-labelledby="see-h">
          <div className="site-wrap split split-rev">
            <div className="split-text">
              <h2 id="see-h" className="sect-h">What you'll see as a parent</h2>
              <p className="sect-lead">Not marks and not stars. For every topic, one of four plain words, and behind each one the actual check, the time and your child's own words.</p>
              <ul className="states">
                {STATES.map((s) => <li key={s.word}><span className="state-word"><StateShape level={s.level} /> {s.word}</span><span className="site-meta">{s.what}</span></li>)}
              </ul>
              <p className="site-note">If we cannot point to a check, we do not make the claim.</p>
            </div>
            <div className="split-media media-pair">
              <SampleEvidence />
              <Phone src="/landing/shot-parent.webp" alt="The parent home screen: this week's progress, a five minute task to try at home, and the next lesson time" w={220} />
            </div>
          </div>
        </section>

        {/* ── progress is a garden ── */}
        <section className="sect sect-tint" aria-labelledby="grow-h">
          <div className="site-wrap split">
            <div className="split-text">
              <h2 id="grow-h" className="sect-h">Progress your child can see, without scores</h2>
              <p className="sect-lead">Younger children grow a garden: every skill is a plant that sprouts, flowers and fruits as it becomes secure. Older children light up a sky map of stars.</p>
              <p className="site-note">No points, no streaks, no leaderboards. Nothing shrinks if your child takes a day off.</p>
            </div>
            <div className="split-media"><Phone src="/landing/shot-garden.webp" alt="The garden screen for a younger child: two plants growing in a courtyard bed, and a Today's lesson button" /></div>
          </div>
        </section>

        {/* ── names the teacher (flows G9: "chooses a face" returns only when there is more than one look per band) ── */}
        <section className="sect" aria-labelledby="pick-h">
          <div className="site-wrap pick">
            <div className="pick-cast" aria-hidden="true">{SITE_TUTORS.map((t) => <figure key={t.id} className="pick-face"><TeacherPortrait tutor={t} size={120} /><figcaption>AI teacher</figcaption></figure>)}</div>
            <div className="pick-text">
              <h2 id="pick-h" className="sect-h">Your child names the teacher</h2>
              <p className="sect-lead">Your child meets the teacher for their class and gives the teacher a name. The same teacher then appears in every lesson, so there is one person to get to know.</p>
              <p className="site-note">Whatever the name, the teacher is an AI and says so. Names are checked against lists of public figures, unkind words and romance words.</p>
            </div>
          </div>
        </section>

        {/* ── promises ── */}
        <section className="sect sect-tint" aria-labelledby="promise-h">
          <div className="site-wrap">
            <h2 id="promise-h" className="sect-h">Our promises</h2>
            <ul className="promise-grid">
              {SITE_PROMISES.map((p) => (
                <li key={p.id} className="promise-card">
                  <PromiseSpot p={p} />
                  <h3>{p.title}</h3>
                  <p>{p.short}</p>
                </li>
              ))}
            </ul>
            <Link className="site-more" to="/promises">Read the promises in full <Icon name="chevron" /></Link>
          </div>
        </section>

        {/* ── price ── */}
        <section className="sect" aria-labelledby="price-h">
          <div className="site-wrap split split-even">
            <div className="split-text">
              <h2 id="price-h" className="sect-h">Price</h2>
              <p className="sect-lead">Set-up is free. We have not set a price for lessons yet. Before you pay anything, it will be shown here in <Rupee /> per month, with what stays free and how to cancel in two taps.</p>
            </div>
            <div className="split-text">
              <h2 className="sect-h">Where we are</h2>
              <p className="sect-lead">Taxila is new. That is why this page has no reviews, ratings or results. We will add them only when they are real and the families agree.</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sect sect-tint" aria-labelledby="faq-h">
          <div className="site-wrap faq-wrap">
            <h2 id="faq-h" className="sect-h">Questions parents ask</h2>
            <ul className="faq">
              {FAQ.map((f, i) => (
                <li key={f.q}>
                  <h3>
                    <button type="button" className="faq-q" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                      <span>{f.q}</span><span className="faq-sign" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`faq-${i}`} className="faq-a" hidden={open !== i}><p>{f.a}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── safety ── */}
        <section className="sect" aria-labelledby="safe-h">
          <div className="site-wrap safety-card">
            <div>
              <h2 id="safe-h" className="sect-h-sm"><Icon name="shield" /> If a child is upset or unsafe</h2>
              <p>The teacher stops the lesson, gives the helpline numbers and asks your child to find a grown-up.</p>
            </div>
            <Helplines />
          </div>
        </section>

        {/* ── final CTA ── */}
        <section className="cta-band" aria-labelledby="cta-h">
          <div className="site-wrap cta-inner">
            <h2 id="cta-h" className="sect-h">Set-up takes a few minutes.</h2>
            <p className="sect-lead">Choose the class, meet the teacher, add your child and decide how much time they get each day.</p>
            <PrimaryCta className="btn-on-nib" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
