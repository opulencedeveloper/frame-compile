import { cn } from "@/lib/utils";
import SmartImage from "@/components/shared/SmartImage";
import { InputProps } from "@/types/shared";

export default function Input({
  className,
  type = "text",
  suffixIcon,
  disabled,
  ...props
}: InputProps) {
  const input = (
    <input
      type={type}
      disabled={disabled}
      className={cn(
        "h-10 w-full rounded-md border border-cdcdce1 bg-white px-3 font-nunito-400 text-sm text-c0a0a0a outline-none transition-colors placeholder:text-c8a8a8a focus:border-c0081d8 disabled:cursor-not-allowed disabled:opacity-50",
        suffixIcon && "pr-11",
        className
      )}
      {...props}
    />
  );

  if (!suffixIcon) return input;

  return (
    <div className="relative w-full">
      {input}
      <button
        type="button"
        onClick={suffixIcon.onClick}
        disabled={disabled}
        aria-label={suffixIcon.alt}
        className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SmartImage
          src={suffixIcon.src}
          alt=""
          width={suffixIcon.width ?? 16}
          height={suffixIcon.height ?? 16}
        />
      </button>
    </div>
  );
}
