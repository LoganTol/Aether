import { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2, Rocket } from "lucide-react";

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
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs md:text-sm text-muted-foreground font-semibold tracking-wide uppercase">
            Step {step} of {totalSteps}
          </div>
          <div className="text-xs text-muted-foreground">{pct}%</div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* desktop labels */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div
                key={label}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                    ? "border-primary/40 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {n}. {label}
              </div>
            );
          })}
        </div>
        {/* mobile dots */}
        <div className="md:hidden flex items-center gap-1.5">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 <= step ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div>{children}</div>

      {/* Sticky action bar on mobile, inline on desktop */}
      <div className="fixed md:static bottom-0 left-0 right-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t md:border-0 border-border p-4 md:p-0 z-30">
        <div className="container md:px-0 max-w-3xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={step === 1 || launching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:border-primary/50 disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onLaunch}
              disabled={launching}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {launching ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />}
              Launch Season
            </button>
          )}
        </div>
      </div>
    </div>
  );
}