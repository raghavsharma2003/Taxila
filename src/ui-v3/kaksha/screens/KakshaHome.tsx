// Kaksha Home at /c/:cid when `ui.kaksha` is on (BUILD-SPEC §3.1). Start-only (dc-r4-tutor-model-switches 4): her
// face, her name with "AI teacher", one Start. No topic, no plan card, no tiles. The plan's server state decides the
// CTA. The safety hold, offline and signed-out states render today's Home unchanged, so their copy, the help sheet
// and the 1098 / 14416 floor stay exactly as integrated.
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { preloadLessonRoute } from "../../../child/preload.ts";
import { useChild } from "../../../child/ChildShell.tsx";
import { usePlan } from "../../../child/plan.ts";
import { artTierD } from "../../../child/art.tsx";
import { faceFormOf } from "../../../child/screens/Home.tsx";
import { HelpSheet } from "../../../child/lesson/sheets/HelpSheet.tsx";
import { KxPage } from "../kit.tsx";
import { HomeStateView } from "./HomeState.tsx";
import { useTeacher } from "../../../ui/teacher/useTeacher.ts";
import { useDailyGreeting } from "../../../face-puppet/useDailyGreeting.ts";
import { KakshaRoot } from "../Shell.tsx";
import { HomeView, type HomeViewProps } from "../views.tsx";
import { kt, RING_LABEL } from "../copy.ts";

/** A subject id in words (the World's ring names: Maths, Science, …). */
const subjectName = (s: string | null): string | null => (s ? (RING_LABEL[s] ? kt(RING_LABEL[s]) : s) : null);
import { useChildNav } from "./useNav.ts";
import { useKxGo } from "./go.ts";

export function greetingFor(d = new Date()): HomeViewProps["greeting"] {
  const h = d.getHours();
  // r5 QA: 00:20 said "Morning, Riya"; until 04:00 (the learning day's start) it is still the evening
  return h < 4 || h >= 17 ? "evening" : h < 12 ? "morning" : "day";
}

export function KakshaHome() {
  const { cid, child, band, family, prefs, reducedMotion, me } = useChild();
  const { plan, reload } = usePlan(cid);
  const go = useKxGo(reducedMotion);
  const rec = useTeacher(child.teacher_id, band);
  // her once-a-day greeting (Face to-app/004): spoken after the child's first tap, then a glance at Start
  const hello = useDailyGreeting(cid, { enabled: prefs.face !== "voice" });
  const kn = useChildNav(plan.source === "loading" ? null : plan.surfaces);
  useEffect(() => preloadLessonRoute(), []); // r5-latency: the lesson's code loads while the home is idle
  if (!prefs.hello && !child.avatar) return <Navigate to={`/c/${cid}/hello`} replace />;
  // r7 app-secondary-screens-kaksha: the hold, offline and signed-out states are Kaksha screens too (the hold keeps its
  // copy and the lesson's own Help sheet with the helplines, unchanged)
  if (plan.state === "safety_hold" || plan.state === "offline" || plan.signedOut) {
    const kind = plan.signedOut ? "signedout" : plan.state === "safety_hold" ? "hold" : "offline";
    return (
      <KxPage family={family} reducedMotion={reducedMotion} screen="home" testid="home" title={null} backTo={null} meTo={kn.meTo} parentTo="/parent"
        dock={kind === "hold" ? kn.dock.filter((d) => d.key !== "ask" && d.key !== "practice") : kind === "offline" ? kn.dock.filter((d) => d.key !== "ask") : kn.dock} active="home" go={go}>
        <div data-plan-state={kind === "signedout" ? "signedout" : plan.state} data-plan-source={plan.source} className="kx-home-state">
          <HomeStateView kind={kind} packReady={plan.packReady} practiceTo={`/c/${cid}/practice`} signInTo={`/start/phone?login=1&next=${encodeURIComponent(`/c/${cid}`)}`}
            onRetry={reload} go={go}
            help={(close, grownUp, setGrownUp) => (
              <HelpSheet teacherId={child.teacher_id ?? ""} band={band} childName={child.first_name} backVisible grownUp={grownUp} faceForm={faceFormOf(prefs.face).form}
                onGrownUp={() => setGrownUp(true)} onGrownUpBack={() => setGrownUp(false)} onGrownUpHere={() => { setGrownUp(false); close(); }} onBack={close} />
            )} />
        </div>
      </KxPage>
    );
  }
  const face = artTierD() ? { form: "plate" as const, tier: "D" as const } : faceFormOf(prefs.face);
  const state: HomeViewProps["state"] =
    plan.source === "loading" ? "loading" : plan.state === "capped" ? "capped" : plan.state === "resting" ? "resting" : plan.state === "done" ? "done"
      : plan.state === "homework" ? "homework" : plan.state === "test_window" ? "test" : "start";
  // Start sends NO topic (main 2026-10-10, audit #1): "Just start. Asha takes it from there." means the server decides,
  // and for the session-first cohort a plain start is the school-first intake (4A). The plan only decides the CTA state.
  const startTo = `/c/${cid}/lesson/new`;
  // r5 QA D24: an open lesson to continue is rejoined by its id (still no topic: the classic home already linked it; the
  // lesson route now honours the id)
  const continueTo = plan.state === "resume" && plan.resume?.lessonId ? `/c/${cid}/lesson/${encodeURIComponent(plan.resume.lessonId)}` : null;
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="home">
      <div data-plan-state={plan.source === "loading" ? "loading" : plan.state} data-plan-source={plan.source}>
        <HomeView childName={child.first_name} family={family} reducedMotion={reducedMotion} state={state} greeting={greetingFor()}
          teacher={{ id: child.teacher_id, name: rec.name, band, form: face.form, tier: face.tier }}
          floor={hello.floor ?? undefined} meters={hello.meters}
          // r7 app-home-plan-states: homework help (Ask in homework mode; the lesson a quiet second link), the test window, what
          // they did today and the made-for pieces, and parked questions still waiting
          lessonTo={state === "homework" ? startTo : null} testSubject={subjectName(plan.testWindow?.subject ?? plan.topic?.subject ?? null)}
          did={plan.did[0] ? { ask: plan.did[0].ask, answer: plan.did[0].answer, withHelp: plan.did[0].withHelp } : null}
          madeFor={plan.madeFor.map((it) => ({ id: it.id, title: it.title, still: it.still, to: `/c/${cid}/notebook?made=${encodeURIComponent(it.id)}` }))}
          jarWaiting={(plan.jarWaiting ?? 0) > 0}
          startTo={state === "homework" ? `/c/${cid}/ask?homework=1` : continueTo ?? startTo} resuming={!!continueTo} worldTo={`/c/${cid}/map`} parentTo="/parent" whoTo={me.children.length >= 2 ? "/who" : null} opensAt={plan.opensAt} go={go}
          dock={kn.dock} meTo={kn.meTo} />
      </div>
    </KakshaRoot>
  );
}
