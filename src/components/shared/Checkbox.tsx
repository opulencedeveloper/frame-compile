import { cn } from "@/lib/utils";
import { CheckboxProps } from "@/types/shared";

export default function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 text-sm text-c63636d font-nunito-400 cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.75 size-4 shrink-0 cursor-pointer accent-c16161a aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-cdc2626"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
