// State glyphs (PRODUCT-DESIGN-V2 §7.3): hand-built SVGs on a 24 dp grid, used at every band, drawn in
// currentColor so colour stays the LAST carrier. Each glyph's shape differs from every other one, so a greyscale
// screenshot still tells the states apart (V-SIG-3). Decorative: aria-hidden; the word next to it is the name.
import type { SVGProps } from "react";

export type StateGlyphName =
  | "speaking" | "showing" | "your_turn" | "listening" | "heard" | "thinking" | "idle"
  | "paused" | "cloud_slash" | "mic_slash" | "clock" | "speaker_slash"
  | "tick" | "half_tick" | "magnifier" | "lightbulb"
  | "pause" | "mic" | "keyboard" | "send" | "hear" | "cc" | "more" | "help" | "grownup" | "phone" | "home"
  | "hand_up" | "pencil" | "check_circle" | "numbers" | "back" | "slow" | "choices" | "show_how" | "wait";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function paths(name: StateGlyphName) {
  switch (name) {
    case "speaking": // mouth with sound: three arcs
      return (<>
        <path {...S} d="M4 10.5c1.6-2 4.4-2 6 0 M4 13.5c1.6 2 4.4 2 6 0 M4 10.5v3 M10 10.5v3" />
        <path {...S} d="M14 9.5a3.5 3.5 0 0 1 0 5 M16.8 7.2a7 7 0 0 1 0 9.6 M19.6 5a10.4 10.4 0 0 1 0 14" />
      </>);
    case "showing": // eye
      return (<>
        <path {...S} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle {...S} cx="12" cy="12" r="3" />
      </>);
    case "your_turn": // open hand, palm up, offered
      return <path {...S} d="M3 15.5h3.2l2.6 1.8h5.4a1.6 1.6 0 0 0 0-3.2h-3.4 M6.2 15.5l5.5-4.2a1.7 1.7 0 0 1 2.3.3l.1.1 M14.2 17.3l5.2-3.3a1.6 1.6 0 0 1 2 2.4l-5.7 4.2H8.6L6.2 19.5H3" />;
    case "listening": // ear + level arc
      return (<>
        <path {...S} d="M7 9.5a5 5 0 0 1 10 0c0 3-2.6 3.6-2.6 6.2a2.8 2.8 0 0 1-5 1.7 M9.6 9.8a2.4 2.4 0 0 1 4.8 0c0 1.2-1.2 1.6-1.2 2.6" />
        <path {...S} d="M19.5 5.5a8.5 8.5 0 0 1 0 9" />
      </>);
    case "heard": // tick inside a speech bubble (a receipt, never a verdict)
      return (<>
        <path {...S} d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-9l-4.5 3.5V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" />
        <path {...S} d="M8.5 11l2.3 2.2L15.5 8.6" />
      </>);
    case "thinking": // three dots drawn by one slow stroke
      return <path {...S} strokeWidth={2.6} className="glyph-think-stroke" d="M6 12h.01 M12 12h.01 M18 12h.01" />;
    case "idle":
      return <circle {...S} cx="12" cy="12" r="3.5" />;
    case "paused":
    case "pause":
      return (<>
        <circle {...S} cx="12" cy="12" r="9" />
        <path {...S} d="M10 8.5v7 M14 8.5v7" />
      </>);
    case "cloud_slash":
      return (<>
        <path {...S} d="M7.5 18.5h9.8a3.7 3.7 0 0 0 1-7.2 5.7 5.7 0 0 0-9.8-3.3A4.6 4.6 0 0 0 7.5 18.5z" />
        <path {...S} d="M4 4l16 16" />
      </>);
    case "mic_slash":
      return (<>
        <path {...S} d="M9 9.5V7a3 3 0 0 1 6 0v5 M15 14.5a3 3 0 0 1-6-1.5 M5.5 11.5a6.5 6.5 0 0 0 11 4.7 M18.5 11.5c0 .7-.1 1.3-.3 1.9 M12 18v3 M9 21h6" />
        <path {...S} d="M4 4l16 16" />
      </>);
    case "clock":
      return (<>
        <circle {...S} cx="12" cy="12" r="8.5" />
        <path {...S} d="M12 7.5V12l3 2" />
      </>);
    case "speaker_slash":
      return (<>
        <path {...S} d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
        <path {...S} d="M16 9.5l5 5 M21 9.5l-5 5" />
      </>);
    case "tick":
      return <path {...S} strokeWidth={2.6} d="M5 12.5l4.5 4.5L19 7.5" />;
    case "half_tick": // a tick with an open end
      return <path {...S} strokeWidth={2.6} d="M5 12.5l4.5 4.5L14 12.5" />;
    case "magnifier":
      return (<>
        <circle {...S} cx="10.5" cy="10.5" r="6" />
        <path {...S} d="M15 15l5 5" />
      </>);
    case "lightbulb":
      return <path {...S} d="M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />;
    case "mic":
      return (<>
        <rect {...S} x="9" y="3" width="6" height="11" rx="3" />
        <path {...S} d="M5.5 11.5a6.5 6.5 0 0 0 13 0 M12 18v3 M9 21h6" />
      </>);
    case "keyboard":
      return (<>
        <rect {...S} x="3" y="6" width="18" height="12" rx="2" />
        <path {...S} d="M7 10h.01 M11 10h.01 M15 10h.01 M7 14h10" />
      </>);
    case "send":
      return <path {...S} d="M4 12l16-7-6 15-2.5-6.5z M11.5 13.5L20 5" />;
    case "hear": // speaker with sound
      return <path {...S} d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11" />;
    case "cc":
      return (<>
        <rect {...S} x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path {...S} d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6 M17 10.2a2.2 2.2 0 1 0 0 3.6" />
      </>);
    case "more":
      return <path {...S} strokeWidth={2.8} d="M6 12h.01 M12 12h.01 M18 12h.01" />;
    case "help": // a grown-up beside a child
      return (<>
        <circle {...S} cx="8" cy="6.5" r="2.5" />
        <path {...S} d="M4 20v-5.5A4 4 0 0 1 12 14.5V20" />
        <circle {...S} cx="16.5" cy="10" r="2" />
        <path {...S} d="M13.5 20v-3.2a3 3 0 0 1 6 0V20" />
      </>);
    case "grownup":
      return (<>
        <circle {...S} cx="12" cy="7" r="3.2" />
        <path {...S} d="M5.5 20.5v-3a6.5 6.5 0 0 1 13 0v3" />
      </>);
    case "phone":
      return <path {...S} d="M5 4.5h3.2l1.6 4-2 1.3a10 10 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" />;
    case "home":
      return <path {...S} d="M4 11l8-6.5 8 6.5 M6 9.5V20h12V9.5 M10 20v-5h4v5" />;
    case "hand_up": // pointing up at the tray
      return <path {...S} d="M12 3v10 M8.5 6.5L12 3l3.5 3.5 M7 13.5v3a5 5 0 0 0 10 0v-3a1.5 1.5 0 0 0-3 0 M14 13.5v-1a1.5 1.5 0 0 0-3 0" />;
    case "pencil":
      return <path {...S} d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z M14 7l3 3" />;
    case "check_circle":
      return (<>
        <circle {...S} cx="12" cy="12" r="9" />
        <path {...S} d="M7.5 12.5l3 3 6-6.5" />
      </>);
    case "numbers":
      return <path {...S} d="M5 8l2-1.5V17 M10.5 8.5a2.2 2.2 0 0 1 4.2.6c0 2.4-4.4 4-4.4 7.9h4.6 M17.5 7h3l-1.8 3.2a2.4 2.4 0 1 1-1.8 4.2" />;
    case "back":
      return <path {...S} d="M15 5l-7 7 7 7" />;
    case "slow": // a tortoise
      return <path {...S} d="M4 15.5h14 M5.5 15.5a6.5 6.5 0 0 1 13 0 M18.5 13.5l2-1.5 M7 15.5v2.5 M16 15.5v2.5" />;
    case "choices":
      return (<>
        <rect {...S} x="3.5" y="5" width="7.5" height="14" rx="2" />
        <rect {...S} x="13" y="5" width="7.5" height="14" rx="2" />
      </>);
    case "show_how":
      return <path {...S} d="M4 19h16 M6 15l4-4 3 3 5-6 M15 8h3v3" />;
    case "wait":
      return (<>
        <circle {...S} cx="12" cy="12" r="8.5" />
        <path {...S} d="M9.5 9v6 M14.5 9v6" />
      </>);
  }
}

export function Glyph({ name, size = 24, ...rest }: { name: StateGlyphName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-glyph={name} {...rest}>
      {paths(name)}
    </svg>
  );
}
