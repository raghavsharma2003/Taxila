// /trust, /privacy, /leaving — public, bundled, reachable from every parent screen (§1.2).
import { useSearchParams } from "react-router-dom";
import { Button, ButtonLink, Icon, type IconName } from "../ui/index.ts";
import { Footer, TopBar } from "./Shell.tsx";

export const PROMISES: { icon: IconName; title: string; body: string }[] = [
  { icon: "noCall", title: "No sales calls", body: "Nobody from Taxila will phone you to sell anything. Your number is for your child's reports and your account, nothing else." },
  { icon: "noLoan", title: "No loans, no EMI", body: "We never offer loans, EMI or finance. When paid plans start, you will pay month by month in rupees and can cancel in two taps." },
  { icon: "trash", title: "Delete anything", body: "You can see what we keep about your child and delete the whole profile any time, from the Parent corner. Deleting a single lesson or only the transcripts is being built next." },
];

export function Trust() {
  return (
    <>
      <TopBar />
      <main id="main" className="col stack" style={{ paddingBlock: "var(--space-5)" }}>
        <h1 className="t-title">Our promises to you</h1>
        <p className="t-lead muted">These are on record before you give us anything.</p>
        <ul className="promise-list">
          {PROMISES.map((p) => (
            <li key={p.title} className="card stack-sm">
              <span className="promise-icon"><Icon name={p.icon} /></span>
              <h2 className="t-h3">{p.title}</h2>
              <p>{p.body}</p>
            </li>
          ))}
          <li className="card stack-sm">
            <span className="promise-icon"><Icon name="eye" /></span>
            <h2 className="t-h3">You see what she sees</h2>
            <p>Every claim we make about your child's learning has a "Kaise pata?" (how do we know) behind it: the check, the date, and your child's own words.</p>
          </li>
          <li className="card stack-sm">
            <span className="promise-icon"><Icon name="shield" /></span>
            <h2 className="t-h3">She never pretends to be a person</h2>
            <p>The teacher is a computer program. She tells your child so, and if a child is upset or unsafe she gives the helpline numbers and tells them to find a grown-up.</p>
          </li>
        </ul>
      </main>
      <Footer />
    </>
  );
}

export function Privacy() {
  return (
    <>
      <TopBar />
      <main id="main" className="col stack" style={{ paddingBlock: "var(--space-5)" }}>
        <h1 className="t-title">Privacy</h1>
        <div className="note">The full privacy notice is being written and will be here before launch.</div>
        <h2 className="t-h3">What is true today</h2>
        <ul className="stack-sm plain-list">
          <li>Audio of your child's voice is not stored.</li>
          <li>Lessons, your child's answers and the evidence about what they learned are stored so you can see them.</li>
          <li>You choose separately whether she remembers learning across days and whether she remembers what your child likes.</li>
          <li>You can delete a child's whole profile from the Parent corner. It removes every lesson and answer with it.</li>
          <li>The teacher's voice and thinking run on Microsoft Azure.</li>
        </ul>
      </main>
      <Footer />
    </>
  );
}

/** "You are leaving Taxila" bridge for every external link (§1.2). */
export function Leaving() {
  const [sp] = useSearchParams();
  const to = sp.get("to") || "";
  let host = "";
  try { const u = new URL(to); if (u.protocol === "https:" || u.protocol === "http:") host = u.host; } catch { /* invalid */ }
  return (
    <main id="main" className="col stack center-fill">
      <h1 className="t-title">You are leaving Taxila</h1>
      {host ? <p className="t-lead">The next page is on <strong>{host}</strong>. Taxila does not control it.</p> : <p>This link does not look right.</p>}
      <div className="row">
        <ButtonLink to="/" variant="secondary">Stay here</ButtonLink>
        {host && <Button onClick={() => { location.href = to; }}>Open {host}</Button>}
      </div>
    </main>
  );
}
