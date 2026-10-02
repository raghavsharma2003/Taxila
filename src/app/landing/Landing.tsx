// Landing (`/`, §2.1). Trust before ask: hear her, see a lesson in three pictures, see what the parent will
// see (a labelled example), the price status, the promises, then start. Rules: no autoplay (a tap plays her),
// no testimonials, ratings or outcome numbers (none exist yet), no countdowns, no "replaces tutors" claim.
// Copy: aap, one idea per section, no dashes or exclamation hype in UI strings (§6.12).
import { useEffect, useState } from "react";
import "../../styles/landing.css";
import { Link } from "react-router-dom";
import { ButtonLink, Hi, Icon, StateChip, TeacherFace, useClip } from "../../ui/index.ts";
import { loadMe } from "../api.ts";
import { useSurface } from "../band.ts";
import { PROMISES } from "../Public.tsx";
import { Footer, Helplines, TopBar } from "../Shell.tsx";
import { StillTeach, StillTeachBack, StillWarmup } from "./Stills.tsx";

const VOICES = [
  { id: "hi", label: "हिन्दी", lang: "hi", src: "/audio/hello-hi.mp3", name: "Hear her in Hindi" },
  { id: "hinglish", label: "Hinglish", lang: undefined, src: "/audio/hello-hinglish.mp3", name: "Hear her in Hinglish" },
  { id: "en", label: "English", lang: undefined, src: "/audio/hello-en.mp3", name: "Hear her in English" },
] as const;

function VoiceTile({ v, onPlaying }: { v: (typeof VOICES)[number]; onPlaying: (id: string | null) => void }) {
  const { playing, failed, toggle } = useClip(v.src);
  useEffect(() => { onPlaying(playing ? v.id : null); }, [playing, v.id, onPlaying]);
  return (
    <button type="button" className="voice-tile" aria-pressed={playing} onClick={toggle} aria-label={playing ? `Stop. ${v.name}` : v.name}>
      <span className="voice-icon"><Icon name={playing ? "stop" : "speaker"} /></span>
      <span lang={v.lang} className={v.lang ? "deva" : undefined}>{v.label}</span>
      {failed && <span className="t-meta">could not play</span>}
    </button>
  );
}

function SampleEvidenceCard() {
  return (
    <article className="sample card" aria-label="Example of what a parent sees">
      <div className="row">
        <span className="example-badge">Example</span>
        <span className="t-meta">made-up child, real format</span>
      </div>
      <div className="row" style={{ alignItems: "baseline" }}>
        <h3 className="t-h3" style={{ fontFamily: "var(--font-text)" }}>Halves and quarters</h3>
        <span className="t-meta">Riya · Class 4 · Maths</span>
      </div>
      <StateChip state={{ level: 2, key: "learned_today" }} lang="hinglish" nextReview="2026-10-08" />
      <p className="sample-q"><strong>Kaise pata?</strong> <span className="muted">(how do we know)</span></p>
      <ol className="ev-list">
        <li>
          <span className="ev-date">6 Oct</span>
          <span className="ev-what">Explained it in her own words</span>
          <q className="ev-quote">roti ke chaar barabar tukde karo to har tukda ek chauthai hai</q>
          <span className="t-meta">On her own, no hint</span>
        </li>
        <li>
          <span className="ev-date">6 Oct</span>
          <span className="ev-what">Solved a new kind of question on the same idea</span>
          <span className="t-meta">With one hint</span>
        </li>
        <li>
          <span className="ev-date">8 Oct</span>
          <span className="ev-what">Next check, in a later lesson</span>
          <span className="t-meta">It becomes <strong>Pakka</strong> only if she is still right then</span>
        </li>
      </ol>
    </article>
  );
}

export default function Landing() {
  useSurface({ surface: "parent" });
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  // Off the critical path (§7.3 budget): ask "signed in?" after first paint, when the browser is idle.
  useEffect(() => {
    const run = () => { loadMe().then((m) => setSignedIn(!!m), () => {}); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(run, { timeout: 2000 }); return () => w.cancelIdleCallback?.(id); }
    const t = window.setTimeout(run, 300);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => { document.title = "Taxila · an AI teacher who notices"; }, []);

  return (
    <div className="landing">
      <a className="skip" href="#main">Skip to content</a>
      <TopBar>
        {signedIn ? <ButtonLink to="/who" variant="secondary" small>Open Taxila</ButtonLink> : <ButtonLink to="/start/phone?login=1" variant="quiet" small>Sign in</ButtonLink>}
      </TopBar>

      <main id="main">
        <section className="hero page" aria-labelledby="hero-h">
          <div className="hero-face">
            <TeacherFace size={260} speaking={!!speaking} />
            <p className="t-meta hero-caption">This is the voice she teaches with. Her face here is a drawing.</p>
          </div>
          <div className="hero-copy stack">
            <p className="eyebrow">Classes 1 to 9 · CBSE, NCERT, RBSE and state boards</p>
            <h1 id="hero-h" className="t-display">A teacher who talks with your child, and shows you what they really understood.</h1>
            <p className="t-lead">
              Taxila is an AI voice teacher. She teaches one child at a time, from their own school book, in
              <Hi> हिन्दी</Hi>, Hinglish or English. She is a computer program, and she tells your child so.
            </p>
            <div className="stack-sm">
              <p className="label-strong" id="hear-h">Hear her (about 10 seconds)</p>
              <div className="voice-row" role="group" aria-labelledby="hear-h">
                {VOICES.map((v) => <VoiceTile key={v.id} v={v} onPlaying={(id) => setSpeaking((cur) => (id ? id : cur === v.id ? null : cur))} />)}
              </div>
            </div>
            <div className="row cta-row">
              <ButtonLink to="/start/lang" icon={<Icon name="chevron" />}>Start in the browser</ButtonLink>
              <a className="btn btn-secondary" href="#lesson">What is a lesson like</a>
            </div>
            <p className="t-meta">The Android app is coming. The browser version works on any phone today.</p>
          </div>
        </section>

        <section id="lesson" className="band" aria-labelledby="lesson-h">
          <div className="page stack">
            <h2 id="lesson-h" className="t-title">A lesson, in three pictures</h2>
            <p className="muted t-lead">A live voice lesson of 10 to 45 minutes, set by you. She talks, your child talks back, and something on the screen moves.</p>
            <ol className="stills">
              <li className="stack-sm"><StillWarmup /><h3 className="t-h3">1. Warm-up</h3><p>She starts with something from last time, to see what stayed.</p></li>
              <li className="stack-sm"><StillTeach /><h3 className="t-h3">2. Teaching</h3><p>She explains with something your child can move on screen, and points at what she means.</p></li>
              <li className="stack-sm"><StillTeachBack /><h3 className="t-h3">3. Teaching back</h3><p>Your child explains it to someone smaller. Explaining is how she knows it is understood, not just remembered.</p></li>
            </ol>
          </div>
        </section>

        <section className="page split" aria-labelledby="see-h">
          <div className="stack">
            <h2 id="see-h" className="t-title">What you will see</h2>
            <p className="t-lead">Not marks, not stars. For every topic, one of four plain words, and behind each one the actual check, the date and your child's own words.</p>
            <ul className="words">
              <li><StateChip state={{ level: 0, key: "unseen" }} lang="hi" /><span>not started</span></li>
              <li><StateChip state={{ level: 1, key: "practising" }} lang="hi" /><span>working on it</span></li>
              <li><StateChip state={{ level: 2, key: "learned_today" }} lang="hi" /><span>got it, will be checked again</span></li>
              <li><StateChip state={{ level: 3, key: "mastered" }} lang="hi" /><span>still right on a later day</span></li>
            </ul>
            <p className="muted">A weekly report comes on WhatsApp. If we cannot point to a check, we do not say it.</p>
          </div>
          <SampleEvidenceCard />
        </section>

        <section className="band" aria-labelledby="promise-h">
          <div className="page stack">
            <h2 id="promise-h" className="t-title">Three promises</h2>
            <ul className="promise-row">
              {PROMISES.map((p) => (
                <li key={p.title} className="stack-sm">
                  <span className="promise-icon"><Icon name={p.icon} /></span>
                  <h3 className="t-h3">{p.title}</h3>
                  <p className="muted">{p.body}</p>
                </li>
              ))}
            </ul>
            <Link to="/trust" className="block-link">Read all our promises</Link>
          </div>
        </section>

        <section className="page split" aria-labelledby="price-h">
          <div className="stack">
            <h2 id="price-h" className="t-title">What it costs</h2>
            <p className="t-lead">We have not set a price yet. Before you pay anything, it will be here in rupees, with what is free and how to cancel in two taps.</p>
          </div>
          <div className="stack">
            <h2 className="t-title">Where we are</h2>
            <p className="t-lead">Taxila is new and in an early pilot. That is why there are no reviews, ratings or results on this page. We will add them only when they are real and the families agree.</p>
          </div>
        </section>

        <section className="page safety" aria-labelledby="safe-h">
          <div className="card stack-sm">
            <h2 id="safe-h" className="t-h3"><Icon name="shield" /> If a child is upset or unsafe</h2>
            <p>She stops the lesson, gives the helpline numbers and asks your child to find a grown-up.</p>
            <Helplines compact />
          </div>
        </section>

        <section className="cta-band" aria-labelledby="cta-h">
          <div className="page stack" style={{ alignItems: "flex-start" }}>
            <h2 id="cta-h" className="t-title">Set up takes a few minutes.</h2>
            <p className="t-lead">You choose the language, add your child, and decide how much time she gets each day.</p>
            <ButtonLink to="/start/lang" variant="secondary" icon={<Icon name="chevron" />}>Start in the browser</ButtonLink>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
