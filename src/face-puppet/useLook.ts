// usePuppetLook(): the page's puppet look for a React surface that draws her without the live stage (the landing's
// portrait). null until known (a first visit waits for GET /api/face/config, ≤ 1.5 s); a known look never changes.
import { useEffect, useState } from "react";
import type { PuppetLook } from "./assets.ts";
import { faceLook, faceLookNow } from "./look.ts";

export function usePuppetLook(): PuppetLook | null {
  const [look, setLook] = useState<PuppetLook | null>(() => faceLookNow());
  useEffect(() => {
    if (look) return;
    let alive = true;
    faceLook().then((l) => alive && setLook(l));
    return () => {
      alive = false;
    };
  }, [look]);
  return look;
}
