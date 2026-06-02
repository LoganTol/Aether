import { ArrowDown, ArrowUp } from "lucide-react";
import {
  DisputeResolution,
  ForfeitHandling,
  RotationMode,
  ScoreFormat,
  Visibility,
  WizardState,
} from "../hooks/useWizardState";

interface Props {
  state: WizardState;
  creatorName: string;
  patchRules: (p: Partial<WizardState["rules"]>) => void;
}

const scoreOptions: { v: ScoreFormat; label: string; desc: string }[] = [
  { v: "best_of_3", label: "Best of 3 sets", desc: "Standard format" },
  { v: "pro_set_8", label: "Pro set to 8", desc: "Faster, single set to 8 games" },
  { v: "single_set_6", label: "Single set to 6", desc: "Quickest, one set to 6" },
];

const disputeOptions: { v: DisputeResolution; label: string; desc: string }[] = [
  { v: "creator_decides", label: "Commissioner decides", desc: "You resolve disputes" },
  { v: "majority_vote", label: "Majority vote", desc: "Players vote to resolve" },
];

const forfeitOptions: { v: ForfeitHandling; label: string; desc: string }[] = [
  { v: "manual_review", label: "Manual review", desc: "You decide after the deadline" },
  { v: "auto_loss", label: "Auto-loss", desc: "Overdue captain forfeits the match" },
];

const visibilityOptions: { v: Visibility; label: string; desc: string }[] = [
  { v: "invite_only", label: "Invite only", desc: "Anyone with the link can join" },
  { v: "private", label: "Private", desc: "Only members you add can see it" },
];

const rotationOptions: { v: RotationMode; label: string; desc: string }[] = [
  { v: "invite_order", label: "Invite order", desc: "Captain rotates in the order players were added" },
  { v: "alphabetical", label: "Alphabetical", desc: "Rotate A → Z by player name" },
  { v: "random", label: "Random", desc: "Shuffle the rotation order" },
  { v: "manual", label: "Manual", desc: "Drag-order players yourself" },
];

export default function Step5RulesAndRotation({ state, creatorName, patchRules }: Props) {
  const valid = state.participants.filter((p) => p.display_name.trim());
  const pool = [creatorName, ...valid.map((p) => p.display_name)];

  // initialize manual order if entering manual mode
  const ensureManualOrder = () => {
    if (state.rules.manualOrder.length !== pool.length) {
      patchRules({ manualOrder: pool.map((_, i) => i) });
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const order = [...state.rules.manualOrder];
    const next = idx + dir;
    if (next < 0 || next >= order.length) return;
    [order[idx], order[next]] = [order[next], order[idx]];
    patchRules({ manualOrder: order });
  };

  return (
    <div className="space-y-5">
      <RadioCard
        title="Score format"
        options={scoreOptions}
        value={state.rules.scoreFormat}
        onChange={(v) => patchRules({ scoreFormat: v })}
      />
      <RadioCard
        title="Dispute resolution"
        options={disputeOptions}
        value={state.rules.disputeResolution}
        onChange={(v) => patchRules({ disputeResolution: v })}
      />
      <RadioCard
        title="Forfeit handling"
        options={forfeitOptions}
        value={state.rules.forfeitHandling}
        onChange={(v) => patchRules({ forfeitHandling: v })}
      />
      <RadioCard
        title="Season visibility"
        options={visibilityOptions}
        value={state.rules.visibility}
        onChange={(v) => patchRules({ visibility: v })}
      />

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold">Captain rotation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rotationOptions.map((o) => {
            const active = state.rules.rotationMode === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => {
                  patchRules({ rotationMode: o.v });
                  if (o.v === "manual") setTimeout(ensureManualOrder, 0);
                }}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-semibold text-sm">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </button>
            );
          })}
        </div>

        {state.rules.rotationMode === "manual" && state.rules.manualOrder.length === pool.length && (
          <div className="border border-border rounded-xl p-3 space-y-1">
            {state.rules.manualOrder.map((poolIdx, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-black/30"
              >
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground mr-2">{i + 1}.</span>
                  {pool[poolIdx]}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:border-primary/50"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === state.rules.manualOrder.length - 1}
                    className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:border-primary/50"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RadioCard<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { v: T; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="glass-card p-6 space-y-3">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`text-left p-3 rounded-xl border transition-all ${
                active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold text-sm">{o.label}</div>
              <div className="text-xs text-muted-foreground">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}