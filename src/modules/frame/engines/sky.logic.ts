// sky@1 v1 (2D) — day and night, the shadow stick and the Moon's phases (science S08). The models are
// deliberately simple and golden-tested for the facts a Class 4-8 child is asked about:
//   day/night: Earth seen from above the North Pole, sunrise 06:00 and sunset 18:00 (equinox day length).
//   shadow:    solar elevation e(h) = eMax·sin(π(h−6)/12), eMax = 90° − |latitude − declination|,
//              declination = 23.44°·sin(2π(284 + day)/365); shadow = height / tan(e), pointing away from the Sun
//              (west in the morning, east in the afternoon; at noon north where the Sun is south of the observer,
//              south where the declination is above the latitude, as in south India in summer).
//   phases:    8 positions, 29.53-day synodic month; lit fraction (1 − cos α)/2; northern-hemisphere view, so a
//              waxing Moon is lit on the right.
import { clampInt, isNum } from "../kit/math.ts";

export type Scene = "daynight" | "shadow" | "phases";
export const SYNODIC_DAYS = 29.53;
export const TILT = 23.44;
export const PHASES = ["new", "waxing_crescent", "first_quarter", "waxing_gibbous", "full", "waning_gibbous", "last_quarter", "waning_crescent"] as const;
export type Phase = (typeof PHASES)[number];
const CITIES: Record<string, number> = { srinagar: 34.1, delhi: 28.6, mumbai: 19.1, chennai: 13.1, kanyakumari: 8.1 };

export interface SkyConfig {
  scene: Scene;
  target: string; // daynight: day|night|noon|midnight|sunrise|sunset; shadow: shortest|longest|<hour>; phases: a phase
  latitude: number;
  dayOfYear: number;
  stick: number; // m
  predict: boolean;
  issues: string[];
  error: string | null;
}

export function normalize(p: Record<string, unknown>): SkyConfig {
  const issues: string[] = [];
  const rep = String(p.representation ?? "").toLowerCase();
  let scene: Scene = p.scene === "daynight" || p.scene === "shadow" || p.scene === "phases" ? p.scene : /moon|phase|chand/.test(rep) ? "phases" : /shadow|chhaya|stick|sundial/.test(rep) ? "shadow" : "daynight";
  if (typeof p.scene === "string" && p.scene !== scene) issues.push(`scene: ${p.scene} not built; using ${scene}`);
  const targets: Record<Scene, string[]> = {
    daynight: ["day", "night", "noon", "midnight", "sunrise", "sunset"],
    shadow: ["shortest", "longest_afternoon", "longest_morning", ...Array.from({ length: 13 }, (_, i) => String(6 + i))],
    phases: [...PHASES],
  };
  const dflt: Record<Scene, string> = { daynight: "night", shadow: "shortest", phases: "full" };
  let target = typeof p.target === "string" ? p.target : dflt[scene];
  if (!targets[scene].includes(target)) {
    issues.push(`target: ${target} is not a ${scene} target (${targets[scene].slice(0, 8).join("|")}…)`);
    target = dflt[scene];
  }
  const city = typeof p.observer === "string" ? CITIES[p.observer] : undefined;
  if (typeof p.observer === "string" && city === undefined) issues.push(`observer: ${p.observer} unknown`);
  scene = scene as Scene;
  return {
    scene,
    target,
    latitude: city ?? (isNum(p.latitude) ? Math.max(-60, Math.min(60, p.latitude)) : CITIES.delhi),
    dayOfYear: clampInt(p.dayOfYear, 1, 365, 80),
    stick: isNum(p.stick) && p.stick > 0 ? p.stick : 1,
    predict: p.predict === true || p.mode === "predict",
    issues,
    error: null,
  };
}

// ─── day and night ───
export const isDay = (h: number) => h > 6 && h < 18;
export function dayNightState(h: number): string {
  if (h === 12) return "noon";
  if (h === 0) return "midnight";
  if (h === 6) return "sunrise";
  if (h === 18) return "sunset";
  return isDay(h) ? "day" : "night";
}
export function dayNightMeets(target: string, h: number): boolean {
  const st = dayNightState(h);
  if (target === "day") return isDay(h);
  if (target === "night") return !isDay(h) && h !== 6 && h !== 18;
  return st === target;
}
/** Angle of the observer on Earth's disc (seen from above the North Pole, Sun to the left), degrees. */
export const observerAngle = (h: number) => 180 + (h - 12) * 15;

// ─── shadow stick ───
export const declination = (day: number) => TILT * Math.sin((2 * Math.PI * (284 + day)) / 365);
export const maxElevation = (lat: number, day: number) => 90 - Math.abs(lat - declination(day));
export function elevation(c: Pick<SkyConfig, "latitude" | "dayOfYear">, h: number): number {
  if (h <= 6 || h >= 18) return 0;
  return maxElevation(c.latitude, c.dayOfYear) * Math.sin((Math.PI * (h - 6)) / 12);
}
/** Shadow length in metres (Infinity when the Sun is down). */
export function shadowLen(c: Pick<SkyConfig, "latitude" | "dayOfYear" | "stick">, h: number): number {
  const e = elevation(c, h);
  return e <= 0 ? Infinity : c.stick / Math.tan((e * Math.PI) / 180);
}
/**
 * Sun azimuth, simplified: east (90°) at 06:00 to west (270°) at 18:00, through SOUTH (180°) at noon where the
 * observer is north of the Sun's declination, and through NORTH (0°) where the Sun is north of the observer at
 * noon (south India from late April to mid August: Chennai 13.1°N, Kanyakumari 8.1°N), so the noon shadow
 * there points south.
 */
type Where = Pick<SkyConfig, "latitude" | "dayOfYear">;
const DEFAULT_WHERE: Where = { latitude: CITIES.delhi, dayOfYear: 80 };
export const sunNorthAtNoon = (c: Where) => declination(c.dayOfYear) > c.latitude;
export const sunAzimuth = (h: number, c: Where = DEFAULT_WHERE) => (sunNorthAtNoon(c) ? (360 + 90 - (h - 6) * 15) % 360 : 90 + (h - 6) * 15);
/** The shadow points away from the Sun: azimuth + 180°. */
export const shadowAzimuth = (h: number, c: Where = DEFAULT_WHERE) => (sunAzimuth(h, c) + 180) % 360;
/** Compass word for the shadow's direction. */
export function shadowDirection(h: number, c: Where = DEFAULT_WHERE): string {
  const az = shadowAzimuth(h, c);
  const names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return names[Math.round(az / 45) % 8];
}
export function shadowMeets(c: SkyConfig, h: number): boolean {
  const hours = Array.from({ length: 11 }, (_, i) => 7 + i); // 07..17, the Sun is up
  const lens = hours.map((x) => shadowLen(c, x));
  if (c.target === "shortest") return Math.abs(shadowLen(c, h) - Math.min(...lens)) < 1e-9;
  if (c.target === "longest_morning") return h === 7;
  if (c.target === "longest_afternoon") return h === 17;
  return h === Number(c.target);
}

// ─── Moon phases ───
export const phaseAt = (k: number): Phase => PHASES[((k % 8) + 8) % 8];
/** Phase angle α (0 = new, 180 = full) for position k of 8. */
export const phaseAngle = (k: number) => (((k % 8) + 8) % 8) * 45;
export const litFraction = (k: number) => (1 - Math.cos((phaseAngle(k) * Math.PI) / 180)) / 2;
export const daysAfterNew = (k: number) => Math.round(((((k % 8) + 8) % 8) * SYNODIC_DAYS) / 8 * 10) / 10;
export const waxing = (k: number) => phaseAngle(k) > 0 && phaseAngle(k) < 180;

/** The scene's POE question: options and the model's answer. */
export function poeOf(c: SkyConfig): { id: string; options: string[]; answer: string } {
  if (c.scene === "daynight") return { id: "night_at_21", options: ["day", "night"], answer: isDay(21) ? "day" : "night" };
  if (c.scene === "shadow") {
    const opts = { morning: 9, noon: 12, evening: 16 } as Record<string, number>;
    const best = Object.entries(opts).sort((a, b) => shadowLen(c, a[1]) - shadowLen(c, b[1]))[0][0];
    return { id: "shortest_when", options: Object.keys(opts), answer: best };
  }
  // about half a synodic month after new moon
  const k = Math.round(14.8 / (SYNODIC_DAYS / 8));
  const ph = phaseAt(k);
  return { id: "half_month_after_new", options: ["new", "first_quarter", "full"], answer: ph };
}
