// Onboarding state, persisted per field (§2.2 G-ONB-6: never clear typed input; restore after a reload or a
// killed tab). Device-local convenience only: the server rows (guardian, consent, child, controls) are truth.
import { useCallback, useState } from "react";
import type { Lang } from "../ui/index.ts";
import { readStore, writeStore } from "../app/storage.ts";

export interface Draft {
  lang?: Lang;
  name?: string; email?: string; phone?: string;              // never the password
  learningAcrossDays?: boolean | null; likes?: boolean; reportChannel?: "whatsapp" | "app";
  consentDone?: boolean;
  child?: {
    firstName?: string; classLevel?: number; board?: string; schoolMedium?: string; languagePref?: string;
    address?: "tum" | "aap"; interests?: string[]; comfort?: boolean; hardToHear?: boolean;
  };
  childId?: string;                                             // the profile created at P6
}
const KEY = "tx.onboarding";

export function useDraft() {
  const [d, setD] = useState<Draft>(() => readStore<Draft>(KEY, {}));
  const set = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setD((cur) => {
      const next = { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) };
      writeStore(KEY, next);
      return next;
    });
  }, []);
  return [d, set] as const;
}
export const clearDraftChild = () => {
  const d = readStore<Draft>(KEY, {});
  writeStore(KEY, { ...d, child: undefined, childId: undefined });
};
export const setLangPref = (l: Lang) => writeStore("tx.lang", l);
