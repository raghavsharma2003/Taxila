// What {T} remembers (STUDENT-FLOW §11.4; r7 app-me-settings), on the child's Your teacher screen. Its one control is
// Forget this on a memory item: nothing here picks, renames or changes her (dc-r4-single-teacher-asha).
import { useEffect, useState } from "react";
import { Ghost, Glyph, Panel } from "../../ui-v3/kaksha/kit.tsx";
import { forgetChildMemory, getChildMemory, type ChildMemory } from "../api.ts";
import { tr7 } from "../../copy/en.ts";

/** What {T} remembers (STUDENT-FLOW §11.4): each item in the child's own words with the day it came from and Forget this
 *  (a hard delete; she never mentions it again). Consent off: the plain line that the grown-up chose this. Absent while
 *  the route is not there or the read failed. */
export function Remembers({ cid, name }: { cid: string; name: string }) {
  const [mem, setMem] = useState<ChildMemory | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    void getChildMemory(cid, ac.signal).then((m) => { if (!ac.signal.aborted) setMem(m); });
    return () => ac.abort();
  }, [cid]);
  if (!mem) return null;
  const forget = async (id: string) => {
    if (await forgetChildMemory(cid, id)) {
      setMem((m) => (m ? { ...m, items: m.items.filter((x) => x.id !== id) } : m));
      setGone(tr7("mem.forgotten", { T: name }));
    }
  };
  const day = (at: string) => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "long" });
  return (
    <Panel eyebrow={tr7("mem.title", { T: name })} testid="remembers">
      {!mem.keeps ? (
        <p className="kx-sub" data-testid="remembers-off">{tr7("mem.off", { T: name })}</p>
      ) : mem.items.length === 0 ? (
        <p className="kx-sub">{tr7("mem.none", { T: name })}</p>
      ) : (
        <ul className="kx-mem">
          {mem.items.map((it) => (
            <li key={it.id} className="kx-mem-item" data-testid="remembers-item">
              <p className="kx-mem-text" data-speech="">{it.text}</p>
              <p className="kx-tagline">{tr7("mem.from", { date: day(it.at) })}</p>
              <Ghost onClick={() => void forget(it.id)} testid="remembers-forget"><Glyph name="forget" size={20} /> {tr7("mem.forget")}</Ghost>
            </li>
          ))}
        </ul>
      )}
      {gone && <p className="kx-sub" role="status">{gone}</p>}
    </Panel>
  );
}
