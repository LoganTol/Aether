import { ArrowDown, ArrowUp } from "lucide-react";
import {
  DisputeResolution,
  ForfeitHandling,
  RotationMode,
  ScoreFormat,
  Visibility,
  WizardState,
} from "../hooks/useWizardState";
import { Surface } from "@/components/ui-system";

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

      <Surface level={1} padded="lg" className="space-y-4">
        <h3 className="text-ui-title">Captain rotation</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-meta">{o.desc}</div>
              </button>
            );
          })}
        </div>

        {state.rules.rotationMode === "manual" && state.rules.manualOrder.length === pool.length && (
          <div className="space-y-1 rounded-xl border border-border p-3">
            {state.rules.manualOrder.map((poolIdx, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--surface-1))] px-2 py-1.5"
              >
                <div className="text-sm">
                  <span className="text-meta mr-2">{i + 1}.</span>
                  {pool[poolIdx]}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="icon-btn h-7 w-7 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === state.rules.manualOrder.length - 1}
                    className="icon-btn h-7 w-7 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
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
    <Surface level={1} padded="lg" className="space-y-3">
      <h3 className="text-ui-title">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`rounded-xl border p-3 text-left transition-all ${
                active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-semibold">{o.label}</div>
              <div className="text-meta">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </Surface>
  );
}
