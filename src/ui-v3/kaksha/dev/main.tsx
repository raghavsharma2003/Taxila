// Kaksha dev page (never shipped): renders the presentational views with fixture data for shots and the rendered lint.
//   ?screen=home|world|hangar  &theme=night|dawn  &state=start|done|capped|resting|loading  &world=empty|some  &when=yesterday
import { createRoot } from "react-dom/client";
import { KakshaRoot } from "../Shell.tsx";
import { HangarView, HomeView, WorldView } from "../views.tsx";
import { world, type Catalog, type WorldSkill } from "../world.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";

const q = new URLSearchParams(location.search);
const screen = q.get("screen") ?? "home";
const family = q.get("theme") === "dawn" ? "young" : "older";
const reduced = q.get("motion") === "reduced";
const CAT = catalogJson as unknown as Catalog;

const SKILLS: WorldSkill[] = [
  { skillId: "c6-maths-ch07-t01-s1", title: "Fractional units and equal shares", subject: "maths", state: "secure" },
  { skillId: "c6-maths-ch07-t02-s1", title: "Fractions on the number line", subject: "maths", state: "got_it" },
  { skillId: "c6-maths-ch07-t03-s1", title: "Equivalent fractions", subject: "maths", state: "secure" },
  { skillId: "c6-maths-ch02-t01-s1", title: "Angles and how to measure them", subject: "maths", state: "secure" },
  { skillId: "c6-maths-ch05-t01-s1", title: "Prime numbers and factors", subject: "maths", state: "secure" },
  { skillId: "c6-maths-ch03-t01-s1", title: "Patterns in numbers", subject: "maths", state: "practising" },
  { skillId: "c6-science-ch04-t01-s1", title: "Magnets and their poles", subject: "science", state: "secure" },
  { skillId: "c6-science-ch11-t01-s1", title: "Light, shadows and reflection", subject: "science", state: "secure" },
  { skillId: "c6-science-ch02-t01-s1", title: "Components of food", subject: "science", state: "got_it" },
  { skillId: "c6-english-ch01-t01-s1", title: "Summarising a story", subject: "english", state: "secure" },
  { skillId: "c6-english-ch03-t01-s1", title: "Nouns and verbs", subject: "english", state: "practising" },
];
const empty = q.get("world") === "empty";
const skills = empty ? SKILLS.map((s) => ({ ...s, state: "practising" as const })) : SKILLS;
const before = new Set(SKILLS.filter((s) => s.state === "secure" && s.skillId !== "c6-maths-ch07-t03-s1").map((s) => s.skillId));
const today = world(skills, CAT, empty ? undefined : before);
const yesterday = empty ? null : world(skills.map((k) => (k.state === "secure" && !before.has(k.skillId) ? { ...k, state: "got_it" as const } : k)), CAT);

const teacher = { id: "asha", name: "Asha", band: family === "young" ? "b2" : "b3", form: (q.get("face") === "plate" ? "plate" : "live") as "live" | "plate" };
const el =
  screen === "world" ? <WorldView childName="Riya" world={q.get("when") === "yesterday" && yesterday ? yesterday : today} yesterday={yesterday} hidden={q.get("hidden") === "1"} reducedMotion={reduced} backTo="?screen=home" hangarTo="?screen=hangar" />
  : screen === "hangar" ? <HangarView items={today.items} equipped={{ trail: "trail-green" }} onEquip={() => {}} reducedMotion={reduced} backTo="?screen=world" />
  : <HomeView childName="Riya" family={family} reducedMotion={reduced} state={(q.get("state") as "start") ?? "start"} greeting="evening" teacher={teacher}
      startTo="?screen=world" worldTo="?screen=world" parentTo="?screen=home" opensAt="5:00 pm" />;

createRoot(document.getElementById("root")!).render(<KakshaRoot family={family} reducedMotion={reduced} screen={screen}>{el}</KakshaRoot>);
