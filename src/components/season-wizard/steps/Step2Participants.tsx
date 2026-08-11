import { Plus, Trash2, Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ParticipantInput, WizardState } from "../hooks/useWizardState";
import {
  singlesMatchCount,
  doublesMatchCount,
  roundCount,
  estimatedWeeks,
  weeksBetween,
  recommendedSeasonLength,
} from "../lib/wizardEstimates";
import { Surface, StatBlock } from "@/components/ui-system";

interface Props {
  state: WizardState;
  creatorName: string;
  setParticipants: (p: ParticipantInput[]) => void;
}

export default function Step2Participants({ state, creatorName, setParticipants }: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const valid = state.participants.filter((p) => p.display_name.trim());
  const totalPlayers = valid.length + 1; // creator
  const isDoubles = state.basics.format === "doubles";
  const matches = isDoubles
    ? doublesMatchCount(Math.floor(totalPlayers / 2))
    : singlesMatchCount(totalPlayers);
  const rounds = roundCount(isDoubles ? Math.floor(totalPlayers / 2) : totalPlayers);
  const recWeeks = estimatedWeeks(matches, 3);
  const planWeeks = weeksBetween(state.basics.startDate, state.basics.endDate);
  const rec = recommendedSeasonLength(isDoubles ? Math.floor(totalPlayers / 2) : totalPlayers);
  const planTooShort = planWeeks > 0 && recWeeks > 0 && planWeeks < recWeeks;

  const addRow = () =>
    setParticipants([...state.participants, { display_name: "", email: "" }]);
  const removeRow = (i: number) =>
    setParticipants(state.participants.filter((_, idx) => idx !== i));
  const updateRow = (i: number, k: keyof ParticipantInput, v: string) =>
    setParticipants(state.participants.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const copyInviteLink = async () => {
    // Placeholder: real invite links are per-participant after season creation.
    // For now offer the season-join URL prefix so creators can prep messaging.
    const txt = `${window.location.origin}/join/{token-after-launch}`;
    try {
      await navigator.clipboard.writeText(txt);
      setLinkCopied(true);
      toast({ title: "Template copied", description: "Real invite links generate after launch." });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <Surface level={1} padded="lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-ui-title">Players</h2>
            <p className="text-meta mt-0.5">
              You're auto-added as a player. Add at least 1 more.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="btn-secondary"
          >
            <Plus size={14} aria-hidden /> Add player
          </button>
        </div>

        <div className="space-y-2">
          {state.participants.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input
                placeholder="Name"
                value={p.display_name}
                onChange={(e) => updateRow(i, "display_name", e.target.value)}
                maxLength={60}
                className="field flex-1"
              />
              <input
                type="email"
                placeholder="email@example.com (optional)"
                value={p.email}
                onChange={(e) => updateRow(i, "email", e.target.value)}
                maxLength={120}
                className="field flex-1"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="icon-btn hover:border-destructive/40 hover:text-destructive"
                aria-label="Remove player"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={copyInviteLink}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {linkCopied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          Copy invite link template
        </button>
      </Surface>

      {/* Live roster */}
      <Surface level={1} padded="lg">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-ui-title">Participants: {totalPlayers}</h3>
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 text-sm">
            <Check size={14} className="text-primary" aria-hidden />
            <span>{creatorName}</span>
            <span className="text-meta">(you)</span>
          </li>
          {valid.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-primary" aria-hidden />
              <span>{p.display_name}</span>
            </li>
          ))}
        </ul>
      </Surface>

      {/* Round Robin Impact */}
      <Surface level={1} padded="lg" className="border-primary/30">
        <div className="text-eyebrow mb-3 text-primary">
          Round-Robin Impact
        </div>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatBlock label="Matches" value={matches} />
          <StatBlock label="Rounds" value={rounds} />
          <StatBlock label="Est. weeks" value={recWeeks || "—"} />
        </div>
        <p className="text-meta">
          Recommended: <span className="font-semibold text-foreground">{rec.minWeeks}–{rec.maxWeeks} weeks</span>.
          Your plan: <span className="font-semibold text-foreground">{planWeeks || "—"} weeks</span>.
        </p>
        {planTooShort && (
          <p className="mt-2 text-xs text-destructive">
            Your season window may be too short to comfortably fit {matches} matches. Consider extending the end date.
          </p>
        )}
      </Surface>
    </div>
  );
}
