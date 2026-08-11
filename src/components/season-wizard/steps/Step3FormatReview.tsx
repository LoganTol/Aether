import { WizardState } from "../hooks/useWizardState";
import {
  singlesMatchCount,
  doublesMatchCount,
  roundCount,
  weeksBetween,
} from "../lib/wizardEstimates";
import { Surface, StatBlock } from "@/components/ui-system";

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
      <Surface level={1} padded="lg" className="space-y-4">
        <h2 className="text-ui-title">Season summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Name" value={state.basics.name || "—"} />
          <Stat label="Format" value={state.basics.format} className="capitalize" />
          <Stat label="Starts" value={state.basics.startDate} />
          <Stat label="Ends" value={state.basics.endDate} />
          <Stat label="Captain window" value={`${state.basics.captainWindowDays} days`} />
          <Stat label="Match deadline" value={`${state.basics.matchDeadlineDays} days`} />
        </div>
      </Surface>

      <Surface level={1} padded="lg" className="border-primary/30">
        <div className="text-eyebrow mb-3 text-primary">
          What this generates
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock label="Players" value={total} />
          {isDoubles && <StatBlock label="Teams" value={units} />}
          <StatBlock label="Matches" value={matches} />
          <StatBlock label="Rounds" value={rounds} />
          <StatBlock label="Weeks" value={weeks || "—"} />
        </div>
      </Surface>

      <Surface level={1} padded="lg">
        <h3 className="text-ui-title mb-3">Roster</h3>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-[hsl(var(--text-muted))]">
          <li className="text-foreground">{creatorName} <span className="text-meta">(host)</span></li>
          {valid.map((p, i) => (
            <li key={i} className="text-foreground">{p.display_name}</li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-meta">{label}</div>
      <div className={`font-semibold text-foreground ${className || ""}`}>{value}</div>
    </div>
  );
}
