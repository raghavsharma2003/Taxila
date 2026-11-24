// The name preview (PRODUCT-DESIGN-V2 §6.2 step 6; round 7 F): "Hear how {T} says it" plays her greeting with the child's
// name in her own voice (GET /api/child/name-audio, a fixed server line, never free text). "That's right" keeps it;
// "Spell it how it sounds" opens a field for the spelling she should say ("Aa-rav"), which is previewed the same way and
// saved as child.name_spoken (038). Voice reads that spelling on every lane.
import { useRef, useState } from "react";
import { Button, Field, Icon } from "../ui/index.ts";

export function NamePreview({ name, classLevel, teacherName, spoken, onSpoken }: {
  name: string; classLevel: number; teacherName: string; spoken: string | null; onSpoken: (v: string | null) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "played" | "error">("idle");
  const [editing, setEditing] = useState(!!spoken);
  const audio = useRef<HTMLAudioElement | null>(null);
  const play = async () => {
    if (!name.trim()) return;
    setState("loading");
    try {
      const qs = new URLSearchParams({ classLevel: String(classLevel), name: name.trim(), ...(spoken?.trim() ? { spoken: spoken.trim() } : {}) });
      const res = await fetch(`/api/child/name-audio?${qs}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      audio.current?.pause();
      audio.current = new Audio(url);
      audio.current.onended = () => URL.revokeObjectURL(url);
      await audio.current.play();
      setState("played");
    } catch { setState("error"); }
  };
  if (!name.trim()) return null;
  return (
    <div className="stack-sm" data-testid="name-preview">
      <div className="row">
        <Button variant="secondary" small onClick={() => void play()} disabled={state === "loading"} icon={<Icon name="speaker" />}>
          {state === "loading" ? "One moment" : `Hear how ${teacherName} says it`}
        </Button>
        {state === "played" && !editing && (
          <>
            <Button variant="quiet" small onClick={() => onSpoken(null)}>That's right</Button>
            <Button variant="quiet" small onClick={() => setEditing(true)}>Spell it how it sounds</Button>
          </>
        )}
      </div>
      {state === "error" && <p className="t-note" role="status">The voice could not play just now. You can carry on; she will say the name as it is written.</p>}
      {editing && (
        <Field label="How it sounds" hint={`For example "Aa-rav". ${teacherName} will say it this way. Leave it empty to use the name as written.`}
          autoComplete="off" maxLength={40} value={spoken ?? ""} onChange={(e) => onSpoken(e.target.value || null)} />
      )}
    </div>
  );
}
