// /c/:cid/ask: "Ask {T} a question" (ages 10-15 only; Young has none, `rj-passive-tutor`) — PRODUCT-DESIGN-V2 §3.7,
// §6.3.7; audit #10 ("the typed question vanishes behind a second start gate"). On Ask the Desk opens AT ONCE with the
// child's question as the Question card ("Your question"); there is no start gate (the lesson's own rule).
// Sources: Type, and (Kaksha, r7 app-ask-voice) "Say it": Voice's transcribe path hears the clip and the words go into
// the field for the child to check before Ask. Hands-free (the default) starts listening as the screen opens once the mic
// is already allowed; Tap to talk waits for the tap. If hearing fails, a line says to type instead (never a dead button).
// "Photo of the question" is NOT shown until a photo route exists (P6). Empty field: Ask disabled with the reason beside it.
import { useEffect, useRef, useState } from "react";
import { canRecord, micGranted, startAskRecording, transcribeAsk, type AskRecording } from "../askVoice.ts";
import { Navigate, useSearchParams } from "react-router-dom";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { ChildScreen, useKx } from "../chrome.tsx";
import { Cta, Ghost, Glyph, Panel } from "../../ui-v3/kaksha/kit.tsx";
import { homeworkAsks, homeworkMatch } from "../api.ts";
import { tr7 } from "../../copy/en.ts";
import type { HomeworkMatch, LessonStartRequest } from "../../../shared/contracts.ts";

/** What Ask starts: the child's words, and for homework the confirmed topic and the match fields for the start. */
interface Asked { text: string; topicId?: string; homework?: Pick<LessonStartRequest, "matchTopicId" | "matchItemId"> }
import { kt } from "../../ui-v3/kaksha/copy.ts";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { LessonScreen } from "../lesson/LessonScreen.tsx";
import { Icon } from "../pictos.tsx";
import { cachedHold, usePlan } from "../plan.ts";

export function Ask() {
  const { cid, child, band, family } = useChild();
  const { plan } = usePlan(cid);
  const rec = useTeacher(child.teacher_id, band);
  const [text, setText] = useState("");
  const [asked, setAsked] = useState<Asked | null>(null);
  // homework help: the match is being read (the Ask button waits for it, ≤ 1.5 s), then the one confirm chip
  const [matching, setMatching] = useState(false);
  const [confirm, setConfirm] = useState<{ text: string; match: HomeworkMatch & { topicId: string } } | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [search] = useSearchParams();
  const kx = useKx();
  const { prefs } = useChild();
  // "Say it": idle → listening (the clip records) → hearing (Voice transcribes) → idle with the words in the field
  const [voice, setVoice] = useState<"idle" | "listening" | "hearing">("idle");
  const [voiceNote, setVoiceNote] = useState<"heard" | "none" | "failed" | null>(null);
  const recRef = useRef<AskRecording | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // APP-05: submitting by typing ends any recording at once (the screen stays mounted for the lesson, so the effect cleanup never runs)
  const cancelVoice = () => { recRef.current?.cancel(); recRef.current = null; setVoice("idle"); };
  const stopListening = async () => {
    const r = recRef.current;
    recRef.current = null;
    if (!r) return;
    setVoice("hearing");
    const clip = await r.stop();
    const heard = clip ? await transcribeAsk(cid, clip) : "";
    setVoice("idle");
    if (heard === null) { setVoiceNote("failed"); return; }
    if (!heard) { setVoiceNote("none"); return; }
    setText((t0) => (t0.trim() ? `${t0.trim()} ${heard}` : heard));
    setVoiceNote("heard");
    field.current?.focus();
  };
  const listen = async () => {
    if (voice !== "idle") return;
    setVoiceNote(null);
    const r = await startAskRecording(() => void stopListening());
    if (!r) { setVoiceNote("failed"); return; }
    if (!alive.current) { r.cancel(); return; } // APP-05: the screen went while the mic was starting
    recRef.current = r;
    setVoice("listening");
  };
  // hands-free (the default; Me → Tap to talk turns it off): listen as the screen opens, when the mic is already allowed
  useEffect(() => {
    if (!kx || prefs.handsFree === false || prefs.quiet || !canRecord()) return;
    let live = true;
    void micGranted().then((ok) => { if (live && ok) void listen(); });
    return () => { live = false; recRef.current?.cancel(); recRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kx]);
  // Homework help (STUDENT-FLOW §4.2 `homework`, parent-switched) is open to every class; plain Ask is Older only
  const homework = search.get("homework") === "1";
  if (family === "young" && !homework) return <Navigate to={`/c/${cid}`} replace />;
  // a safety hold: no Ask (STUDENT-FLOW §4.2); the server refuses the start too
  if (plan.state === "safety_hold" || cachedHold(cid)) return <Navigate to={`/c/${cid}`} replace />;
  if (asked) return <LessonScreen variant="doubt" firstText={asked.text} topicId={asked.topicId} homework={asked.homework} />;
  const ready = text.trim().length > 0;
  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!ready || matching) return;
    cancelVoice();
    const q = text.trim();
    if (!homework) { setAsked({ text: q }); return; }
    // homework (Learning to-app, 2026-11-04): match, then "Is this from <topic>?" only when it names a topic
    setMatching(true);
    void homeworkMatch(cid, q).then((m) => {
      setMatching(false);
      if (homeworkAsks(m)) setConfirm({ text: q, match: m });
      else setAsked({ text: q, homework: {} });
    });
  };
  // Yes: the topic goes as the start's topicId (and the kit question it matched); Not this: matchTopicId null
  const decide = (yes: boolean) => {
    if (!confirm) return;
    cancelVoice();
    const m = confirm.match;
    setAsked(yes ? { text: confirm.text, topicId: m.topicId, homework: m.itemId ? { matchItemId: m.itemId } : {} }
      : { text: confirm.text, homework: { matchTopicId: null } });
  };
  const confirmLine = confirm ? tr7("hw.confirm", { topic: confirm.match.topicTitle ?? confirm.match.subject }) : "";
  if (kx) {
    // Kaksha: one HUD panel, the field as a console, the one plasma action. Homework help names itself.
    return (
      <ChildScreen testid="ask" ground="ask" title={homework ? kt("homeworkCta") : t("askTitle", { T: rec.name })} surfaces={plan.surfaces} className="kx-ask">
        {confirm ? (
          <Panel className="kx-ask-card" testid="homework-confirm">
            <p className="kx-log-ask" data-speech="">{confirm.text}</p>
            <h2 className="kx-panel-title">{confirmLine}</h2>
            <div className="kx-hello-pair">
              <Ghost onClick={() => decide(false)} testid="homework-not-this">{tr7("hw.no")}</Ghost>
              <Cta onClick={() => decide(true)} testid="homework-yes">{tr7("hw.yes")}</Cta>
            </div>
          </Panel>
        ) : (
        <Panel as="form" eyebrow={t("askField")} className="kx-ask-card" testid="ask-card" onSubmit={submit}>
          <textarea id="ask-q" ref={field} className="kx-field" rows={4} maxLength={600} value={text} aria-label={t("askField")}
            onChange={(e) => setText(e.target.value)} placeholder={t("askPlaceholder")} aria-describedby={ready ? undefined : "ask-why"} />
          <div className="kx-ask-src" role="group" aria-label={t("askField")}>
            {canRecord() && (voice === "listening" ? (
              <button type="button" className="kx-chip kx-cut kx-chip--live" onClick={() => void stopListening()} data-testid="ask-say-done" aria-live="polite">
                <span className="kx-rec-dot" aria-hidden="true" /><span>{tr7("ask.listening")}</span>
              </button>
            ) : (
              <button type="button" className="kx-chip kx-cut" onClick={() => void listen()} disabled={voice === "hearing"} data-testid="ask-say">
                <Glyph name="mic" size={20} /><span>{voice === "hearing" ? tr7("ask.hearing") : tr7("ask.say")}</span>
              </button>
            ))}
            <button type="button" className="kx-chip kx-cut" onClick={() => field.current?.focus()}><Glyph name="type" size={20} /><span>{t("askType")}</span></button>
          </div>
          {voiceNote && (
            <p className="kx-tagline" role="status" data-testid="ask-voice-note">
              {voiceNote === "heard" ? tr7("ask.heard", { T: rec.name }) : voiceNote === "none" ? tr7("ask.none") : tr7("ask.failed")}
            </p>
          )}
          {!ready && <p id="ask-why" className="kx-tagline">{t("askReason")}</p>}
          {matching && <p className="kx-tagline" role="status">{tr7("hw.checking")}</p>}
          <Cta type="submit" disabled={!ready || matching} testid="ask-go">{t("askGo")}</Cta>
        </Panel>
        )}
      </ChildScreen>
    );
  }
  return (
    <ChildScreen testid="ask" ground="ask" title={t("askTitle", { T: rec.name })} surfaces={plan.surfaces} className="ask">
      {confirm ? (
        <section className="cs-card ask-card" data-testid="homework-confirm">
          <p className="ask-label">{confirmLine}</p>
          <div className="ask-go">
            <button type="button" className="cs-btn cs-btn--secondary" onClick={() => decide(false)} data-testid="homework-not-this">{tr7("hw.no")}</button>
            <button type="button" className="cs-btn cs-btn--primary" onClick={() => decide(true)} data-testid="homework-yes">{tr7("hw.yes")}</button>
          </div>
        </section>
      ) : (
      <form className="cs-card ask-card" onSubmit={submit}>
        <label htmlFor="ask-q" className="ask-label">{t("askField")}</label>
        <textarea id="ask-q" ref={field} className="cs-input ask-input" rows={3} maxLength={600} value={text}
          onChange={(e) => setText(e.target.value)} placeholder={t("askPlaceholder")} aria-describedby={ready ? undefined : "ask-why"} />
        <div className="ask-sources" role="group" aria-label={t("askField")}>
          <button type="button" className="ask-source" onClick={() => field.current?.focus()}>
            <Icon name="type" size={28} /><span>{t("askType")}</span>
          </button>
        </div>
        <div className="ask-go">
          {!ready && <span id="ask-why" className="cs-reason">{t("askReason")}</span>}
          <button type="submit" className="cs-btn cs-btn--primary" disabled={!ready || matching} data-testid="ask-go">{t("askGo")}</button>
        </div>
      </form>
      )}
    </ChildScreen>
  );
}
