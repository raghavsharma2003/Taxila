import type { HTMLAttributes, ReactNode } from "react";

/** A surface block. `turn` = the parent screen's single your-turn block (PX3): left bar + "your turn" label. */
export function Card({ title, turn, flat, as: As = "section", className, children, ...rest }:
  { title?: ReactNode; turn?: boolean; flat?: boolean; as?: "section" | "div" | "article" | "li" } & HTMLAttributes<HTMLElement>) {
  return (
    <As className={["card", flat && "card-flat", turn && "card-turn", "stack-sm", className].filter(Boolean).join(" ")} {...rest}>
      {(title || turn) && (
        <div className="row">
          {title && <h2 className="card-title">{title}</h2>}
          {turn && <span className="spacer" />}
          {turn && <span className="card-title" style={{ color: "var(--p-yourturn-text)" }}>Your turn</span>}
        </div>
      )}
      {children}
    </As>
  );
}
