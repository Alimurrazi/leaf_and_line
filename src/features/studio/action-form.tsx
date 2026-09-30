"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/button";
import type { ActionResult } from "@/studio/action-result";

type Props = {
  action: (prev: ActionResult, data: FormData) => Promise<ActionResult>;
  submit: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
  children?: React.ReactNode;
};

/** A form bound to a studio server action, with a pending state and the action's message. */
export function ActionForm({ action, submit, variant = "primary", disabled, disabledHint, className = "", children }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || disabled} className={buttonClasses({ variant })}>
          {pending ? "Working…" : submit}
        </button>
        {disabled && disabledHint && <span className="text-xs text-muted">{disabledHint}</span>}
        <p role="status" aria-live="polite" className={`text-sm font-semibold ${state?.ok ? "text-ok" : "text-error"}`}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}
