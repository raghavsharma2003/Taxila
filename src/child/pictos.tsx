// Code-drawn glyphs for the child screens (PRODUCT-DESIGN-V2 §7.3):
//  - Young pictograms: the designed FALLBACK for the painted `picto/*` art until it lands (same silhouette, token
//    colours, never text). <Picto id="picto/garden" size={64} /> renders the painted art when it exists.
//  - Older icons: the tab bar / rail and row icons are SVG (Material Symbols Rounded shapes, §7.3: never raster).
// Colour comes from currentColor and the art tint tokens only (PD-G13: no raw hex outside tokens.css).
import type { ReactNode } from "react";
import { Spot } from "./art.tsx";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Older icons (and the Young fallbacks' line work). */
export const ICON = {
  today: <path {...S} d="M4 11.5 12 5l8 6.5 M6.5 10v9h11v-9 M10 19v-5h4v5" />,
  map: <g {...S}><path d="m5 17 4-8 5 4 5-7" /><circle cx="5" cy="17" r="1.6" /><circle cx="9" cy="9" r="1.6" /><circle cx="14" cy="13" r="1.6" /><circle cx="19" cy="6" r="1.6" /></g>,
  notebook: <path {...S} d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z M5 18a2 2 0 0 1 2-2h11 M9 8h6 M9 11h4" />,
  ask: <path {...S} d="M5 5h14v10H10l-4 4v-4H5z M10 8.6a2 2 0 1 1 2.7 1.9c-.5.2-.7.6-.7 1.1 M12 13.4h.01" />,
  practice: <path {...S} d="M4 6h16v11H4z M8 20h8 M8 10l2 2 4-4" />,
  list: <path {...S} d="M9 7h11 M9 12h11 M9 17h11 M4.5 7h.01 M4.5 12h.01 M4.5 17h.01" />,
  picture: <path {...S} d="M4 6h16v12H4z M4 15l4.5-4 4 3.5 2.5-2 5 3.5 M15.5 9.5h.01" />,
  back: <path {...S} d="M15 5l-7 7 7 7" />,
  left: <path {...S} d="M14.5 6 8.5 12l6 6" />,
  right: <path {...S} d="M9.5 6l6 6-6 6" />,
  play: <path {...S} d="M8 5.5v13l10-6.5z" />,
  tick: <path {...S} d="M5 12.5l4.5 4.5L19 7" />,
  speaker: <path {...S} d="M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7" />,
  computer: <g {...S}><rect x="3" y="4.5" width="18" height="12" rx="2.5" /><path d="M9.5 9.6h.01 M14.5 9.6h.01 M9.5 12.6c1.4 1 3.6 1 5 0 M9 19.5h6 M12 16.5v3" /></g>,
  teacher: <g {...S}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></g>,
  eye: <path {...S} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  switch: <path {...S} d="M6 8h12l-3-3 M18 16H6l3 3" />,
  sound: <path {...S} d="M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12" />,
  calm: <path {...S} d="M4 15c2.5-2 5.5-2 8 0s5.5 2 8 0 M4 10c2.5-2 5.5-2 8 0s5.5 2 8 0" />,
  captions: <path {...S} d="M4 6h16v12H4z M7 11h5 M14 11h3 M7 14h3 M12 14h5" />,
  mic: <path {...S} d="M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z M6 11a6 6 0 0 0 12 0 M12 17v3" />,
  face: <g {...S}><circle cx="12" cy="12" r="8.5" /><path d="M9 10h.01 M15 10h.01 M9 14.5c1.6 1.4 4.4 1.4 6 0" /></g>,
  text: <path {...S} d="M5 7V5h14v2 M12 5v14 M9 19h6" />,
  theme: <path {...S} d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5A6.5 6.5 0 0 1 12 3.5z" />,
  pencil: <path {...S} d="M5 19l1-4 10-10 3 3-10 10z M14 7l3 3" />,
  more: <path {...S} d="M12 5v14 M5 12h14" />,
  type: <path {...S} d="M3.5 7h17v10h-17z M7 10h.01 M10 10h.01 M13 10h.01 M16 10h.01 M8 14h8" />,
  lock: <path {...S} d="M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  wifiOff: <path {...S} d="M4 4l16 16 M8.5 16a5 5 0 0 1 7 0 M5 12.5a10 10 0 0 1 4-2.3 M19 12.5a10 10 0 0 0-3.4-2.1 M12 19.5h.01" />,
} as const;

export type IconName = keyof typeof ICON;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return <Svg size={size}>{ICON[name]}</Svg>;
}

/** Young pictogram fallbacks: a soft tinted disc with the line glyph, in the picto family's colour. */
const PICTO_FALLBACK: Record<string, { icon: IconName; tint: string }> = {
  "picto/home": { icon: "today", tint: "var(--art-terracotta)" },
  "picto/garden": { icon: "map", tint: "var(--art-leaf)" },
  "picto/practice": { icon: "practice", tint: "var(--art-sky)" },
  "picto/notebook": { icon: "notebook", tint: "var(--art-rose)" },
  "picto/list": { icon: "list", tint: "var(--art-stone)" },
  "picto/arrow-left": { icon: "left", tint: "var(--art-stone)" },
  "picto/arrow-right": { icon: "right", tint: "var(--art-stone)" },
  "picto/ai-teacher": { icon: "computer", tint: "var(--art-teal)" },
  "picto/sound-on": { icon: "sound", tint: "var(--art-sky)" },
  "picto/sound-off": { icon: "sound", tint: "var(--art-stone)" },
  "picto/calmer": { icon: "calm", tint: "var(--art-teal)" },
  "picto/who-sees": { icon: "eye", tint: "var(--art-rose)" },
  "picto/switch-learner": { icon: "switch", tint: "var(--art-stone)" },
  "picto/captions": { icon: "captions", tint: "var(--art-sky)" },
  "picto/pencil": { icon: "pencil", tint: "var(--art-terracotta)" },
  "picto/more-pictures": { icon: "more", tint: "var(--art-stone)" },
  "picto/finish": { icon: "tick", tint: "var(--art-leaf)" },
};

export function PictoFallback({ id, size }: { id: string; size: number }) {
  const f = PICTO_FALLBACK[id] ?? { icon: "picture" as IconName, tint: "var(--art-stone)" };
  return (
    <span className="picto-fb" style={{ width: size, height: size, ["--tint" as string]: f.tint }}>
      <Svg size={Math.round(size * 0.58)}>{ICON[f.icon]}</Svg>
    </span>
  );
}

/** A Young pictogram: the painted picto when it exists, else its drawn twin. Decorative: the label is live text. */
export function Picto({ id, size = 48 }: { id: string; size?: number }) {
  return <Spot id={id} size={size} fallback={<PictoFallback id={id} size={size} />} />;
}

/** The 24 avatar discs (§7.5): animals and objects, never human faces; tints rotate teal, rose, leaf, sky, terracotta, stone. */
export const AVATARS = [
  "red-panda", "tiger-cub", "elephant-calf", "river-dolphin", "hornbill", "peacock", "turtle", "butterfly", "squirrel",
  "camel", "rhino", "snow-leopard", "kite", "rocket", "football", "cricket-bat", "mango", "sunflower", "mountain",
  "sailboat", "auto-rickshaw", "bicycle", "telescope", "paintbrush",
] as const;
const TINTS = ["var(--art-teal)", "var(--art-rose)", "var(--art-leaf)", "var(--art-sky)", "var(--art-terracotta)", "var(--art-stone)"];
/** Human names for the avatar pictures (accessible names; the art itself carries no text). */
export const avatarName = (id: string) => id.replace(/-/g, " ");

/** The disc's fallback: its tint and a simple drawn mark (a different shape per avatar, so a child can tell them apart). */
function AvatarMark({ i }: { i: number }) {
  const marks = [
    <circle key="c" cx="12" cy="12" r="5" />, <path key="t" d="M12 6l6 11H6z" />, <rect key="s" x="7" y="7" width="10" height="10" rx="2" />,
    <path key="d" d="M12 5l7 7-7 7-7-7z" />, <path key="h" d="M7 8h10v8H7z M7 12h10" />, <path key="p" d="M12 5l2 5h5l-4 3.5 1.5 5.5L12 16l-4.5 3 1.5-5.5L5 10h5z" />,
  ];
  return <g fill="none" stroke="var(--surface)" strokeWidth={2.2} strokeLinejoin="round">{marks[i % marks.length]}</g>;
}

export function Avatar({ id, size = 56, alt }: { id: string | null | undefined; size?: number; alt?: string }) {
  const i = Math.max(0, AVATARS.indexOf((id ?? "") as (typeof AVATARS)[number]));
  const fallback = (
    <span className="avatar-fb" style={{ width: size, height: size, background: TINTS[i % TINTS.length] }}>
      <Svg size={Math.round(size * 0.6)}><AvatarMark i={Math.floor(i / TINTS.length) + i} /></Svg>
    </span>
  );
  return <Spot id={`avatars/${id ?? AVATARS[0]}`} size={size} alt={alt} className="cs-avatar" fallback={fallback} />;
}
