import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "dark"
  | "success"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#f23a23] text-white hover:bg-[#d92e1a]",
  secondary: "bg-white text-[#101321] hover:bg-slate-200",
  outline:
    "border border-white/20 bg-transparent text-slate-200 hover:border-[#ff604c] hover:text-white",
  ghost: "bg-white/10 text-white hover:bg-white/15",
  dark: "bg-[#1c2030] text-white hover:bg-[#232739]",
  success: "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
  danger: "bg-[#ff604c] text-white hover:bg-[#ff4530]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[10px]",
  md: "h-10 px-5 text-[11px]",
  lg: "h-12 px-6 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      iconLeft,
      iconRight,
      disabled,
      type,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const baseClassName =
      "inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff604c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070c1c] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`${baseClassName} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      >
        {loading && (
          <Spinner
            size="sm"
            label={typeof children === "string" ? children : "Loading"}
          />
        )}
        {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
        {!loading && children}
        {loading && children && (
          <span className="inline-flex items-center">{children}</span>
        )}
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </button>
    );
  },
);
