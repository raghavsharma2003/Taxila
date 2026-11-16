// A kit passage as reading matter in the Studio tray (docs/design/round7/learning/PASSAGE.md; main's yes, 2026-11-10): the
// kit's own text, exactly, one page at a time — real wrapped text, never a whiteboard (the board's 24-character rule stays).
// 16 px or more (18 px Young), line height 1.6 so Devanagari matras are never clipped, no sideways scroll (text wraps; a page
// taller than a short tray scrolls down inside the box), prev / next buttons of 44 px or more. The page shown is the page
// the server says she is reading from (artifact.passage.page); the child may page on her own, and a new page from the server
// takes over again. Reports nothing to the host but "ready" (a passage is read, never graded).
import { useEffect, useState } from "react";
import type { ArtifactRendererProps } from "./renderers.ts";

const BTN = 44;

export function PassageRenderer({ artifact, px, young, onEvent }: ArtifactRendererProps<"passage">) {
  const ps = artifact.passage;
  const pages = ps.pages ?? [];
  const last = Math.max(1, pages.length);
  const clamp = (n: number) => Math.min(last, Math.max(1, Math.floor(Number(n) || 1)));
  const [page, setPage] = useState(clamp(ps.page));
  useEffect(() => { setPage(clamp(ps.page)); }, [ps.id, ps.page]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onEvent({ type: "ready" }); }, [ps.id]);           // eslint-disable-line react-hooks/exhaustive-deps
  const cur = pages.find((p) => p.n === page) ?? pages[0];
  const fs = young ? 18 : 16;
  const poem = pages.some((p) => p.text.includes("\n"));
  const btn = (label: string, to: number, disabled: boolean, testId: string) => (
    <button type="button" data-testid={testId} aria-label={label} disabled={disabled} onClick={() => setPage(clamp(to))}
      style={{ minWidth: BTN, minHeight: BTN, fontSize: fs, borderRadius: 10, border: "1px solid var(--ink-2, #8a8f98)", background: "transparent",
        color: "inherit", opacity: disabled ? 0.35 : 1, cursor: disabled ? "default" : "pointer", padding: "0 12px" }}>{label === "previous page" ? "‹" : "›"}</button>
  );
  return (
    <div data-testid="passage" data-page={page} data-pages={last} lang={ps.lang ?? undefined}
      style={{ width: px.w, height: px.h, display: "flex", flexDirection: "column", boxSizing: "border-box", padding: 12, overflow: "hidden", color: "var(--ink, #1d1d1f)" }}>
      {ps.title ? <div data-testid="passage-title" style={{ fontSize: fs, fontWeight: 600, lineHeight: 1.6, marginBottom: 4, overflowWrap: "anywhere" }}>{ps.title}</div> : null}
      <div data-testid="passage-text" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", fontSize: fs, lineHeight: 1.6,
        whiteSpace: poem ? "pre-wrap" : "normal", overflowWrap: "anywhere", wordBreak: "normal" }}>{cur?.text ?? ""}</div>
      {last > 1 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8 }}>
          {btn("previous page", page - 1, page <= 1, "passage-prev")}
          <span data-testid="passage-count" style={{ fontSize: fs }}>{page} / {last}</span>
          {btn("next page", page + 1, page >= last, "passage-next")}
        </div>
      ) : null}
    </div>
  );
}
