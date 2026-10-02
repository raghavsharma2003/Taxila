// /dev/lesson — a functional (deliberately unstyled) screen that drives the live-lesson runtime end to end:
// sign in or create a throwaway test family, start a voice or text lesson, talk/type/tap, watch status,
// captions and levels, and mount engines by hand. The real child UI comes from the design workstream;
// everything here is a thin consumer of src/lesson/ and src/modules/host.tsx.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { ModuleCommand, ModuleEvent } from "../../shared/contracts.ts";
import { ApiError, getJson, postJson } from "../lesson/api.ts";
import type { LevelMeter } from "../lesson/level.ts";
import type { LessonMode, TeacherStatus } from "../lesson/link.ts";
import { useLesson, useLevel } from "../lesson/useLesson.ts";
import { ModuleHost } from "../modules/host.tsx";

interface Child {
  id: string;
  first_name: string;
  class_level: number;
  language_pref: string;
}
interface Me {
  guardian: { id: string; email: string; name: string };
  children: Child[];
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const box: CSSProperties = { border: "1px solid #ccc", borderRadius: 8, padding: 12, margin: "12px 0" };
const row: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const STATUS_WORD: Record<TeacherStatus, string> = { listening: "Listening", thinking: "Thinking", speaking: "Speaking", your_turn: "Your turn" };

export default function LessonDev() {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await getJson<Me>("/api/me"));
      setError(null);
    } catch (e) {
      setMe(null);
      if (!(e instanceof ApiError && e.status === 401)) setError(msg(e));
    } finally {
      setChecked(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22 }}>Lesson runtime (dev)</h1>
      {error && <p role="alert" style={{ color: "#b00020" }}>{error}</p>}
      {!checked ? <p>Checking session…</p> : me ? <LessonPanel me={me} onSignedOut={refresh} /> : <AuthPanel onDone={refresh} />}
    </main>
  );
}

function AuthPanel({ onDone }: { onDone: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onDone();
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  };

  const login = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await postJson("/api/auth/login", { email, password });
    });
  };

  // Signup + one child + consent: the minimum the lesson routes require.
  const createFamily = () =>
    run(async () => {
      const cred = { email: `dev+${Date.now().toString(36)}@taxila.test`, password: crypto.randomUUID() };
      await postJson("/api/auth/signup", { ...cred, name: "Test Parent", isGuardianAdult: true });
      const { child } = await postJson<{ child: Child }>("/api/children", {
        firstName: "Aarav",
        classLevel: 4,
        languagePref: "hinglish",
        interests: ["cricket", "trains"],
      });
      await postJson("/api/consent", {
        childId: child.id,
        grants: { core_tutoring: true, learning_profile: true, memory: true, transcripts_retention: true },
      });
      setCreated(cred);
    });

  return (
    <section style={box}>
      <form onSubmit={login} style={row}>
        <input aria-label="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input aria-label="password" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy}>Sign in</button>
      </form>
      <p style={row}>
        <button type="button" data-testid="create-family" disabled={busy} onClick={createFamily}>
          Create test family
        </button>
        <span>signs up a guardian, adds a class-4 child, grants consent</span>
      </p>
      {created && (
        <p>
          Created {created.email} / {created.password}
        </p>
      )}
      {error && <p role="alert" style={{ color: "#b00020" }}>{error}</p>}
    </section>
  );
}

function LessonPanel({ me, onSignedOut }: { me: Me; onSignedOut: () => Promise<void> }) {
  const { runtime, state } = useLesson();
  const [childId, setChildId] = useState(me.children[0]?.id ?? "");
  const [mode, setMode] = useState<LessonMode>("voice");
  const [topicId, setTopicId] = useState("");
  const [text, setText] = useState("");
  const [events, setEvents] = useState<ModuleEvent[]>([]);
  const devSeq = useRef(0);

  const child = me.children.find((c) => c.id === childId);
  const ageBand = child && child.class_level <= 4 ? "6-9" : "10-15";
  const live = state.phase === "live";
  const busy = state.phase === "starting" || state.phase === "ending";

  const onModuleEvent = useCallback(
    (ev: ModuleEvent) => {
      runtime.moduleEvent(ev);
      setEvents((es) => [...es.slice(-24), ev]);
    },
    [runtime],
  );

  const start = () => void runtime.start(childId, mode, topicId.trim() || undefined).catch(() => {});
  const send = (e: FormEvent) => {
    e.preventDefault();
    runtime.say(text);
    setText("");
  };
  const devMount = (engine: string, params: Record<string, unknown>, goal?: string) => {
    const cmd: ModuleCommand = { op: "mount", moduleId: `dev-${++devSeq.current}`, engine, params, ...(goal && { goal }) };
    runtime.modules.push([cmd]);
  };
  const lastModule = () => runtime.modules.mounted().at(-1);
  const devCommand = (make: (moduleId: string) => ModuleCommand) => {
    const id = lastModule();
    if (id) runtime.modules.push([make(id)]);
  };
  const signOut = async () => {
    await runtime.end();
    await postJson("/api/auth/logout", {});
    await onSignedOut();
  };

  return (
    <>
      <section style={box}>
        <div style={row}>
          <span>{me.guardian.email}</span>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <div style={row}>
          <label>
            child{" "}
            <select value={childId} onChange={(e) => setChildId(e.target.value)} disabled={live || busy}>
              {me.children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} (class {c.class_level}, {c.language_pref})
                </option>
              ))}
            </select>
          </label>
          <label>
            <input type="radio" name="mode" data-testid="mode-voice" checked={mode === "voice"} disabled={live || busy} onChange={() => setMode("voice")} /> voice
          </label>
          <label>
            <input type="radio" name="mode" data-testid="mode-text" checked={mode === "text"} disabled={live || busy} onChange={() => setMode("text")} /> text
          </label>
          <input aria-label="topic id (optional)" placeholder="topic id (optional)" value={topicId} disabled={live || busy} onChange={(e) => setTopicId(e.target.value)} />
        </div>
        <div style={row}>
          <button type="button" data-testid="start" disabled={!childId || live || busy} onClick={start}>
            Start lesson
          </button>
          <button type="button" data-testid="end" disabled={!live} onClick={() => void runtime.end()}>
            End lesson
          </button>
          <span data-testid="phase">phase: {state.phase}</span>
          <span>connection: {state.connection}</span>
          <span data-testid="pending" data-pending={state.pendingTurns}>director calls: {state.pendingTurns}</span>
        </div>
        {!me.children.length && <p>This account has no child yet.</p>}
        {state.error && (
          <p role="alert" data-testid="error" style={{ color: "#b00020" }}>
            {state.error}
          </p>
        )}
      </section>

      <section style={box}>
        <div style={row}>
          <strong data-testid="status" data-status={state.status} style={{ padding: "4px 12px", borderRadius: 999, background: state.status === "your_turn" ? "#b4551f" : "#555", color: "#fff" }}>
            {STATUS_WORD[state.status]}
          </strong>
          <Meter label="mic" meter={runtime.levels.mic} />
          <Meter label="teacher" meter={runtime.levels.teacher} />
          {state.topic && <span>topic: {state.topic.title}</span>}
          {state.teacher && <span>teacher: {state.teacher.name} ({state.teacher.voice})</span>}
        </div>
        {state.mode === "voice" && live && (
          <div style={row}>
            <label>
              <input type="checkbox" checked={state.pushToTalk} onChange={(e) => runtime.setPushToTalk(e.target.checked)} /> push to talk
            </label>
            {state.pushToTalk && (
              <button
                type="button"
                style={{ minHeight: 48, minWidth: 140 }}
                onPointerDown={() => runtime.talkStart()}
                onPointerUp={() => runtime.talkEnd()}
                onPointerCancel={() => runtime.talkEnd()}
                onPointerLeave={() => runtime.talkEnd()}
              >
                Hold to talk
              </button>
            )}
            <button type="button" onClick={() => runtime.interrupt()}>
              Stop teacher
            </button>
          </div>
        )}
        {state.ui.whiteboard && (
          <p data-testid="whiteboard" style={{ fontSize: 28, margin: "8px 0" }}>
            {state.ui.whiteboard.kind === "image" ? <img src={state.ui.whiteboard.value} alt="" style={{ maxWidth: "100%" }} /> : state.ui.whiteboard.value}
          </p>
        )}
        <ol data-testid="captions" style={{ maxHeight: 280, overflowY: "auto", paddingLeft: 20 }}>
          {state.captions.map((c) => (
            <li key={c.id} data-testid="caption" data-who={c.who} data-final={c.final ? "1" : "0"} style={{ opacity: c.final ? 1 : 0.6 }}>
              <strong>{c.who === "teacher" ? state.teacher?.name ?? "Teacher" : child?.first_name ?? "Child"}:</strong> {c.text}
              {c.interrupted && <em> (cut off)</em>}
            </li>
          ))}
        </ol>
        {!!state.ui.chips?.length && (
          <div style={row} data-testid="chips">
            {state.ui.chips.map((c) => (
              <button key={c.id} type="button" style={{ minHeight: 48 }} onClick={() => runtime.tapChip(c)}>
                {c.label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={send} style={row}>
          <input data-testid="child-input" aria-label="type as the child" placeholder="type as the child" value={text} disabled={!live} onChange={(e) => setText(e.target.value)} style={{ flex: 1, minWidth: 180, minHeight: 40 }} />
          <button data-testid="send" disabled={!live || !text.trim()}>
            Send
          </button>
        </form>
      </section>

      <section style={box}>
        <div style={row}>
          <strong>Modules</strong>
          <button type="button" data-testid="dev-mount" onClick={() => devMount("fraction-bars@1", { denominators: [4], target: "3/4" }, "shade 3/4")}>
            Mount fraction-bars (shade 3/4)
          </button>
          <button type="button" onClick={() => devMount("fraction-bars@1", { denominators: [4, 3], numerators: [3, 2], mode: "compare" }, "compare 3/4 and 2/3")}>
            Mount compare 3/4 vs 2/3
          </button>
          <button type="button" data-testid="dev-mount-unknown" onClick={() => devMount("number-line@1", { min: 0, max: 10 })}>
            Mount unknown engine
          </button>
          <button type="button" onClick={() => devCommand((moduleId) => ({ op: "highlight", moduleId, target: "bar:0" }))}>
            Highlight bar 0
          </button>
          <button type="button" onClick={() => devCommand((moduleId) => ({ op: "reveal", moduleId }))}>
            Reveal
          </button>
          <button type="button" onClick={() => devCommand((moduleId) => ({ op: "unmount", moduleId }))}>
            Unmount last
          </button>
        </div>
        <ModuleHost source={runtime.modules} onEvent={onModuleEvent} lang={child?.language_pref ?? "hinglish"} ageBand={ageBand} />
        <ol data-testid="module-events" style={{ fontFamily: "monospace", fontSize: 12, paddingLeft: 20, overflowWrap: "anywhere" }}>
          {events.map((ev, i) => (
            <li key={i} data-type={ev.type}>
              {ev.moduleId} {ev.type} {ev.name ?? ""} {ev.data ? JSON.stringify(ev.data) : ""}
            </li>
          ))}
        </ol>
      </section>

      {(state.move || state.debug) && (
        <section style={box}>
          {state.move && (
            <p data-testid="move">
              move: <strong>{state.move.kind}</strong> {state.move.shape}
            </p>
          )}
          {state.debug && (
            <details>
              <summary>director debug</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(state.debug, null, 2)}</pre>
            </details>
          )}
        </section>
      )}
    </>
  );
}

function Meter({ label, meter }: { label: string; meter: LevelMeter }) {
  const v = useLevel(meter);
  return (
    <span style={row} aria-label={`${label} level`}>
      {label}
      <span style={{ display: "inline-block", width: 80, height: 10, background: "#ddd", borderRadius: 5, overflow: "hidden" }}>
        <span style={{ display: "block", width: `${Math.round(v * 100)}%`, height: "100%", background: "#1f6f5c" }} />
      </span>
    </span>
  );
}
