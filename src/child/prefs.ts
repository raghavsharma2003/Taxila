// Per-child, per-device conveniences (§2.8 settings rows). Stored in localStorage behind try/catch: a
// private window or blocked storage just gives the defaults. Nothing here is evidence or progress: the
// ledger lives on the server, and these never change content.
import { useCallback, useEffect, useState } from "react";

export interface ChildPrefs {
  /** Captions always on, overriding the reading-level default (§3.8). */
  captionsAlways: boolean;
  /** Earcons; null = the band default (Young on, Older off). */
  sounds: boolean | null;
  /** Haptic tick on YOUR TURN where supported. */
  haptics: boolean;
  /** Talk mode: tap-to-talk (default) or open mic (Older, headset only). */
  talk: "tap" | "open";
  /** Older presentation: face · small (PiP) · voice and board only. */
  face: "face" | "small" | "voice";
  /** Quiet mode: type or tap; the lesson starts in text mode. */
  quiet: boolean;
  /** Progress world. null = band default (Bagiya Young, Aasmaan Older). */
  world: "bagiya" | "aasmaan" | null;
  /** Comfort: larger text, calmer screen ("kam halchal"). */
  largeText: boolean;
  calm: boolean;
  /** Move up one visual band (never down). */
  bandUp: boolean;
  /** Older theme. */
  theme: "system" | "light" | "dark";
  /** Mirror the split layout (left-handed). */
  mirror: boolean;
  /** First run (C1-C3) done on this device. */
  hello: boolean;
  /** Young picture choice at C1 (one of a fixed set, never unlockable). */
  picture: string | null;
  /** Older: tum / aap, the child's answer wins. */
  address: "tum" | "aap" | null;
  /** Laptop keyboard shortcuts in the lesson (Space, 1-4, R, H, C, Esc); A9: can be turned off. */
  shortcuts: boolean;
  /** The push-to-talk note ("Tap the mic to talk, then tap Done") was dismissed: it never shows again (flows G8). */
  pttNoteSeen: boolean;
}

export const DEFAULT_PREFS: ChildPrefs = {
  captionsAlways: false, sounds: null, haptics: true, talk: "tap", face: "face", quiet: false, world: null,
  largeText: false, calm: false, bandUp: false, theme: "system", mirror: false, hello: false, picture: null, address: null,
  shortcuts: true, pttNoteSeen: false,
};

const key = (cid: string) => `taxila.child.${cid}.prefs`;

export function readPrefs(cid: string): ChildPrefs {
  try {
    const raw = localStorage.getItem(key(cid));
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ChildPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(cid: string, p: ChildPrefs): void {
  try {
    localStorage.setItem(key(cid), JSON.stringify(p));
  } catch {
    /* storage unavailable: the setting lasts for this visit */
  }
}

/**
 * Write one child's prefs from outside their screens (the parent's Controls on this device: "Tap and type only" is
 * prefs.quiet, W1-A item 9). Same storage and same try/catch as usePrefs.
 */
export function setChildPref(cid: string, patch: Partial<ChildPrefs>): ChildPrefs {
  const next = { ...readPrefs(cid), ...patch };
  writePrefs(cid, next);
  return next;
}

export function usePrefs(cid: string): [ChildPrefs, (patch: Partial<ChildPrefs>) => void] {
  const [prefs, setPrefs] = useState(() => readPrefs(cid));
  useEffect(() => setPrefs(readPrefs(cid)), [cid]);
  const update = useCallback(
    (patch: Partial<ChildPrefs>) =>
      setPrefs((cur) => {
        const next = { ...cur, ...patch };
        writePrefs(cid, next);
        return next;
      }),
    [cid],
  );
  return [prefs, update];
}

/** Lesson artefacts kept on this device for the notebook / explainer notes until a server endpoint exists. */
export interface Artefact {
  lessonId: string;
  topic: string;
  chips: string[];
  at: number;
}
const artKey = (cid: string) => `taxila.child.${cid}.artefacts`;
export function readArtefacts(cid: string): Artefact[] {
  try {
    return JSON.parse(localStorage.getItem(artKey(cid)) ?? "[]") as Artefact[];
  } catch {
    return [];
  }
}
export function saveArtefact(cid: string, a: Artefact): void {
  try {
    const list = readArtefacts(cid).filter((x) => x.lessonId !== a.lessonId);
    localStorage.setItem(artKey(cid), JSON.stringify([...list, a].slice(-40)));
  } catch {
    /* ignore */
  }
}
