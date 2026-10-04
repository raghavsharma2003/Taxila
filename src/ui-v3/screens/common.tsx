// Shared screen pieces: the made-for-you thumbnails (vector scenes drawn from what the piece is, never stock, never text
// in pixels), the child tab bar, the teacher's small identity mark, and the teacher note card.
import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon.tsx";
import { FaceSlot } from "../TeacherFace.tsx";
import type { MadeItem, TeacherRef, ThumbKind } from "./types.ts";
import type { ArtifactKind } from "../Stage.tsx";

export const KIND_ICON: Record<ArtifactKind, IconName> = { board: "pencil", animation: "film", game: "gamepad", explorable: "hand", image: "eye", simulation: "target" };
export const KIND_LABEL: Record<ArtifactKind, string> = { board: "Board", animation: "Animation", game: "Game", explorable: "Explorable", image: "Image", simulation: "Simulation" };

/** Vector thumbnails, 160 × 100. They read the theme through currentColor-free fixed stage colours (stages are dark-ink in both themes' cards). */
export function Thumb({ kind, className }: { kind: ThumbKind; className?: string }) {
  const bg = "var(--stage-bg)";
  const ink = "var(--board-ink)";
  switch (kind) {
    case "fractions":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill={bg} />
          <g fill="none" strokeWidth="1.6"><rect x="104" y="14" width="28" height="22" rx="5" stroke="var(--ion)" /><rect x="104" y="40" width="28" height="22" rx="5" stroke="var(--mint)" /><rect x="104" y="66" width="28" height="22" rx="5" stroke="var(--ion)" /></g>
          <path d="M28 51l18 0-11-7zM28 51l18 0-11 7z" fill={ink} />
          <path d="M46 51 C70 51 80 51 102 51" stroke="var(--ion)" strokeOpacity=".5" strokeDasharray="3 4" fill="none" />
          <g fill={ink} opacity=".45"><circle cx="18" cy="20" r=".9" /><circle cx="70" cy="82" r=".9" /><circle cx="144" cy="30" r=".9" /><circle cx="60" cy="24" r=".9" /><circle cx="86" cy="12" r=".9" /></g>
        </svg>
      );
    case "triangle":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="var(--board)" />
          <path d="M28 80H132V20H28Z" fill="none" stroke={ink} strokeWidth="1.6" />
          <path d="M28 80L70 20L132 80" fill="color-mix(in srgb, var(--ion) 25%, transparent)" stroke="var(--ion)" strokeWidth="1.6" />
          <path d="M70 20V80" stroke="var(--ion)" strokeDasharray="3 3" strokeWidth="1.2" />
          <circle cx="70" cy="20" r="3.5" fill={ink} />
        </svg>
      );
    case "explorable":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill={bg} />
          <path d="M20 80H140M30 80V40" stroke="var(--ion)" strokeWidth="1.6" fill="none" />
          <path d="M30 40H120V80" stroke={ink} strokeOpacity=".35" strokeDasharray="3 4" fill="none" />
          <path d="M30 80L104 40L120 80" fill="color-mix(in srgb, var(--sub-science) 22%, transparent)" stroke="var(--sub-science)" strokeWidth="1.6" />
          <circle cx="104" cy="40" r="4" fill={ink} />
          <path d="M88 40h-8M120 40h8" stroke={ink} strokeOpacity=".5" strokeWidth="1.2" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <defs>
            <radialGradient id="v3-leaf-g" cx="55%" cy="55%" r="60%"><stop offset="0" stopColor="#1f6a3a" /><stop offset="1" stopColor="#0c2416" /></radialGradient>
          </defs>
          <rect width="160" height="100" fill="#0a120e" />
          <path d="M40 86 C46 40 92 18 136 16 C132 58 102 88 40 86Z" fill="url(#v3-leaf-g)" />
          <path d="M44 84 C70 64 100 40 132 18" stroke="#7fd39a" strokeOpacity=".55" strokeWidth="1.2" fill="none" />
          <path d="M70 66 L64 48 M86 54 L82 34 M100 44 L100 26 M78 60 L98 64 M94 48 L114 50" stroke="#7fd39a" strokeOpacity=".3" strokeWidth=".9" fill="none" />
          <path d="M8 10 L62 52" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M62 52 L120 24" stroke="#5BE37D" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "orbit":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill={bg} />
          <ellipse cx="80" cy="50" rx="58" ry="22" fill="none" stroke={ink} strokeOpacity=".3" />
          <circle cx="80" cy="50" r="12" fill="var(--amber)" />
          <circle cx="132" cy="58" r="5" fill="var(--sub-social)" />
        </svg>
      );
    case "circuit":
      return (
        <svg className={className} viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill={bg} />
          <path d="M30 30H130V74H30Z" fill="none" stroke="var(--ion)" strokeWidth="1.8" />
          <circle cx="80" cy="30" r="8" fill="var(--amber)" />
          <path d="M26 46h8M28 56h4" stroke={ink} strokeWidth="2" />
        </svg>
      );
  }
}

export function MadeCard({ item }: { item: MadeItem }) {
  return (
    <a className="v3-made" href={`#made/${item.id}`}>
      <Thumb kind={item.thumb} className="v3-made-art" />
      <div className="v3-made-m"><b>{item.title}</b><span><Icon name={KIND_ICON[item.kind]} size={12} />{KIND_LABEL[item.kind]} · {item.when}</span></div>
    </a>
  );
}

export interface TabItem { id: string; label: string; icon: IconName }
export const CHILD_TABS: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "progress", label: "Progress", icon: "map" },
  { id: "library", label: "Library", icon: "layers" },
  { id: "you", label: "You", icon: "user" },
];

export function TabBar({ tabs = CHILD_TABS, current, onNav, label = "Main" }: { tabs?: TabItem[]; current: string; onNav?: (id: string) => void; label?: string }) {
  return (
    <nav className="v3-tabbar" aria-label={label}>
      {tabs.map((t) => (
        <a key={t.id} href={`#${t.id}`} aria-current={t.id === current ? "page" : undefined} onClick={(e) => { if (onNav) { e.preventDefault(); onNav(t.id); } }}>
          <Icon name={t.icon} size={22} />{t.label}
        </a>
      ))}
    </nav>
  );
}

/** The teacher's small identity mark: her face plate in a rounded square (2D, never a portrait), with an accessible name. */
export function TeacherChip({ teacher, size = 36 }: { teacher: TeacherRef; size?: number }) {
  return (
    <span className="v3-tchip" style={{ width: size, height: size }} role="img" aria-label={`${teacher.name}, AI teacher`}>
      <FaceSlot tutorId={teacher.id} band={teacher.band} status={null} size="chip" still />
    </span>
  );
}

export function NoteCard({ teacher, children }: { teacher: TeacherRef; children: ReactNode }) {
  return (
    <div className="v3-card v3-note">
      <TeacherChip teacher={teacher} />
      <div><div className="v3-eyebrow">{teacher.name} · AI teacher</div><p>{children}</p></div>
    </div>
  );
}
