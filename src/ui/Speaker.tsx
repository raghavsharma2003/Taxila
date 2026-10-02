// Plays one pre-rendered clip on a tap (never autoplay on the web: a gesture unlocks audio). Always shows a
// visible stop while playing (WCAG 1.4.2, A12). One clip plays at a time across the page.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon.tsx";

let current: HTMLAudioElement | null = null;

export function useClip(src: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => () => { audio.current?.pause(); }, []);
  const toggle = () => {
    if (!audio.current) {
      const a = new Audio(src);
      a.preload = "auto";
      a.addEventListener("ended", () => setPlaying(false));
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("play", () => setPlaying(true));
      a.addEventListener("error", () => { setFailed(true); setPlaying(false); });
      audio.current = a;
    }
    const a = audio.current;
    if (!a.paused) { a.pause(); a.currentTime = 0; return; }
    if (current && current !== a) { current.pause(); current.currentTime = 0; }
    current = a;
    a.play().catch(() => setFailed(true));
  };
  return { playing, failed, toggle };
}

export function Speaker({ src, label, children, className }: { src: string; label: string; children?: ReactNode; className?: string }) {
  const { playing, failed, toggle } = useClip(src);
  return (
    <button type="button" className={className ?? "speaker"} aria-pressed={playing} onClick={toggle}
      aria-label={children ? undefined : playing ? `Stop: ${label}` : label}>
      <Icon name={playing ? "stop" : "speaker"} />
      {children}
      {failed && <span className="t-meta">(could not play)</span>}
    </button>
  );
}
