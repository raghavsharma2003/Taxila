// to-brain 053, builder A's parts (docs/patches/to-brain/053-director34-second-picture-several-wrong-answers-walk-paths.md): the predicates
// they add, each pinned on its director34 rows (tests/r8-d35-053a.test.mjs, replayed with that run's own script snapshot) before it reads the
// dry matrix.
//   noPictureBare       A3: the no-picture line, then only an invitation or the question, while a wording of A3's list is unsaid
//   noPictureAfterView  A2: a view (or a picture) drawn on her turn before is gone on a turn that says the no-picture line
//   hintBoardNotDrawn   A1: the no-picture line said while the card's own hint, unsaid, owns a board (it is the second picture)
import { helpPart, ladderOf, ownHintOf, normSentence, sentencesOf, inSaid } from "../../server/director/help.js";
import { saidIn } from "../../server/director/script.js";
import { sameBoardRef } from "../../server/director/state.js";
import { drawnPagesOf } from "./drawn-pages.mjs";

const key = (t) => String(t ?? "").toLowerCase().replace(/\{\w+\}/g, " ").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
/** Whether a row says one of the script's joints.noPicture forms (or records the noPicture joint). */
export function saysNoPicture(r, script) {
  if (r?.who !== "teacher") return false;
  if ((r.seams ?? []).some((x) => x.joint === "noPicture" || x.right === "noPicture")) return true;
  const forms = (script?.joints?.noPicture ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(key).filter((k) => k.split(" ").length >= 3);
  const T = key(r.text);
  return forms.some((f) => T.includes(f));
}
/** The help part a row's cell names (an asked step's `:ask` and a quick question's part read as help.js reads them). */
const partOfRow = (r, script) => {
  const id = String(r?.cell?.part ?? "").replace(/:quick$/, ":checkin").replace(/(:worked:step\d+):ask$/, "$1");
  try { return id ? helpPart(script, id) : null; } catch { return null; }
};
/** The said set of every teacher row before row i, as help.js keeps it ({ k } entries). */
const saidBefore = (L, i) => {
  const out = [], have = new Set();
  for (const x of L.rows.slice(0, i)) if (x.who === "teacher") for (const s of sentencesOf(x.text)) { const k = normSentence(s); if (k && !have.has(k)) { have.add(k); out.push({ k }); } }
  return out;
};
const textOf = (v) => saidIn(v, "hinglish");
/** Whether any sentence of a wording is in a row's text. */
const inRow = (v, r) => { const T = normSentence(r.text); return sentencesOf(textOf(v)).some((s) => { const k = normSentence(s); return k && T.includes(k); }); };
/** Whether a wording was said before row i (any sentence of it, as help.js inSaid reads the ladder's rungs). */
const saidSoFar = (v, said) => sentencesOf(textOf(v)).some((s) => inSaid(s, said));

export const D35A_PREDICATES = {
  /** A3: a no-picture turn says the line and then only an invitation or the question while a wording of A3's list is unsaid — the hint in
   *  words, the point's other wording (the part's ladder) — director34: 8 of the 12 no-picture turns. Gated. */
  noPictureBare(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script)) return null;
    const part = partOfRow(r, ctx.script);
    if (!part) return null;
    const ladder = (() => { try { return ladderOf(ctx.script, part); } catch { return []; } })();
    if (!ladder.length || ladder.some((x) => inRow(x.value, r))) return null;
    const said = saidBefore(L, i);
    const left = ladder.find((x) => textOf(x.value) && !saidSoFar(x.value, said));
    return left ? `the no-picture line and nothing more, with ${left.path.split(".").slice(-2).join(".")} unsaid` : null;
  },
  /** A2: a view or picture drawn on her turn before stays up through a turn that says the no-picture line — the first page of the turn is
   *  the page up, with its view beside it (director34 c4-ch01-t02 steering 14 to 16: the tester view gone at the first word). Gated. */
  noPictureAfterView(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script) || !ctx?.prevT) return null;
    const pT = ctx.prevT;
    const drew = !!pT.held?.picture || ["view", "pictureBoard", "hintBoard"].includes(String(pT.cell?.picture ?? ""));
    if (!drew) return null;
    const pp = pT.held?.pages ?? [], rp = r.held?.pages ?? [];
    const lastBeside = pp.at(-1)?.beside ?? null;
    if (lastBeside && rp.length && rp[0].beside !== lastBeside) return `the view (${lastBeside}) drawn on her turn before is gone at the first word`;
    const up = drawnPagesOf(pT).at(-1)?.board ?? null, now = drawnPagesOf(r)[0]?.board ?? null;
    if (up && now && !sameBoardRef(up, now)) return `the picture drawn on her turn before (${up.template}) gave way to ${now.template}`;
    return null;
  },
  /** A1: the no-picture line is never said while the card's own hint (or an asked step's easier wording), unsaid, owns a board that does
   *  not show the answer — that board is the picture (director34 steering c4-ch01-t02 16, c5-ch02-t03 16; stuck c4-ch06-t01 18, c6 18). Gated. */
  hintBoardNotDrawn(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script)) return null;
    const part = partOfRow(r, ctx.script);
    if (!part) return null;
    const own = (() => { try { return ownHintOf(ctx.script, part, saidBefore(L, i), "hinglish"); } catch { return null; } })();
    return own?.board?.template && !own.settles ? `the no-picture line with the hint (${own.path.split(".").slice(-2).join(".")}) unsaid, its board ${own.board.template} undrawn` : null;
  },
};
