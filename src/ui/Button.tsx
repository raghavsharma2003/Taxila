// Button and ButtonLink. Commit is the native click (pointer-up inside the target, cancelled if the finger
// slides off: WCAG 2.5.2); pointer-down feedback is the CSS :active press (<= 100 ms, A5).
// variant "turn" is the single YOUR TURN element: at most one per screen (§0.4, PX3). The caller owns that rule.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "turn" | "danger";
interface Common { variant?: ButtonVariant; block?: boolean; small?: boolean; icon?: ReactNode }

const cls = ({ variant = "primary", block, small }: Common, extra?: string) =>
  ["btn", `btn-${variant}`, block && "btn-block", small && "btn-sm", extra].filter(Boolean).join(" ");

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { variant, block, small, icon, className, children, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={cls({ variant, block, small }, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant, block, small, icon, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={cls({ variant, block, small }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
