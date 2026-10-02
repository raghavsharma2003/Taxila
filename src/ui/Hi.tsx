import type { ReactNode } from "react";

/** A Devanagari span: lang="hi" (PD-G14) and the taller Devanagari leading. */
export function Hi({ children, className }: { children: ReactNode; className?: string }) {
  return <span lang="hi" className={["deva", className].filter(Boolean).join(" ")}>{children}</span>;
}
