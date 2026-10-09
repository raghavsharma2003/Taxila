// A server-backed play session around PlayStage: posts every act (the server replays ALL acts and grades them), shows her
// micro-line at a play turn-point, offers the server's two doors after a level, and reports level ends upward (the lesson
// forwards the seam and the server's evidence rows; GRAMMAR.md §6). The local controller never waits on the network.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ArtId, Lang, PlayActEnvelope, PlayActResponse, PlayLevel, PlayWorldFamily } from "../../shared/play.ts";
import { PlayStage, type PlayDoor, type PlayEvent } from "./PlayStage.tsx";
import { playApi } from "./client.ts";

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
}

export function PlaySession(p: PlaySessionProps) {
  const [sid, setSid] = useState(p.sessionId);
  const [level, setLevel] = useState(p.level);
  const [art, setArt] = useState<ArtId>(p.art);
  const [caption, setCaption] = useState<string | null>(null);
  const [doors, setDoors] = useState<PlayDoor[] | null>(null);
  const acts = useRef<PlayActEnvelope[]>([]);
  const sidRef = useRef(sid); sidRef.current = sid;
  const chain = useRef(Promise.resolve());

  useEffect(() => { acts.current = []; setDoors(null); setCaption(null); }, [level]);

  const post = useCallback((extra: { final?: boolean; impasse?: boolean } = {}) => {
    const lv = level, snapshot = [...acts.current];
    chain.current = chain.current.then(async () => {
      const r = await playApi.act({ sessionId: sidRef.current, levelId: lv.levelId, acts: snapshot, ...extra });
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
    else if (e.type === "impasse") post({ impasse: true });
    else if (e.type === "fail") p.onFail?.(e.why ?? "fail");
  }, [post, p]);

  const onDoor = useCallback(async (d: PlayDoor) => {
    const r = await playApi.next({ sessionId: sidRef.current, door: d.door });
    if (!r) { p.onFail?.("next"); return; }
    setSid(r.sessionId); setArt(r.art.art); setLevel(r.level);
  }, [p]);

  return <PlayStage level={level} art={art} lang={p.lang} classLevel={p.classLevel} caption={caption} face={p.face} teacherName={p.teacherName}
    doors={doors} onDoor={onDoor} world={p.world ?? null} onEvent={onEvent} reducedMotion={p.reducedMotion} heard={p.heard} embedded={p.embedded} />;
}
