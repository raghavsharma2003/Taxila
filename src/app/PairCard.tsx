// "Put Taxila on {name}'s device" (r7 app-child-device-pairing): the parent corner's card, one per child on Children.
// It makes a one-time code (6 characters, 10 minutes, one use; a new code replaces the old one), shows it large and as a
// QR to this site's /pair, and lists the devices already paired with an Unpair each (the session ends at once,
// server-side). Owned by App and mounted in the parent corner by one line (src/parent/Pages.tsx Children).
import { useEffect, useState } from "react";
import { Button } from "../ui/index.ts";
import { pairApi, pairLink, secondsLeft, showPairCode, type PairedDevice } from "./pair.ts";

function Qr({ text, size = 168 }: { text: string; size?: number }) {
  const [path, setPath] = useState<{ d: string; n: number } | null>(null);
  useEffect(() => {
    let live = true;
    void import("qrcode-generator").then((m) => {
      const qrcode = (m as unknown as { default?: typeof m }).default ?? m;
      const q = (qrcode as unknown as (t: number, l: string) => { addData: (s: string) => void; make: () => void; getModuleCount: () => number; isDark: (r: number, c: number) => boolean })(0, "M");
      q.addData(text);
      q.make();
      const n = q.getModuleCount();
      let d = "";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
      if (live) setPath({ d, n });
    }, () => {});
    return () => { live = false; };
  }, [text]);
  if (!path) return <div className="pair-qr pair-qr--wait" style={{ width: size, height: size }} aria-hidden="true" />;
  return (
    <svg className="pair-qr" viewBox={`0 0 ${path.n + 4} ${path.n + 4}`} width={size} height={size} role="img" aria-label="QR code that opens this page on the other device" shapeRendering="crispEdges">
      {/* (fixed black on white, not theme tokens: a camera needs the contrast and the quiet zone to read it) */}
      <rect width={path.n + 4} height={path.n + 4} fill="white" />
      <path d={path.d} fill="black" />
    </svg>
  );
}

function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return now;
}

const when = (iso?: string | null) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
};

export function PairCard({ childId, name }: { childId: string; name: string }) {
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [devices, setDevices] = useState<PairedDevice[] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const now = useNow(!!code);
  const left = code ? secondsLeft(code.expiresAt, now) : 0;

  const loadDevices = () => pairApi.devices(childId).then((r) => setDevices(r.devices ?? []), () => setDevices(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadDevices(); }, [childId]);
  // a code that was used: the list shows the new device (checked while a code is up)
  useEffect(() => {
    if (!code || left % 10 !== 0) return;
    void loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, left]);

  const make = async () => {
    setBusy(true);
    setErr(null);
    try { setCode(await pairApi.code(childId)); } catch { setErr("The code could not be made. Check the internet and try again."); } finally { setBusy(false); }
  };
  const unpair = async (id: string) => {
    try {
      await pairApi.unpair(id);
      setDevices((ds) => (ds ?? []).filter((d) => d.id !== id));
      setConfirm(null);
    } catch { setErr("That device could not be removed. Try again."); }
  };
  const host = typeof window !== "undefined" ? window.location.host : "taxila.dev";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://taxila.dev";

  return (
    <div className="pair-card" data-testid={`pair-card-${childId}`}>
      {!code ? (
        <Button small variant="secondary" onClick={() => void make()} disabled={busy} data-testid="pair-start">{busy ? "Please wait" : `Put Taxila on ${name}'s device`}</Button>
      ) : (
        <div className="pair-code-box" data-testid="pair-code-box">
          <p className="pa-effect">{`On ${name}'s phone or tablet, open ${host}/pair and type this code, or scan the QR with its camera.`}</p>
          <div className="pair-code-row">
            {left > 0 ? <p className="pair-code" data-testid="pair-code" aria-label={`Code ${code.code.split("").join(" ")}`}>{showPairCode(code.code)}</p>
              : <p className="pair-code pair-code--gone" data-testid="pair-expired">Expired</p>}
            {left > 0 && <Qr text={pairLink(origin, code.code)} />}
          </div>
          <p className="pa-meta" role="status">{left > 0 ? `Works once, for ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} more` : "This code has expired."}</p>
          <div className="pa-actions">
            <Button small variant="secondary" onClick={() => void make()} disabled={busy} data-testid="pair-new">New code</Button>
            <Button small variant="quiet" onClick={() => setCode(null)}>Done</Button>
          </div>
        </div>
      )}
      {err && <p className="pa-form-err" role="alert">{err}</p>}
      {devices && devices.length > 0 && (
        <ul className="pair-devices" aria-label={`${name}'s devices`} data-testid="pair-devices">
          {devices.map((d) => (
            <li key={d.id} className="pair-device">
              <span>{d.label || "A device"}<span className="pa-meta">{` · added ${when(d.createdAt)}${d.lastSeenAt ? ` · last used ${when(d.lastSeenAt)}` : ""}`}</span></span>
              {confirm === d.id ? (
                <span className="pa-actions">
                  <Button small variant="secondary" onClick={() => void unpair(d.id)} data-testid="pair-unpair-yes">Remove it</Button>
                  <Button small variant="quiet" onClick={() => setConfirm(null)}>Keep</Button>
                </span>
              ) : <Button small variant="quiet" onClick={() => setConfirm(d.id)} data-testid="pair-unpair">Unpair</Button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
