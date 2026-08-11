import { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2, Rocket } from "lucide-react";
import { Surface } from "@/components/ui-system";

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  stepLabels: string[];
  onBack?: () => void;
  onNext?: () => void;
  onLaunch?: () => void;
  nextDisabled?: boolean;
  launching?: boolean;
  children: ReactNode;
}

export default function WizardShell({
  step,
  totalSteps,
  title,
  subtitle,
  stepLabels,
  onBack,
  onNext,
  onLaunch,
  nextDisabled,
  launching,
  children,
}: Props) {
  const pct = Math.round((step / totalSteps) * 100);
  const isLast = step === totalSteps;

  return (
    <div className="space-y-6 pb-28 md:pb-8">
      {/* Stepper */}
      <Surface level={1}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-eyebrow">
            Step {step} of {totalSteps}
          </div>
          <div className="text-meta">{pct}%</div>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* desktop labels */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div
                key={label}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                    ? "border-primary/40 text-primary"
                    : "border-border text-[hsl(var(--text-muted))]"
                }`}
              >
                {n}. {label}
              </div>
            );
          })}
        </div>
        {/* mobile dots */}
        <div className="flex items-center gap-1.5 md:hidden">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 <= step ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </Surface>

      <div>
        <h1 className="text-page-title mb-1">{title}</h1>
        {subtitle && <p className="text-body">{subtitle}</p>}
      </div>

      <div>{children}</div>

      {/* Sticky action bar on mobile, inline on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="container flex max-w-3xl items-center justify-between gap-3 md:px-0">
          <button
            type="button"
            onClick={onBack}
            disabled={step === 1 || launching}
            className="btn-secondary rounded-full"
          >
            <ArrowLeft size={16} aria-hidden /> Back
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="btn-primary rounded-full"
            >
              Next <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onLaunch}
              disabled={launching}
              className="btn-primary rounded-full"
            >
              {launching ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Rocket size={16} aria-hidden />}
              Launch Season
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
