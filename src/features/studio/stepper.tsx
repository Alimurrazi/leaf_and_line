import Link from "next/link";
import type { Step, StepState } from "@/studio/steps";

const MARK: Record<StepState, string> = {
  done: "bg-ok-tint text-ok",
  todo: "border border-[#cbc7c0] text-text",
  error: "bg-error-tint text-error",
  warn: "bg-warn-tint text-warn",
  locked: "border border-border text-muted",
};
const ICON: Partial<Record<StepState, string>> = { done: "✓", error: "✕", warn: "!" };
const NOTE: Partial<Record<StepState, string>> = { error: "text-error", warn: "text-warn" };

export function Stepper({ steps, active }: { steps: Step[]; active: number }) {
  return (
    <nav aria-label="Book pipeline">
      <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-accent-text">STEPS</p>
      <ol className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {steps.map((step) => {
          const isActive = step.n === active;
          const body = (
            <>
              <span aria-hidden="true" className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${MARK[step.state]}`}>
                {ICON[step.state] ?? step.n}
              </span>
              <span className="flex flex-col leading-tight">
                <span className={`whitespace-nowrap font-semibold ${step.state === "locked" ? "text-muted" : ""} ${isActive ? "font-bold" : ""}`}>
                  {step.n}. {step.label}
                </span>
                {step.note && <span className={`whitespace-nowrap text-xs ${NOTE[step.state] ?? "text-muted"}`}>{step.note}</span>}
              </span>
            </>
          );
          const cls = `flex min-h-11 items-center gap-3 rounded-control border px-3 py-2 ${isActive ? "border-border bg-surface" : "border-transparent"}`;
          return (
            <li key={step.n} className="shrink-0">
              {step.href ? (
                <Link href={step.href} aria-current={isActive ? "step" : undefined} className={`${cls} hover:bg-surface`}>
                  {body}
                </Link>
              ) : (
                <div className={cls} title={step.lockedWhy}>
                  {body}
                  {step.lockedWhy && <span className="sr-only">Locked: {step.lockedWhy}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
