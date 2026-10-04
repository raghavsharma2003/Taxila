// /start/*: the parent's first run (PRODUCT-DESIGN-V2 §3.2, §6.2), lazily loaded as one chunk.
// Order: 1 class and board → 2 meet the actual teacher + her language → 3 our promises + hold → 4 account →
// 5 consent → 6 about the child → 7 parent PIN + daily limit → 8 sound and mic check → 9 hand over.
// /start/forgot and /start/reset: "Forgot password?" by email (W2-A; not steps of the run).
// Add a child (?add=1, behind the parent gate once a PIN exists): class → meet → about → limit → hand over.
// Old paths redirect: /start/lang → /start/class (the landing and Who still link there), /start/trust → promises.
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { NotFound } from "../app/Shell.tsx";
import { AccountStep } from "./Account.tsx";
import { ConsentStep, PromisesStep } from "./Consent.tsx";
import { ChildStep } from "./ChildProfile.tsx";
import { GateIfPin } from "../parent/Gate.tsx";
import { ControlsStep, HandoverStep, StudentStep, SummaryStep, VerifyStep } from "./Setup.tsx";
import { ClassStep } from "./steps/Class.tsx";
import { MeetStep } from "./steps/Meet.tsx";
import { CheckStep } from "./Check.tsx";
import { ForgotStep, ResetStep } from "./Forgot.tsx";
import "../styles/onboarding.css";
import "./onboarding-v2.css";

/** Keep the query (?add=1, ?next=) across a renamed path. */
function Moved({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

export default function Onboarding() {
  return (
    <Routes>
      <Route index element={<Navigate to="class" replace />} />
      <Route path="class" element={<ClassStep />} />
      <Route path="lang" element={<Moved to="/start/class" />} />
      <Route path="meet" element={<MeetStep />} />
      <Route path="taste" element={<Moved to="/start/meet" />} />
      <Route path="promises" element={<PromisesStep />} />
      <Route path="trust" element={<Moved to="/start/promises" />} />
      <Route path="phone" element={<AccountStep />} />
      <Route path="verify" element={<VerifyStep />} />
      {/* Consent-grade steps: behind the parent gate once a PIN exists (add a child, change consent). */}
      <Route element={<GateIfPin />}>
        <Route path="consent" element={<ConsentStep />} />
        <Route path="child" element={<ChildStep />} />
        <Route path="controls" element={<ControlsStep />} />
      </Route>
      <Route path="check" element={<CheckStep />} />
      <Route path="forgot" element={<ForgotStep />} />
      <Route path="reset" element={<ResetStep />} />
      <Route path="handover" element={<HandoverStep />} />
      <Route path="student" element={<StudentStep />} />
      <Route path="summary" element={<SummaryStep />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
