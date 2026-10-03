import type { HTMLAttributes, ReactNode } from "react";

/** A surface block. `turn` = the parent screen's one action block (a nib left bar). It carries no "your turn"
 *  label and no lamp colour: the parent never uses turn language (PRODUCT-DESIGN-V2 §5.3). */
export function Card({ title, turn, flat, as: As = "section", className, children, ...rest }:
  { title?: ReactNode; turn?: boolean; flat?: boolean; as?: "section" | "div" | "article" | "li" } & HTMLAttributes<HTMLElement>) {
  return (
    <As className={["card", flat && "card-flat", turn && "card-turn", "stack-sm", className].filter(Boolean).join(" ")} {...rest}>
      {title && (
        <div className="row">
          <h2 className="card-title">{title}</h2>
        </div>
      )}
      {children}
    </As>
  );
}
