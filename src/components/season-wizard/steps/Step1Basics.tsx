import { WizardState } from "../hooks/useWizardState";
import { Surface } from "@/components/ui-system";

type Format = "singles" | "doubles";

interface Props {
  state: WizardState;
  patch: (p: Partial<WizardState["basics"]>) => void;
}

export default function Step1Basics({ state, patch }: Props) {
  const b = state.basics;
  return (
    <Surface level={1} padded="lg" className="space-y-5">
      <div>
        <label className="text-eyebrow mb-1.5 block">Season name</label>
        <input
          value={b.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Spring Neighborhood Tennis"
          maxLength={80}
          className="field"
        />
      </div>

      <div>
        <label className="text-eyebrow mb-2 block">Format</label>
        <div className="inline-flex items-center rounded-full border border-border bg-[hsl(var(--surface-1))] p-1">
          {(["singles", "doubles"] as Format[]).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => patch({ format: f })}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                b.format === f ? "bg-primary text-primary-foreground" : "text-[hsl(var(--text-muted))]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {b.format === "doubles" && (
          <p className="text-meta mt-2">
            Doubles uses fixed pairs. You'll assign teams in Step 4.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-eyebrow mb-1.5 block">Start date</label>
          <input
            type="date"
            value={b.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
            className="field"
          />
        </div>
        <div>
          <label className="text-eyebrow mb-1.5 block">End date</label>
          <input
            type="date"
            value={b.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            className="field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-eyebrow mb-1.5 block">Captain window (days)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={b.captainWindowDays}
            onChange={(e) => patch({ captainWindowDays: parseInt(e.target.value) || 7 })}
            className="field"
          />
          <p className="text-meta mt-1">How long each player holds the Scheduling Captain role.</p>
        </div>
        <div>
          <label className="text-eyebrow mb-1.5 block">Match deadline (days)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={b.matchDeadlineDays}
            onChange={(e) => patch({ matchDeadlineDays: parseInt(e.target.value) || 14 })}
            className="field"
          />
          <p className="text-meta mt-1">When a match is considered overdue.</p>
        </div>
      </div>
    </Surface>
  );
}
