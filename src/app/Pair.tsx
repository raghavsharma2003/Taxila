// /pair: the child's own phone or tablet joins their profile (r7 app-child-device-pairing). The grown-up makes a code in
// the parent corner (Children → "Put Taxila on {name}'s device"); here it is typed, or arrives in the QR's link
// (?code=). On success the device holds a child-only session and opens that child's app. The parent corner stays behind
// the grown-up's own sign-in on this device.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote } from "../ui/index.ts";
import { refreshMe } from "./api.ts";
import { StepFrame } from "../onboarding/Layout.tsx";
import { cleanPairCode, isPairCode, pairApi, PAIR_LEN, redeemErrorOf } from "./pair.ts";
import "../styles/onboarding.css";
import "../onboarding/onboarding-v2.css";

export default function Pair() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [code, setCode] = useState(() => cleanPairCode(sp.get("code") ?? ""));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => { field.current?.focus(); }, []);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isPairCode(code) || busy) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await pairApi.redeem(code);
      await refreshMe();
      nav(`/c/${encodeURIComponent(r.childId)}`, { replace: true });
    } catch (e2) {
      setErr(redeemErrorOf(e2, typeof navigator === "undefined" || navigator.onLine !== false));
      setBusy(false);
    }
  };
  // a code that arrived whole in the QR's link goes on by itself
  const auto = useRef(false);
  useEffect(() => { if (!auto.current && isPairCode(code) && sp.get("code")) { auto.current = true; void submit(); } });

  return (
    <StepFrame step={null} title="Put Taxila on this device" why="Your grown-up has a 6-character code in the parent corner. Type it here." docTitle="Put Taxila on this device">
      <form className="stack" onSubmit={submit} noValidate data-testid="pair-form">
        {sp.get("unpaired") && <p className="t-note" role="status" data-testid="pair-unpaired">This device was unpaired. Ask your grown-up for a new code to use it again.</p>}
        <div className="field">
          <label htmlFor="pair-code">The code</label>
          <input id="pair-code" ref={field} className="input code-input" autoComplete="off" autoCapitalize="characters" spellCheck={false}
            inputMode="text" value={code} aria-invalid={!!err || undefined} aria-describedby={err ? "pair-err" : undefined}
            onChange={(e) => { setCode(cleanPairCode(e.target.value)); setErr(null); }} data-testid="pair-code" />
        </div>
        <span id="pair-err"><ErrorNote>{err}</ErrorNote></span>
        <Button type="submit" block disabled={busy || code.length !== PAIR_LEN} data-testid="pair-go">{busy ? "Please wait" : "Open my Taxila"}</Button>
        <p className="t-note">This device then opens straight to your lessons. Your grown-up can remove it from the parent corner at any time.</p>
        <Link to="/" className="link-quiet">Back</Link>
      </form>
    </StepFrame>
  );
}
