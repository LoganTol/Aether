import { WizardState } from "../hooks/useWizardState";
import {
  singlesMatchCount,
  doublesMatchCount,
  roundCount,
  previewSchedule,
} from "../lib/wizardEstimates";
import { Surface, StatBlock } from "@/components/ui-system";

interface Props {
  state: WizardState;
  creatorName: string;
}

export default function Step7ReviewLaunch({ state, creatorName }: Props) {
  const valid = state.participants.filter((p) => p.display_name.trim());
  const isDoubles = state.basics.format === "doubles";
  const pool = [creatorName, ...valid.map((p) => p.display_name)];

  const units = isDoubles
    ? state.doublesTeams.map((t) => t.name)
    : pool;
  const matches = isDoubles
    ? doublesMatchCount(units.length)
    : singlesMatchCount(units.length);
  const rounds = roundCount(units.length);
  const preview = previewSchedule(units, 3);

  const labels: Record<string, string> = {
    best_of_3: "Best of 3 sets",
    pro_set_8: "Pro set to 8",
    single_set_6: "Single set to 6",
    creator_decides: "Commissioner decides",
    majority_vote: "Majority vote",
    auto_loss: "Auto-loss",
    manual_review: "Manual review",
    invite_only: "Invite only",
    private: "Private",
    random: "Random",
    invite_order: "Invite order",
    alphabetical: "Alphabetical",
    manual: "Manual",
  };

  return (
    <div className="space-y-5">
      <Surface level={1} padded="lg">
        <div className="text-eyebrow mb-2 text-primary">
          Almost there
        </div>
        <h2 className="text-page-title mb-1">{state.basics.name || "Untitled season"}</h2>
        <p className="text-body capitalize">
          {state.basics.format} · {state.basics.startDate} → {state.basics.endDate}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Players" value={pool.length} />
          {isDoubles && <StatBlock label="Teams" value={units.length} />}
          <StatBlock label="Matches" value={matches} />
          <StatBlock label="Rounds" value={rounds} />
        </div>
      </Surface>

      <Surface level={1} padded="lg">
        <h3 className="text-ui-title mb-3">Schedule preview</h3>
        {preview.length === 0 ? (
          <p className="text-body">Add more players to preview matches.</p>
        ) : (
          <div className="space-y-4">
            {preview.map((round) => (
              <div key={round.round}>
                <div className="text-eyebrow mb-2">
                  Round {round.round}
                </div>
                <div className="space-y-1.5">
                  {round.matches.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[hsl(var(--surface-1))] px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">{m.a}</span>
                      <span className="text-meta">vs</span>
                      <span className="font-semibold">{m.b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryCard title="Rules">
          <Row k="Score" v={labels[state.rules.scoreFormat]} />
          <Row k="Disputes" v={labels[state.rules.disputeResolution]} />
          <Row k="Forfeits" v={labels[state.rules.forfeitHandling]} />
          <Row k="Visibility" v={labels[state.rules.visibility]} />
        </SummaryCard>
        <SummaryCard title="Rotation & timing">
          <Row k="Rotation" v={labels[state.rules.rotationMode]} />
          <Row k="Captain window" v={`${state.basics.captainWindowDays} days`} />
          <Row k="Match deadline" v={`${state.basics.matchDeadlineDays} days`} />
        </SummaryCard>
        <SummaryCard title="Notifications">
          <Row k="Captain reminders" v={state.notifications.captainReminders ? "On" : "Off"} />
          <Row k="Deadline reminders" v={state.notifications.deadlineReminders ? "On" : "Off"} />
          <Row
            k="Weekly digest"
            v={state.notifications.weeklyDigest ? `Every ${state.notifications.digestFrequencyDays}d` : "Off"}
          />
        </SummaryCard>
        {isDoubles && (
          <SummaryCard title="Teams">
            {state.doublesTeams.map((t, i) => (
              <Row
                key={i}
                k={t.name}
                v={`${pool[t.playerAIdx ?? 0] ?? "?"} & ${pool[t.playerBIdx ?? 0] ?? "?"}`}
              />
            ))}
          </SummaryCard>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Surface level={1} className="space-y-2">
      <h4 className="text-ui-title mb-2">{title}</h4>
      {children}
    </Surface>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-meta">{k}</span>
      <span className="text-right font-semibold text-foreground">{v}</span>
    </div>
  );
}
