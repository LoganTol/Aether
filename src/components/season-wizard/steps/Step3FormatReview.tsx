import { WizardState } from "../hooks/useWizardState";
import {
  singlesMatchCount,
  doublesMatchCount,
  roundCount,
  weeksBetween,
} from "../lib/wizardEstimates";

interface Props {
  state: WizardState;
  creatorName: string;
}

export default function Step3FormatReview({ state, creatorName }: Props) {
  const valid = state.participants.filter((p) => p.display_name.trim());
  const total = valid.length + 1;
  const isDoubles = state.basics.format === "doubles";
  const units = isDoubles ? Math.floor(total / 2) : total;
  const matches = isDoubles ? doublesMatchCount(units) : singlesMatchCount(units);
  const rounds = roundCount(units);
  const weeks = weeksBetween(state.basics.startDate, state.basics.endDate);

  return (
    <div className="space-y-5">
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold">Season summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Name" value={state.basics.name || "—"} />
          <Stat label="Format" value={state.basics.format} className="capitalize" />
          <Stat label="Starts" value={state.basics.startDate} />
          <Stat label="Ends" value={state.basics.endDate} />
          <Stat label="Captain window" value={`${state.basics.captainWindowDays} days`} />
          <Stat label="Match deadline" value={`${state.basics.matchDeadlineDays} days`} />
        </div>
      </div>

      <div className="glass-card p-6 border-primary/30">
        <div className="text-xs font-semibold tracking-wide uppercase text-primary mb-3">
          What this generates
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Big label="Players" value={total} />
          {isDoubles && <Big label="Teams" value={units} />}
          <Big label="Matches" value={matches} />
          <Big label="Rounds" value={rounds} />
          <Big label="Weeks" value={weeks || "—"} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-base font-bold mb-3">Roster</h3>
        <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
          <li className="text-foreground">{creatorName} <span className="text-xs text-muted-foreground">(host)</span></li>
          {valid.map((p, i) => (
            <li key={i} className="text-foreground">{p.display_name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${className || ""}`}>{value}</div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}