import { useEffect, useState } from "react";
import { getChildMap, type ChildMap } from "./api.ts";

/** The child's ledger rows for the maps; an empty map (never an error) when no read endpoint answers. */
export function useChildMap(cid: string): { map: ChildMap | null; loading: boolean } {
  const [map, setMap] = useState<ChildMap | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    getChildMap(cid, ac.signal)
      .then((m) => setMap(m))
      .catch(() => !ac.signal.aborted && setMap({ skills: [], source: null }))
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [cid]);
  return { map, loading };
}
