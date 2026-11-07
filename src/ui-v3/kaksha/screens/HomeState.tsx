// The Home's non-plan states as Kaksha screens (r7 app-secondary-screens-kaksha): the safety hold, offline and signed
// out. Pure props. The hold's copy is the integrated copy (tw2 home.hold.*), and its one action opens the lesson's own
// Help sheet (helplines printed, unchanged; the container passes it in). Never a lesson, practice or Ask on a hold.
import { useState, type ReactNode } from "react";
import { t } from "../../../child/copy.ts";
import { tw2 } from "../../../copy/en.ts";
import { Cta, Ghost, Glyph, StatePanel } from "../kit.tsx";

export interface HomeStateViewProps {
  kind: "hold" | "offline" | "signedout";
  packReady: boolean;
  practiceTo: string;
  signInTo: string;
  onRetry: () => void;
  go?: (to: string) => void;
  /** The Help sheet (hold only), rendered while open. */
  help: (close: () => void, grownUp: boolean, setGrownUp: (v: boolean) => void) => ReactNode;
}

export function HomeStateView(p: HomeStateViewProps) {
  const [open, setOpen] = useState(false);
  const [grownUp, setGrownUp] = useState(false);
  if (p.kind === "hold") {
    return (
      <>
        <StatePanel glyph="help" tone="her" title={tw2("home.hold.head")} line={tw2("home.hold.sub")} testid="primary-card" headId="kx-hold-h">
          <Cta onClick={() => setOpen(true)} testid="hold-help"><Glyph name="help" size={22} /> {tw2("home.hold.help")}</Cta>
        </StatePanel>
        {open && p.help(() => setOpen(false), grownUp, setGrownUp)}
      </>
    );
  }
  if (p.kind === "signedout") {
    return (
      <StatePanel glyph="door" title={t("grownupSignIn")} testid="primary-card" headId="kx-out-h">
        <Cta to={p.signInTo} go={p.go} testid="sign-in">{t("signIn")}</Cta>
      </StatePanel>
    );
  }
  return (
    <StatePanel glyph="offline" tone="rose" title={p.packReady ? t("offline") : t("offlineNoPack")} testid="primary-card" headId="kx-off-h">
      {p.packReady ? (
        <Cta to={p.practiceTo} go={p.go} testid="offline-practice">{t("practice")}</Cta>
      ) : (
        <Ghost onClick={p.onRetry} testid="try-again"><Glyph name="replay" size={20} /> {t("tryAgain")}</Ghost>
      )}
    </StatePanel>
  );
}
