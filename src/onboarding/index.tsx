// /start/* (P0-P8, §2.2), lazily loaded as one chunk and routed as descendant routes.
import { Navigate, Route, Routes } from "react-router-dom";
import { NotFound } from "../app/Shell.tsx";
import { AccountStep } from "./Account.tsx";
import { ConsentStep, TrustStep } from "./Consent.tsx";
import { ChildStep } from "./ChildProfile.tsx";
import { LangStep, MeetStep, TasteStep } from "./Intro.tsx";
import { ControlsStep, HandoverStep, StudentStep, SummaryStep, VerifyStep } from "./Setup.tsx";
import "../styles/onboarding.css";

export default function Onboarding() {
  return (
    <Routes>
      <Route index element={<Navigate to="lang" replace />} />
      <Route path="lang" element={<LangStep />} />
      <Route path="meet" element={<MeetStep />} />
      <Route path="taste" element={<TasteStep />} />
      <Route path="phone" element={<AccountStep />} />
      <Route path="trust" element={<TrustStep />} />
      <Route path="verify" element={<VerifyStep />} />
      <Route path="consent" element={<ConsentStep />} />
      <Route path="child" element={<ChildStep />} />
      <Route path="controls" element={<ControlsStep />} />
      <Route path="handover" element={<HandoverStep />} />
      <Route path="student" element={<StudentStep />} />
      <Route path="summary" element={<SummaryStep />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
