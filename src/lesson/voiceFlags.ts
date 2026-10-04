// Voice-lane flags (W2-D). Presentation/delivery switches only: never a safety or data switch, and the AI disclosure and
// the safety register are identical on both sides of each.
//
//   voice.laneA.delivery (default OFF): the realtime lane appends HUMAN-VOICE B6's delivery note (built from the Brain's
//     Moment by server/voice/expressive/compile/realtime.js) as the LAST line of the instructions it applies. Off by
//     default because RELATIONAL-OS P1 measured that a tail affect row did not move gpt-realtime-2.1's delivery at n=43
//     and nudged word choice; it turns on per device (`?rtdelivery=1`, or localStorage "tx.flag.voice.laneA.delivery" =
//     "1") or deploy-wide (VITE_RT_DELIVERY=1) once HV-13 and a blind check say it helps.
//   voice.laneSwitch (default ON): a realtime lesson the model rate-limits moves to the cascade lane mid-sitting
//     (BUILD-PLAN W2-D #1). `?laneswitch=0` turns it off on this device, for a soak that must see raw refusals.
export const LANE_A_DELIVERY_KEY = "tx.flag.voice.laneA.delivery";
export const LANE_SWITCH_KEY = "tx.flag.voice.laneSwitch";

function read(key: string, urlParam: string): string | null {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get(urlParam);
      if (v === "1" || v === "0") localStorage.setItem(key, v);
      else if (v === "default") localStorage.removeItem(key);
    }
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null; // no URL / storage blocked: the build default
  }
}

export function laneADeliveryEnabled(): boolean {
  const v = read(LANE_A_DELIVERY_KEY, "rtdelivery");
  if (v === "1") return true;
  if (v === "0") return false;
  return import.meta.env?.VITE_RT_DELIVERY === "1";
}

export function laneSwitchEnabled(): boolean {
  return read(LANE_SWITCH_KEY, "laneswitch") !== "0";
}
