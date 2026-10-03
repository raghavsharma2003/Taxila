// The lesson route (PRODUCT-DESIGN-V2 §6.3.4): a thin wrapper. It reads the child from ChildShell, owns one
// LessonRuntime (+ the UiBridge: replay buffer, speech hold, cascade talk state), and renders the Desk from
// useDesk's model. Voice lessons start on the CASCADE lane (voice-lane-cascade-default) with no second start
// gate: the audio unlock is carried from the tap that opened the lesson. The Summary renders here when the lesson
// ends (the separate /lesson/:lid/summary route belongs to the child-routes owner; Summary.tsx is ready for it).
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ECHO_DEMOTE_FLAGS, UiBridge } from "../../lesson/uiBridge.ts";
import { useLesson } from "../../lesson/useLesson.ts";
import { teacherRecord } from "../../ui/teacher/useTeacher.ts";
import { ageBandOf } from "../band.ts";
import { useChild } from "../ChildShell.tsx";
import { markLessonDone } from "../day.ts";
import { readArtefacts, saveArtefact } from "../prefs.ts";
import { Desk, sameSize, type DeskSize } from "./Desk.tsx";
import { openMicAllowed, useHeadset } from "./headset.ts";
import { useDesk } from "./useDesk.ts";
import { useSyncExternalStore } from "react";

export type LessonVariant = "lesson" | "practice" | "doubt";

export interface LessonScreenProps {
  variant: LessonVariant;
  topicId?: string;
  /** Doubt: the child's own problem, sent as the first typed turn once the lesson is live. */
  firstText?: string;
}

function isEditable(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export function LessonScreen({ variant, topicId, firstText }: LessonScreenProps) {
  const { cid, child, me, band, family, lang, prefs, setPrefs, reducedMotion } = useChild();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [bridge] = useState(() => new UiBridge());
  useEffect(() => () => bridge.dispose(), [bridge]);
  const { runtime } = useLesson(bridge.deps);
  const bs = useSyncExternalStore(bridge.store.subscribe, bridge.store.get, bridge.store.get);
  const headset = useHeadset();
  const [firstLesson] = useState(() => readArtefacts(cid).length === 0);
  const rec = teacherRecord(child.teacher_id, band);
  const [size, setSize] = useState<DeskSize>({ w: typeof innerWidth === "number" ? innerWidth : 360, h: typeof innerHeight === "number" ? innerHeight : 640, fontScale: 1 });
  const onSize = useCallback((s: DeskSize) => setSize((p) => (sameSize(p, s) ? p : s)), []);

  const { m, a, dockRef, live, state } = useDesk(runtime, bridge, {
    cid,
    band,
    family,
    teacherId: rec.id,
    teacherName: rec.name,
    childName: child.first_name,
    lessonLang: lang,
    captionsAlways: prefs.captionsAlways,
    sounds: prefs.sounds,
    haptics: prefs.haptics,
    reducedMotion,
    timing: [1, 1.5, 2].includes(Number(child.timing_multiplier)) ? Number(child.timing_multiplier) : 1,
    variant,
    topicId: topicId || search.get("topic") || undefined,
    firstText,
    textOnly: variant === "practice" || search.get("mode") === "text" || prefs.quiet,
    openMic: openMicAllowed({ older: family === "older", wanted: prefs.talk === "open", headset, echoDemoted: bs.echoFlags >= ECHO_DEMOTE_FLAGS }),
    faceForm: "live",
    setCaptionsAlways: (on) => setPrefs({ captionsAlways: on }),
    // No finished lesson saved on this device yet (the T6 heuristic runs in the first lesson only).
    firstLesson: firstLesson,
  }, {
    home: () => navigate(`/c/${cid}`),
    who: () => navigate("/who"),
    signIn: () => navigate(`/start/phone?next=${encodeURIComponent(location.pathname + location.search)}`),
    parent: () => navigate("/parent"),
    finished: () => {
      if (state.lessonId) saveArtefact(cid, { lessonId: state.lessonId, topic: state.topic?.title ?? "", chips: m.summary?.cards.map((c) => c.answer) ?? [], at: Date.now() });
      if (variant === "lesson") markLessonDone(cid, state.lessonId, bs.ended);
      // A sibling profile on this device → the picker; else the home.
      navigate(me.children.length >= 2 ? "/who" : `/c/${cid}`);
    },
  }, size);

  // Laptop keys (§6.3.4; never while a text field has focus): Esc opens Pause on every band (§6.4.1); Space
  // talk/done, H hear the question and 1-4 a tile are single-key shortcuts, off for Young and when turned off.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isEditable(e.target as Element) || isEditable(document.activeElement)) return;
      if (e.key === "Escape") {
        if (m.sheet === "help" || m.sheet === "grownup") return; // one key never dismisses the safeguarding hand-off
        if (m.sheet) return a.resume();
        if (state.phase === "live") a.pause();
        return;
      }
      if (family === "young" || !prefs.shortcuts) return;
      if (state.phase !== "live" || m.sheet) return;
      if (e.key === " " && m.mic.available && (m.floor === "your_turn" || m.mic.talking)) {
        if ((e.target as HTMLElement)?.closest?.("button, a, [role=button]")) return;
        e.preventDefault();
        a.talk();
      } else if (/^[1-4]$/.test(e.key) && m.tray?.kind === "tiles" && m.tray.tiles?.[Number(e.key) - 1]) {
        a.pickTile(m.tray.tiles[Number(e.key) - 1]);
      } else if (e.key === "h" || e.key === "H") a.hearQuestion();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    document.title = `${m.shortTitle || "Lesson"} · Taxila`;
  }, [m.shortTitle]);

  return (
    <Desk m={m} a={a} media={{ meters: [runtime.levels.teacher, bridge.replayLevel], mic: runtime.levels.mic, modules: runtime.modules, lang: child.language_pref, ageBand: ageBandOf(band) }}
      dockRef={dockRef} live={live} onSize={onSize} theme={prefs.theme === "system" ? null : prefs.theme} />
  );
}
