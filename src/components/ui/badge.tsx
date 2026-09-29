export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded px-[9px] py-[5px] text-[11px] font-bold bg-[#efede7] text-[#61553e]">
      {children}
    </span>
  );
}
