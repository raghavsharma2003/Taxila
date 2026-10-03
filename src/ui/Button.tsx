// Button and ButtonLink. Commit is the native click (pointer-up inside the target, cancelled if the finger
// slides off: WCAG 2.5.2); pointer-down feedback is the CSS :active press (<= 100 ms, A5).
// Variants (PRODUCT-DESIGN-V2 §13.1): primary (nib) · secondary · quiet · destructive (ink, never red; "danger" is
// its old name). There is no "turn" variant: no button ever carries the lamp (G-LAMP-1); it lights the dock only.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive" | "danger";
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
