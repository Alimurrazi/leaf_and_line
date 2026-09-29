type Variant = "primary" | "outline" | "ghost" | "reader" | "readerOutline";
type Size = "md" | "sm";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border font-semibold " +
  "transition-[transform,background-color] duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-35";

const variants: Record<Variant, string> = {
  primary: "border-action bg-action text-white hover:-translate-y-px hover:bg-[#414141]",
  outline: "border-[#cbc7c0] bg-transparent text-action hover:bg-[#f0eee9]",
  ghost: "border-transparent bg-transparent text-inherit",
  reader: "border-[#4a4c52] bg-[#2b2d32] text-reader-text hover:bg-[#41444a]",
  readerOutline: "border-[#53565a] bg-transparent text-[#eeeeee] hover:bg-[#2b2d32]",
};

const sizes: Record<Size, string> = {
  md: "px-[19px] py-[11px] text-sm",
  sm: "px-2.5 py-2 text-xs sm:px-3.5 sm:text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}
