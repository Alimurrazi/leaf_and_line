export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-extrabold uppercase tracking-[0.17em] text-accent-text ${className}`}>
      {children}
    </p>
  );
}
