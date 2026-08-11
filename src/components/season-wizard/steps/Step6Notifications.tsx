import { WizardState } from "../hooks/useWizardState";
import { Surface } from "@/components/ui-system";

interface Props {
  state: WizardState;
  patch: (p: Partial<WizardState["notifications"]>) => void;
}

export default function Step6Notifications({ state, patch }: Props) {
  const n = state.notifications;
  return (
    <div className="space-y-5">
      <Surface level={1} padded="lg" className="space-y-4">
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
            <label className="text-eyebrow mb-1.5 block">
              Digest frequency (days)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={n.digestFrequencyDays}
              onChange={(e) => patch({ digestFrequencyDays: parseInt(e.target.value) || 7 })}
              className="field max-w-[160px]"
            />
          </div>
        )}
      </Surface>
      <p className="text-meta">
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
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-border p-3 text-left transition-all hover:border-primary/50"
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-meta">{desc}</div>
      </div>
      <div
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-all ${
          checked ? "bg-primary" : "bg-white/15"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}
