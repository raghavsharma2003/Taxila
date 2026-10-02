// Shared chrome for the adult surfaces: top bar, footer (helplines always reachable), loading and error states.
import type { ReactNode } from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ButtonLink, Mark } from "../ui/index.ts";

export function Brand({ to = "/" }: { to?: string }) {
  return <Link to={to} className="brand" aria-label="Taxila home"><Mark /><span>Taxila</span></Link>;
}

export function TopBar({ children, to }: { children?: ReactNode; to?: string }) {
  return (
    <header className="topbar page">
      <Brand to={to} />
      <span className="spacer" />
      {children}
    </header>
  );
}

/** Helplines are outside every gate (§1.2 /parent/help, §0 item 14). Numbers [M: re-verify at launch]. */
export function Helplines({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "row" : "stack-sm"}>
      <a className="btn btn-secondary btn-sm" href="tel:1098">Childline 1098</a>
      <a className="btn btn-secondary btn-sm" href="tel:14416">Tele-MANAS 14416</a>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page footer-grid">
        <div className="stack-sm">
          <Brand />
          <p className="t-meta">An AI teacher for classes 1 to 9. She is a computer program, and she says so.</p>
        </div>
        <nav className="stack-sm" aria-label="Footer">
          <Link to="/trust">Our promises</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/parent/help">Help and grievance</Link>
        </nav>
        <div className="stack-sm">
          <p className="t-meta">If a child needs help now</p>
          <Helplines compact />
        </div>
      </div>
    </footer>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="center-fill" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  return (
    <main className="col stack center-fill" style={{ textAlign: "center" }}>
      <h1 className="t-title">{notFound ? "This page is not here" : "Something went wrong on this screen"}</h1>
      <p className="muted">{notFound ? "The link may be old." : "Your child's work is saved on our side. Try again, or go back home."}</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <ButtonLink to="/" variant="secondary">Home</ButtonLink>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>Try again</button>
      </div>
    </main>
  );
}

export function NotFound() {
  return (
    <main className="col stack center-fill" style={{ textAlign: "center" }}>
      <h1 className="t-title">This page is not here</h1>
      <p className="muted">The link may be old.</p>
      <ButtonLink to="/" variant="secondary">Home</ButtonLink>
    </main>
  );
}
