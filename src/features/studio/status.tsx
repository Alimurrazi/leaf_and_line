import type { Check, CheckLevel } from "@/studio/types";

type Tone = CheckLevel | "neutral";

const TONE: Record<Tone, { chip: string; icon: string }> = {
  ok: { chip: "bg-ok-tint text-ok", icon: "✓" },
  warn: { chip: "bg-warn-tint text-warn", icon: "!" },
  error: { chip: "bg-error-tint text-error", icon: "✕" },
  info: { chip: "bg-chip text-chip-text", icon: "–" },
  neutral: { chip: "bg-chip text-chip-text", icon: "" },
};

/** Status is always shown with an icon and a word, never by color alone. */
export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const { chip, icon } = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-[9px] py-1 text-xs font-bold ${chip}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: Tone }) {
  const { chip, icon } = TONE[tone];
  return (
    <span aria-hidden="true" className={`inline-flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold ${chip}`}>
      {icon}
    </span>
  );
}

export function CheckList({ checks, empty }: { checks: Check[]; empty?: string }) {
  if (checks.length === 0) return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="divide-y divide-border border-t border-border">
      {checks.map((check) => (
        <li key={check.id} className="flex items-start gap-3 py-3">
          <StatusDot tone={check.level} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-semibold">
              <span className="sr-only">{LEVEL_WORD[check.level]}: </span>
              {check.title}
            </span>
            {check.detail && <span className="text-[13px] text-muted">{check.detail}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

const LEVEL_WORD: Record<CheckLevel, string> = { ok: "OK", warn: "Warning", error: "Problem", info: "Note" };

export function PipelineBar({ step, total = 6, label = "Pipeline" }: { step: number; total?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>
          {step}/{total}
        </span>
      </div>
      <div className="flex gap-1" role="img" aria-label={`${label}: ${step} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-[5px] flex-1 rounded-full ${i < step ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

export function Card({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-border bg-surface p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-chip px-1.5 py-px font-mono text-[12.5px] text-chip-text">{children}</code>
);
