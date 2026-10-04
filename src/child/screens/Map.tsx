// /c/:cid/map: the Garden (ages 6-9) or the Sky map (10-15) over the child's ledger (PRODUCT-DESIGN-V2 §3.8, §6.3.7;
// audit #9: "Mera map opens an empty navy rectangle"). Both have a List toggle (the source of truth). Tapping a plant
// or star opens a sheet with her rendered pose still (watering can / telescope) under the visible "{T} · AI teacher"
// label, the shape and, for Older, the state word with "This shows what you've shown so far", and her one line about
// it (server-composed, GET /api/child/skill-line) with "Hear {T}" in her voice (W2-A, flows G16). Not yet: the thing the
// child made (W2-H's Made for you), How I know. Empty: the painted empty state + Start today's lesson. If the parent
// chose "Only this session" the map is not shown at all (§3.13): the route goes home.
import { useEffect, useRef, useState } from "react";
import { getJson } from "../../lesson/api.ts";
import { Link, Navigate } from "react-router-dom";
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import { Sheet } from "../../ui/Sheet.tsx";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { Spot } from "../art.tsx";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { Icon, Picto } from "../pictos.tsx";
import { usePlan } from "../plan.ts";
import { Garden } from "../progress/Garden.tsx";
import { MapList } from "../progress/MapList.tsx";
import { SkyMap } from "../progress/SkyMap.tsx";
import { Plant, PLANT_KINDS, STATE_WORD, StateShape } from "../progress/StateShape.tsx";
import { useChildMap } from "../useChildMap.ts";

export function useWide(min = 1024): boolean {
  const [w, setW] = useState(() => typeof matchMedia === "function" && matchMedia(`(min-width: ${min}px)`).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const q = matchMedia(`(min-width: ${min}px)`);
    const on = () => setW(q.matches);
    on();
    q.addEventListener?.("change", on);
    return () => q.removeEventListener?.("change", on);
  }, [min]);
  return w;
}

export function MapScreen() {
  const { cid, child, band, family } = useChild();
  const young = family === "young";
  const mode = young ? "garden" : "sky";
  const { plan } = usePlan(cid);
  const { map, loading } = useChildMap(cid, mode, plan.surfaces.map);
  const [view, setView] = useState<"world" | "list">("world");
  const [subjectIx, setSubjectIx] = useState(0);
  const [picked, setPicked] = useState<{ skill: ChildMapSkill; kind: number } | null>(null);
  const wide = useWide();
  const rec = useTeacher(child.teacher_id, band);

  if (!plan.surfaces.map || map?.hidden) return <Navigate to={`/c/${cid}`} replace />;
  const subjects = map?.subjects ?? [];
  const subject = subjects[Math.min(subjectIx, subjects.length - 1)] ?? null;
  const chapters = young ? subjects.flatMap((s) => s.chapters) : subject?.chapters ?? [];
  const selectedCh = !young && subject ? subject.chapters.find((c) => c.topics.some((tp) => tp.skills.some((s) => s.skillId === picked?.skill.skillId)))
    ?? subject.chapters.find((c) => c.here) ?? subject.chapters[0] : null;
  const title = young ? t("garden") : t("sky");
  const startTo = `/c/${cid}/lesson/new`;

  const toggle = (
    <button type="button" className="cs-chipbtn" onClick={() => setView(view === "list" ? "world" : "list")} aria-pressed={view === "list"} data-testid="list-toggle">
      {young ? <Picto id="picto/list" size={32} /> : <Icon name={view === "list" ? "map" : "list"} />}
      <span>{view === "list" ? (young ? t("garden") : t("worldView")) : t("list")}</span>
    </button>
  );

  let body;
  if (loading && !map) body = <div className="map-wait" aria-busy="true" />;
  else if (!map || map.empty) {
    body = (
      <section className="cs-card empty" data-testid="map-empty">
        <Spot id={young ? "states/garden-empty" : "states/sky-empty"} size={200} fallback={<EmptyArt young={young} />} />
        <p className="empty-line">{young ? t("emptyGarden") : t("emptySky")}</p>
        <Link to={startTo} className="cs-btn cs-btn--primary">{t("startToday")}</Link>
      </section>
    );
  } else if (view === "list") {
    body = <MapList chapters={chapters} mode={mode} words={!young} onSelect={(s) => setPicked({ skill: s, kind: 0 })} />;
  } else if (young) {
    body = (
      <>
        <Garden chapters={chapters} onSelect={(s, k) => setPicked({ skill: s, kind: k })} />
        <Link to={startTo} className="cs-btn cs-btn--primary map-cta">{t("todayLesson")}</Link>
      </>
    );
  } else {
    body = (
      <div className="sky-wrap">
        {subjects.length > 1 && (
          <div className="seg" role="radiogroup" aria-label={t("subject")}>
            {subjects.map((s, i) => (
              <button key={s.subject} type="button" role="radio" aria-checked={i === subjectIx} className="seg-btn" onClick={() => { setSubjectIx(i); setPicked(null); }}>
                {subjectName(s.subject)}
              </button>
            ))}
          </div>
        )}
        {selectedCh && (
          <p className="sky-line" data-testid="sky-line">
            <strong>{selectedCh.title.replace(/\s*[—–]\s*/g, " ")}</strong> · {t("nOfMSecure", { n: selectedCh.secure, m: selectedCh.total })}
          </p>
        )}
        {subject && <SkyMap subject={subject} classLevel={Number(child.class_level)} cols={wide ? 4 : 2} selected={picked?.skill.skillId}
          onSelect={(s) => setPicked({ skill: s, kind: 0 })} />}
      </div>
    );
  }

  const detail = picked && (
    <div className="skill-sheet" data-testid="skill-sheet">
      <div className="skill-sheet-row">
        {/* §8: the "{T} · AI teacher" label goes with her everywhere, visibly (not only in the alt text) */}
        <figure className="skill-sheet-her" data-teacher-id={rec.id}>
          <Spot id={young ? rec.stills.watering : rec.stills.telescope} size={96}
            fallback={<Teacher teacherId={rec.id} band={band} form="plate" floor="idle" label="none" lights="up" className="skill-sheet-face" />} />
          <figcaption className="teacher-label">{t("teacherLabel", { T: rec.name })}</figcaption>
        </figure>
        {young
          ? <Plant state={picked.skill.state} kind={PLANT_KINDS[picked.kind % PLANT_KINDS.length]} size={96} recheck={picked.skill.recheckScheduled} />
          : <StateShape state={picked.skill.state} mode="sky" size={72} />}
      </div>
      <HerLine cid={cid} skillId={picked.skill.skillId} name={rec.name} />
      {!young && (
        <>
          <p className="skill-sheet-word"><strong>{STATE_WORD[picked.skill.state]}</strong></p>
          <p className="skill-sheet-note">{t("showsSoFar")}</p>
          {picked.skill.recheckScheduled && <p className="skill-sheet-note">{t("checkAgain", { T: rec.name })}</p>}
        </>
      )}
    </div>
  );

  return (
    <ChildScreen testid="map" ground={young ? "courtyard" : "sky"} title={title} actions={map && !map.empty ? toggle : null}
      surfaces={plan.surfaces} className={`map map--${mode} ${wide && !young ? "map--wide" : ""}`}>
      <div className="map-body" data-view={view}>
        <div className="map-main">{body}</div>
        {wide && !young && map && !map.empty && (
          <aside className="map-side" aria-label={t("list")}>
            {picked ? (
              <section className="cs-card">
                <h2 className="map-side-title">{picked.skill.title}</h2>
                {detail}
              </section>
            ) : (
              selectedCh && <MapList chapters={[selectedCh]} mode="sky" words onSelect={(s) => setPicked({ skill: s, kind: 0 })} />
            )}
          </aside>
        )}
      </div>
      {!(wide && !young) && (
        <Sheet open={!!picked} onClose={() => setPicked(null)} title={(young ? picked?.skill.label : null) ?? picked?.skill.title ?? ""} closeLabel={t("close")}>
          {detail}
        </Sheet>
      )}
    </ChildScreen>
  );
}

/** Her one line about this skill (server-composed in the family's language) and "Hear {T}" in her voice. */
function HerLine({ cid, skillId, name }: { cid: string; skillId: string; name: string }) {
  const [line, setLine] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const qs = `childId=${encodeURIComponent(cid)}&skillId=${encodeURIComponent(skillId)}`;
  useEffect(() => {
    const ac = new AbortController();
    setLine(null);
    getJson<{ text: string }>(`/api/child/skill-line?${qs}`, ac.signal).then((r) => !ac.signal.aborted && setLine(r.text), () => {});
    return () => { ac.abort(); audio.current?.pause(); };
  }, [qs]);
  if (!line) return null;
  const hear = () => {
    audio.current?.pause();
    const a = new Audio(`/api/child/skill-line/audio?${qs}`);
    audio.current = a;
    a.onplay = () => setPlaying(true);
    a.onended = a.onerror = a.onpause = () => setPlaying(false);
    void a.play().catch(() => setPlaying(false));
  };
  return (
    <div className="skill-sheet-line">
      <p className="skill-sheet-say" data-speech="" data-testid="her-line">{line}</p>
      <button type="button" className="cs-btn cs-btn--secondary" onClick={hear} disabled={playing} data-testid="hear-her">
        <Icon name="speaker" size={22} /><span>{t("tapToHear", { T: name })}</span>
      </button>
    </div>
  );
}

export function subjectName(s: string): string {
  const m: Record<string, string> = { maths: "Maths", science: "Science", english: "English", hindi: "Hindi", evs: "EVS", sst: "Social science", "social-science": "Social science" };
  return m[s.toLowerCase()] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

function EmptyArt({ young }: { young: boolean }) {
  return young ? (
    <span className="empty-fb"><Plant state="not_started" kind="rose-bush" size={120} /></span>
  ) : (
    <svg viewBox="-60 -40 120 80" className="empty-fb" aria-hidden="true" focusable="false">
      <rect x="-60" y="-40" width="120" height="80" rx="14" fill="var(--sky-panel)" />
      <g transform="translate(0 0)"><circle r="3.4" fill="var(--sky-star-0)" /></g>
    </svg>
  );
}
