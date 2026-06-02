import { WizardState } from "../hooks/useWizardState";

interface Props {
  state: WizardState;
  patch: (p: Partial<WizardState["notifications"]>) => void;
}

export default function Step6Notifications({ state, patch }: Props) {
  const n = state.notifications;
  return (
    <div className="space-y-5">
      <div className="glass-card p-6 space-y-4">
        <Toggle
          label="Captain reminders"
          desc="Nudge the current captain when their window opens."
          checked={n.captainReminders}
          onChange={(v) => patch({ captainReminders: v })}
        />
        <Toggle
          label="Match deadline reminders"
          desc="Warn players as a match deadline approaches."
          checked={n.deadlineReminders}
          onChange={(v) => patch({ deadlineReminders: v })}
        />
        <Toggle
          label="Weekly digest"
          desc="Send everyone a status email summarizing the week."
          checked={n.weeklyDigest}
          onChange={(v) => patch({ weeklyDigest: v })}
        />
        {n.weeklyDigest && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Digest frequency (days)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={n.digestFrequencyDays}
              onChange={(e) => patch({ digestFrequencyDays: parseInt(e.target.value) || 7 })}
              className="w-full max-w-[160px] px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
            />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Email delivery rolls out shortly — your preferences are saved with the season either way.
      </p>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full text-left flex items-start justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-all"
    >
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div
        className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-all relative ${
          checked ? "bg-primary" : "bg-white/15"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}