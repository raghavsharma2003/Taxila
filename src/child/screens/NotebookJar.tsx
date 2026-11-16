// The Notebook's "Questions" page (r7 app-notebook-log; STUDENT-FLOW §7, the Question jar): what she parked to come back
// to. Learning's GET /api/child/jar (claude/r7-learning 28778c11d): waiting items oldest first ("she'll bring this back"),
// then answered ones (struck through, with the day). No counts, no delete. null: the route is not there (the tab hides).
import { dayOf } from "../growth.ts";
import { tr7 } from "../../copy/en.ts";
import { Glyph, Panel, StatePanel } from "../../ui-v3/kaksha/kit.tsx";

export interface JarItem { id: string; topic: string; subject: string | null; share: boolean; at: string; state: "waiting" | "answered"; answeredAt: string | null }

export async function readJar(cid: string, signal?: AbortSignal): Promise<JarItem[] | null> {
  try {
    const r = await fetch(`/api/child/jar?childId=${encodeURIComponent(cid)}`, { credentials: "same-origin", signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: JarItem[] };
    return Array.isArray(j.items) ? j.items : null;
  } catch {
    return null;
  }
}

const day = (at: string) => dayOf(at);

export function JarPage({ items, name }: { items: JarItem[]; name: string }) {
  if (!items.length) return <StatePanel glyph="ask" line={tr7("jar.empty", { T: name })} testid="jar-empty" />;
  const waiting = items.filter((i) => i.state === "waiting");
  const answered = items.filter((i) => i.state === "answered");
  return (
    <>
      {waiting.length > 0 && (
        <Panel eyebrow={tr7("jar.waiting", { T: name })} testid="jar-waiting">
          <ul className="kx-jarlist">
            {waiting.map((i) => (
              <li key={i.id} className="kx-jaritem" data-state="waiting"><Glyph name="ask" size={20} /><span data-speech="">{i.topic}</span></li>
            ))}
          </ul>
        </Panel>
      )}
      {answered.length > 0 && (
        <Panel eyebrow={tr7("jar.answered")} testid="jar-answered">
          <ul className="kx-jarlist">
            {answered.map((i) => (
              <li key={i.id} className="kx-jaritem" data-state="answered">
                <Glyph name="tick" size={20} />
                <span><s data-speech="">{i.topic}</s> <span className="kx-tagline">{i.answeredAt ? tr7("jar.answeredOn", { date: day(i.answeredAt) }) : ""}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
