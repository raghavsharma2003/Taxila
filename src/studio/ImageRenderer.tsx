// The StudioStage renderer for `image` artifacts (LIVE-STUDIO §3.15; the image lane itself is W3-G's S9). Images are art,
// never facts: contain-fit inside the box, lazy, no caption text drawn by the image. A failed load reports `error` and
// leaves the calm ground (never a broken-image icon or text).
import { useState } from "react";
import type { ArtifactRendererProps } from "./renderers.ts";

export function ImageRenderer({ artifact, px, onEvent }: ArtifactRendererProps<"image">) {
  const [ok, setOk] = useState(true);
  const safe = /^(?:data:image\/(?:png|webp|jpeg);base64,|\/api\/studio\/|https:\/\/[\w.-]+\.blob\.core\.windows\.net\/)/.test(artifact.src);
  if (!safe || !ok) return null;
  return (
    <img src={artifact.src} alt={artifact.alt} loading="lazy" decoding="async" width={px.w} height={px.h} style={{ objectFit: "contain", display: "block" }}
      onLoad={() => onEvent({ type: "ready" })} onError={() => { setOk(false); onEvent({ type: "error", message: "image failed" }); }} />
  );
}
