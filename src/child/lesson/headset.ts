// Open mic is offered only when her voice cannot reach the child's microphone (PRODUCT-DESIGN §3.9): the output
// route is a wired or Bluetooth headset, or a 10 s EchoProbe passed. On a loudspeaker phone the teacher's own
// audio would be transcribed as the child's turn. Anything uncertain falls back to tap-to-talk.
//
// Web: device labels from enumerateDevices() (labels are only readable once the microphone permission was
// granted, so before the first lesson this reads "no headset", the safe answer). APK: the Capacitor audio
// route plugin is not wired yet; until it is, the WebView reads the same labels. The EchoProbe is not built:
// `probePassed` stays false, so only a detected headset unlocks open mic. Both gaps are documented.
import { useEffect, useState } from "react";

const HEADSET = /head(set|phone)|ear(phone|bud|piece)|airpods|buds|bluetooth|\bbt\b|wired|hands-?free|usb audio/i;

/** Pure: does this device list contain a headset output (or a headset mic, for routes that only expose inputs)? */
export function hasHeadset(devices: { kind: string; label: string }[]): boolean {
  return devices.some((d) => (d.kind === "audiooutput" || d.kind === "audioinput") && HEADSET.test(d.label));
}

export function useHeadset(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.enumerateDevices) return;
    let live = true;
    const read = () =>
      md
        .enumerateDevices()
        .then((ds) => live && setOn(hasHeadset(ds)))
        .catch(() => live && setOn(false));
    void read();
    md.addEventListener?.("devicechange", read);
    return () => {
      live = false;
      md.removeEventListener?.("devicechange", read);
    };
  }, []);
  return on;
}

/** The single rule both the settings row and the lesson use. */
export function openMicAllowed(o: { older: boolean; wanted: boolean; headset: boolean; probePassed?: boolean; echoDemoted: boolean }): boolean {
  return o.older && o.wanted && (o.headset || !!o.probePassed) && !o.echoDemoted;
}
