import { useEffect, useState } from "react";
import { getChildMap, type ChildMapResponse } from "./api.ts";

/** The child's map (Garden / Sky): the ledger states per chapter. A failed read is an empty map, never an error. */
export function useChildMap(cid: string, mode: "garden" | "sky", enabled = true): { map: ChildMapResponse | null; loading: boolean } {
  const [map, setMap] = useState<ChildMapResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    getChildMap(cid, mode, ac.signal)
      .then((m) => !ac.signal.aborted && setMap(m))
      .catch(() => {})
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [cid, mode, enabled]);
  return { map, loading };
}
