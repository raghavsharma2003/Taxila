// A server-backed play session around PlayStage: posts every act (the server replays ALL acts and grades them), shows her
// micro-line at a play turn-point, offers the server's two doors after a level, and reports level ends upward (the lesson
// forwards the seam and the server's evidence rows; GRAMMAR.md §6). The local controller never waits on the network.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ArtId, Lang, PlayActEnvelope, PlayActResponse, PlayLevel, PlayWorldFamily } from "../../shared/play.ts";
import { PlayStage, type PlayDoor, type PlayEvent } from "./PlayStage.tsx";
import { playApi } from "./client.ts";
import type { DressedSpec } from "./engines/core3d/api.ts";
import { musicPref } from "./engines/core3d/host.ts";

export interface PlaySessionProps {
  sessionId: string;
  level: PlayLevel;
  art: ArtId;
  lang: Lang;
  classLevel: number;
  face?: ReactNode;
  teacherName?: string;
  world?: PlayWorldFamily | null;
  reducedMotion?: boolean;
  /** a level ended (the server's grade + seam + evidence), or the session failed */
  onLevelEnd?(r: PlayActResponse, level: PlayLevel): void;
  onActivity?(name: string, data?: Record<string, unknown>): void;
  onFail?(why: string): void;
  /** a server-signed token for the lesson (evidence at a level end, a seam's facts row): forwarded as-is, never read */
  onToken?(kind: "evidence" | "seam", token: string, seamKind?: string): void;
  /** a committed child utterance (the voice verb grammar maps commands to presses) */
  heard?: { id: number; text: string } | null;
  embedded?: boolean;
  /** the base dress the level response carried (a real-game engine renders this level) */
  dress?: DressedSpec | null;
  /** renderer override (the harness): "3d" lets a software GPU through */
  engine?: "auto" | "2d" | "3d";
  /** the certification harness reads canvas pixels: keep the WebGL drawing buffer (never set for a child) */
  preserveDrawing?: boolean;
}

export function PlaySession(p: PlaySessionProps) {
  const [sid, setSid] = useState(p.sessionId);
  const [level, setLevel] = useState(p.level);
  const [art, setArt] = useState<ArtId>(p.art);
  const [caption, setCaption] = useState<string | null>(null);
  const [doors, setDoors] = useState<PlayDoor[] | null>(null);
  const [dress, setDress] = useState<DressedSpec | null>(p.dress ?? null);
  // the model's story wrapper stays for the whole segment (continuity); the theme still rotates per level (base rules)
  const carry = useRef<DressedSpec["dress"]["wrapper"] | null>(null);
  useEffect(() => {
    if (!p.dress) return;
    const ac = new AbortController();
    playApi.dress({ sessionId: p.sessionId, music: musicPref() ?? undefined }, ac.signal).then((r) => {
      if (!r || r.source !== "model") return;
      if (r.dress.from.wrapper === "model") carry.current = r.dress.dress.wrapper;
      setDress(r.dress);
    });
    return () => ac.abort();
    // one model dress per segment (the mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const acts = useRef<PlayActEnvelope[]>([]);
  const engineOn = useRef<string | null>(null);
  const sidRef = useRef(sid); sidRef.current = sid;
  const chain = useRef(Promise.resolve());

  useEffect(() => { acts.current = []; setDoors(null); setCaption(null); }, [level]);

  const post = useCallback((extra: { final?: boolean; impasse?: boolean } = {}) => {
    const lv = level, snapshot = [...acts.current];
    chain.current = chain.current.then(async () => {
      const r = await playApi.act({ sessionId: sidRef.current, levelId: lv.levelId, acts: snapshot, engine: engineOn.current, ...extra });
      if (!r) return;
      if (r.sessionId) setSid(r.sessionId);
      if (r.reaction?.text) setCaption(r.reaction.text);
      // evidence first: the seam may be a milestone that calls the Director at once, and the level's evidence must ride
      // in that same call (the lesson's module-event buffer drains when the call is made)
      if (r.evidenceToken) p.onToken?.("evidence", r.evidenceToken);
      if (r.seamToken) p.onToken?.("seam", r.seamToken, r.seam?.kind);
      if (r.grade) { setDoors(r.doors ?? null); p.onLevelEnd?.(r, lv); }
    });
  }, [level, p]);

  const onEvent = useCallback((e: PlayEvent) => {
    if (e.type === "act" && e.env) { acts.current.push(e.env); p.onActivity?.("play_act", { kind: (e.env.act as { kind: string }).kind }); post(); }
    else if (e.type === "ready") engineOn.current = e.engine ?? null;
    else if (e.type === "fail3d") engineOn.current = null;
    else if (e.type === "impasse") post({ impasse: true });
    else if (e.type === "fail") p.onFail?.(e.why ?? "fail");
  }, [post, p]);

  const onDoor = useCallback(async (d: PlayDoor) => {
    const r = await playApi.next({ sessionId: sidRef.current, door: d.door });
    if (!r) { p.onFail?.("next"); return; }
    setSid(r.sessionId); setArt(r.art.art); setLevel(r.level);
    if (r.dress) setDress(carry.current ? { ...r.dress, dress: { ...r.dress.dress, wrapper: carry.current }, from: { ...r.dress.from, wrapper: "model" } } : r.dress);
  }, [p]);

  return <PlayStage level={level} art={art} lang={p.lang} classLevel={p.classLevel} caption={caption} face={p.face} teacherName={p.teacherName}
    doors={doors} onDoor={onDoor} world={p.world ?? null} onEvent={onEvent} reducedMotion={p.reducedMotion} heard={p.heard} embedded={p.embedded} dress={dress} engine={p.engine} verb={dress?.verb} preserveDrawing={p.preserveDrawing} />;
}
