// round 7 A5 (PIPELINE §A Brain item 10, joint with Voice; main's decision 2026-11-04): the streamed Director reply on
// POST /api/lesson/turn. A client opts in with `Accept: text/event-stream`; without it the response is plain JSON, unchanged.
//
//   event: clause   data: ReplyClauseEvent (shared/contracts.ts)   one per guarded clause, `final` on the reply's last
//   event: turn     data: TurnResponse                             always the last event; then the stream ends
//
// The first clause can arrive while the rest is still being written (brain/say.js streamAsk: the locked first sentence);
// the others are the guarded final reply's sentences after it. A clause is never withdrawn. The one exception is a turn
// that failed closed to safeguarding after s1 went out: the clauses then close with an empty final clause and the turn
// event carries `clausesKept: false`; the client speaks that turn's teacherReply in full.
// Nothing is written until the first clause or the end: a refusal before then (401, 404, 409 …) is the plain JSON error
// with its status, so a retry is the plain request. An error after a clause is `event: turn` with { error, status }.
import { send, HttpError } from "../http.js";
import { splitSentences } from "../voice/sentences.js";

export const wantsClauses = (req) => /\btext\/event-stream\b/i.test(String(req?.headers?.accept ?? ""));
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** One SSE writer over a node response (headers no-store, no proxy buffering, a flush per event). */
export function clauseStream(res) {
  const sent = [];
  let open = false;
  const start = () => {
    if (open) return;
    open = true;
    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no", connection: "keep-alive" });
    res.flushHeaders?.();
  };
  const write = (event, data) => {
    start();
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    res.flush?.();
  };
  return {
    get open() { return open; },
    sent,
    /** an early clause from the turn (brain/turn.js clauseHook) */
    clause(ev) {
      if (!ev?.text) return;
      sent.push(ev);
      write("clause", ev);
    },
    /** the turn's response: the clauses not yet sent, then the turn */
    finish(out) {
      const reply = norm(out?.teacherReply);
      let tail = [];
      let kept = true;
      if (reply) {
        const said = sent.map((c) => norm(c.text)).join(" ");
        if (said && !(reply === said || reply.startsWith(`${said} `))) kept = false;
        else tail = splitSentences(said ? reply.slice(said.length) : reply);
      }
      const seq = out?.teacherReplySeq ?? sent[0]?.seq ?? null;
      const lessonId = out?.lessonId ?? sent[0]?.lessonId ?? null;
      if (reply || sent.length) {
        const rows = tail.length ? tail : [""];
        rows.forEach((text, k) => write("clause", { lessonId, seq, i: sent.length + k, text, final: k === rows.length - 1 }));
      }
      write("turn", kept ? out : { ...out, clausesKept: false });
      res.end();
    },
    /** an error once the stream is open; before that the caller lets the router answer as JSON */
    fail(e) {
      const http = e instanceof HttpError;
      write("turn", { error: http ? e.message : "internal error", status: http ? e.status : 500, ...(http ? e.extra || {} : {}) });
      res.end();
    },
  };
}

/** The turn adapter's body: plain JSON, or the clause stream when the client asked for it. */
export async function runTurn(req, res, run, hooks) {
  if (!wantsClauses(req)) return send(res, 200, await run(hooks));
  const sse = clauseStream(res);
  hooks.onClause = (ev) => sse.clause(ev);
  let out;
  try { out = await run(hooks); }
  catch (e) {
    if (!sse.open) throw e;
    sse.fail(e);
    if (e instanceof HttpError) return;
    throw e; // the router logs it (headers are sent: it only ends the response)
  }
  sse.finish(out);
}
