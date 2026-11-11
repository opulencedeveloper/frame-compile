import { cn } from "@/lib/utils";
import { ButtonProps } from "@/types/shared";

export default function Button({
  className,
  type = "button",
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 text-sm w-full shrink-0 items-center justify-center gap-2 bg-c0a0a0a px-4 font-nunito-500 text-ceff6ff transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0" aria-hidden>{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex shrink-0" aria-hidden>{rightIcon}</span>}
    </button>
  );
}
