import { WizardState } from "../hooks/useWizardState";

type Format = "singles" | "doubles";

interface Props {
  state: WizardState;
  patch: (p: Partial<WizardState["basics"]>) => void;
}

export default function Step1Basics({ state, patch }: Props) {
  const b = state.basics;
  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Season name</label>
        <input
          value={b.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Spring Neighborhood Tennis"
          maxLength={80}
          className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Format</label>
        <div className="inline-flex items-center rounded-full border border-border bg-black/30 p-1">
          {(["singles", "doubles"] as Format[]).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => patch({ format: f })}
              className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${
                b.format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {b.format === "doubles" && (
          <p className="text-xs text-muted-foreground mt-2">
            Doubles uses fixed pairs. You'll assign teams in Step 4.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Start date</label>
          <input
            type="date"
            value={b.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">End date</label>
          <input
            type="date"
            value={b.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Captain window (days)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={b.captainWindowDays}
            onChange={(e) => patch({ captainWindowDays: parseInt(e.target.value) || 7 })}
            className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
          />
          <p className="text-xs text-muted-foreground mt-1">How long each player holds the Scheduling Captain role.</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Match deadline (days)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={b.matchDeadlineDays}
            onChange={(e) => patch({ matchDeadlineDays: parseInt(e.target.value) || 14 })}
            className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
          />
          <p className="text-xs text-muted-foreground mt-1">When a match is considered overdue.</p>
        </div>
      </div>
    </div>
  );
}