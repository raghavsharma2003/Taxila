// The lesson route (PRODUCT-DESIGN-V2 §6.3.4): a thin wrapper. It reads the child from ChildShell, owns one
// LessonRuntime (+ the UiBridge: replay buffer, speech hold, cascade talk state), and renders the Desk from
// useDesk's model. Voice lessons start on the CASCADE lane (voice-lane-cascade-default) with no second start
// gate: the audio unlock is carried from the tap that opened the lesson. The Summary renders here when the lesson
// ends (the separate /lesson/:lid/summary route belongs to the child-routes owner; Summary.tsx is ready for it).
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { LessonStartRequest } from "../../../shared/contracts.ts";
import { ApiError } from "../../lesson/api.ts";
import type { RuntimeDeps } from "../../lesson/runtime.ts";
import { RefusedScreen } from "./Refused.tsx";
import { purposeOf, refusalOf, type StartRefusal } from "./answers.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ECHO_DEMOTE_FLAGS, UiBridge } from "../../lesson/uiBridge.ts";
import { useLesson } from "../../lesson/useLesson.ts";
import { TeacherNameProvider, teacherRecord } from "../../ui/teacher/useTeacher.ts";
import { ageBandOf } from "../band.ts";
import { useChild } from "../ChildShell.tsx";
import { markLessonDone } from "../day.ts";
import { readArtefacts, saveArtefact } from "../prefs.ts";
import { Desk, sameSize, type DeskSize, type DeskSkin } from "./Desk.tsx";
import { openMicAllowed, useHeadset } from "./headset.ts";
import { useDesk } from "./useDesk.ts";
import { cachedTextOnly } from "../plan.ts";
import { useSyncExternalStore } from "react";
import { kakshaEnabled } from "../../ui-v3/kaksha/flag.ts";

// r4 K-P2: behind `ui.kaksha` (default off) the Desk renders inside the Kaksha frame (skin CSS + the Debrief at the
// end). A lazy chunk: with the flag off nothing of it loads, and the Desk renders exactly as before.
const KakshaLesson = lazy(() => import("../../ui-v3/kaksha/lesson/KakshaLesson.tsx"));

export type LessonVariant = "lesson" | "practice" | "doubt";

export interface LessonScreenProps {
  variant: LessonVariant;
  topicId?: string;
  /** Doubt: the child's own problem, sent with the start (routing) and as the first typed turn once the lesson is live. */
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
  // The start says what it is for (flows G1): Practice and Ask pass a "Done for today" plan; a lesson does not. A 409
  // LessonStartRefused becomes the designed done / capped / resting screen (Refused.tsx), never the generic error.
  const [refusal, setRefusal] = useState<StartRefusal | null>(null);
  const onRefused = useRef(setRefusal);
  const [deps] = useState<RuntimeDeps>(() => withPurpose(bridge.deps, purposeOf(variant), (r) => onRefused.current(r), variant === "doubt" ? firstText : undefined));
  const { runtime } = useLesson(deps);
  const bs = useSyncExternalStore(bridge.store.subscribe, bridge.store.get, bridge.store.get);
  const headset = useHeadset();
  const [firstLesson] = useState(() => readArtefacts(cid).length === 0);
  const rec = teacherRecord(child.teacher_id, band, child.teacher_name);
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
    // the parent's per-child "Tap and type only" (Controls, server truth on every phone) or this device's "Type instead"
    textOnly: variant === "practice" || search.get("mode") === "text" || prefs.quiet || cachedTextOnly(cid),
    pttNoteSeen: prefs.pttNoteSeen,
    markPttNoteSeen: () => setPrefs({ pttNoteSeen: true }),
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
      // A sibling profile on this device → the picker; else the home. Kaksha (K-P2 rev 2, audit B06): Finish returns to the
      // child's own Home (her world is there); switching child stays one tap away on Home.
      navigate(me.children.length >= 2 && !kakshaEnabled((me as { ui?: { kaksha?: boolean } }).ui?.kaksha) ? "/who" : `/c/${cid}`);
    },
    // round 3 fix (experience B8): the child chose to switch: the lesson they asked for starts now
    start: (id: string) => {
      if (state.lessonId) saveArtefact(cid, { lessonId: state.lessonId, topic: state.topic?.title ?? "", chips: m.summary?.cards.map((c) => c.answer) ?? [], at: Date.now() });
      navigate(`/c/${cid}/lesson/new?topic=${encodeURIComponent(id)}`, { replace: true });
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

  if (refusal) {
    return <RefusedScreen refusal={refusal} young={family === "young"} onHome={() => navigate(`/c/${cid}`)} onGrownUp={() => navigate("/parent/controls")} />;
  }

  // The lesson's own identity: the name pinned at lesson start (state.teacher), so a rename never changes an open lesson.
  const desk = (skin?: DeskSkin) => (
    <Desk m={m} a={a} media={{ meters: [runtime.levels.teacher, bridge.replayLevel], mic: runtime.levels.mic, modules: runtime.modules, lang: child.language_pref, ageBand: ageBandOf(band) }}
      dockRef={dockRef} live={live} onSize={onSize} theme={prefs.theme === "system" ? null : prefs.theme} {...skin} />
  );
  const kaksha = kakshaEnabled((me as { ui?: { kaksha?: boolean } }).ui?.kaksha);
  return (
    <TeacherNameProvider id={m.teacher.id} name={m.teacher.name}>
      {kaksha ? (
        <Suspense fallback={null}>
          <KakshaLesson cid={cid} family={family} reducedMotion={reducedMotion}>{desk}</KakshaLesson>
        </Suspense>
      ) : desk()}
    </TeacherNameProvider>
  );
}

/**
 * The runtime's deps with every start carrying `purpose`, and a 409 refusal body handed to `onRefused` (the runtime
 * still records the failure; the screen shows the refusal instead of the trouble screen). Pure wrapper (tested).
 */
export function withPurpose(deps: RuntimeDeps, purpose: NonNullable<LessonStartRequest["purpose"]>, onRefused: (r: StartRefusal) => void, firstText?: string): RuntimeDeps {
  const api = deps.api;
  if (!api) return deps;
  return {
    ...deps,
    api: {
      ...api,
      // Ask sends the child's question WITH the start (flows G11): the server routes the lesson to its topic
      start: (req: LessonStartRequest) => api.start({ ...req, purpose, ...(firstText ? { firstText: firstText.slice(0, 500) } : {}) }).catch((e: unknown) => {
        const r = e instanceof ApiError && e.status === 409 ? refusalOf(e.body) : null;
        if (r) onRefused(r);
        throw e;
      }),
    },
  };
}
