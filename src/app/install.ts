// The installed app (r7 app-pwa-install): the service worker (public/sw.js: an offline-safe shell, never data) and the
// browser's install offer. Chrome on Android fires `beforeinstallprompt` once the page qualifies; it is held here so a
// screen can offer "Put Taxila on this phone" at a moment the grown-up chooses (never a pop-up on load).
import { useEffect, useState } from "react";

interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let held: InstallPrompt | null = null;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => f());

/** Running as the installed app (no install offer then). */
export const standalone = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** Production only: register the worker after the page has loaded, and hold the install offer. */
export function installApp(prod: boolean): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); held = e as InstallPrompt; tell(); });
  window.addEventListener("appinstalled", () => { held = null; tell(); });
  if (!prod || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => { void navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(buildId())}`, { scope: "/" }).catch(() => {}); });
}

/** This build's id (the worker's cache name): the deploy's commit when the build carries it, else the content hash in the
 *  entry bundle's own file name (/assets/index-<hash>.js), which Vite changes whenever the build changes. */
export function buildId(sha = import.meta.env?.VITE_BUILD_SHA as string | undefined, entryUrl = import.meta.url): string {
  if (sha) return String(sha).slice(0, 12);
  const m = /-([A-Za-z0-9_-]{8,})\.js(?:$|\?)/.exec(entryUrl);
  return m ? m[1] : "dev";
}

/** The install offer while the browser holds one (null otherwise, and always null in the installed app). */
export function useInstallOffer(): (() => Promise<boolean>) | null {
  const [, bump] = useState(0);
  useEffect(() => { const f = () => bump((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  if (!held || standalone()) return null;
  return async () => {
    const p = held;
    if (!p) return false;
    held = null;
    tell();
    await p.prompt();
    return (await p.userChoice).outcome === "accepted";
  };
}
