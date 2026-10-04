// The toast region. Renders only what ./toast.ts let through (the build-state predicate runs before anything renders).
// One polite live region; network / mic toasts persist until the fact changes; saved toasts leave on their own.
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { dismissToast, subscribeToasts, type ToastKind, type ToastMsg } from "./toast.ts";

const ICON: Record<ToastKind, IconName> = { saved: "check", network: "globe", mic: "mic-off", info: "bell" };

export function ToastRegion() {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => subscribeToasts(setList), []);
  useEffect(() => {
    const timers = list.filter((m) => m.ttlMs > 0).map((m) => setTimeout(() => dismissToast(m.id), m.ttlMs));
    return () => timers.forEach(clearTimeout);
  }, [list]);
  return (
    <div className="v3-toasts" role="status" aria-live="polite">
      {list.map((m) => (
        <div key={m.id} className={`v3-toast v3-toast--${m.kind}`}>
          <Icon name={ICON[m.kind]} size={18} />
          <span>{m.text}</span>
          {m.action && <button type="button" className="v3-textbtn" onClick={() => { m.action!.onAct(); dismissToast(m.id); }}>{m.action.label}</button>}
          {m.ttlMs === 0 && <button type="button" className="v3-toast-x" aria-label="Dismiss" onClick={() => dismissToast(m.id)}><Icon name="x" size={16} /></button>}
        </div>
      ))}
    </div>
  );
}
