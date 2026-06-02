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
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Players</h2>
            <p className="text-xs text-muted-foreground">
              You're auto-added as a player. Add at least 1 more.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:border-primary/50"
          >
            <Plus size={14} /> Add player
          </button>
        </div>

        <div className="space-y-2">
          {state.participants.map((p, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="Name"
                value={p.display_name}
                onChange={(e) => updateRow(i, "display_name", e.target.value)}
                maxLength={60}
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-sm"
              />
              <input
                type="email"
                placeholder="email@example.com (optional)"
                value={p.email}
                onChange={(e) => updateRow(i, "email", e.target.value)}
                maxLength={120}
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive"
                aria-label="Remove player"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={copyInviteLink}
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {linkCopied ? <Check size={14} /> : <Copy size={14} />}
          Copy invite link template
        </button>
      </div>

      {/* Live roster */}
      <div className="glass-card p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-bold">Participants: {totalPlayers}</h3>
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 text-sm">
            <Check size={14} className="text-primary" />
            <span>{creatorName}</span>
            <span className="text-xs text-muted-foreground">(you)</span>
          </li>
          {valid.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-primary" />
              <span>{p.display_name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Round Robin Impact */}
      <div className="glass-card p-6 border-primary/30">
        <div className="text-xs font-semibold tracking-wide uppercase text-primary mb-3">
          Round-Robin Impact
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-2xl md:text-3xl font-bold">{matches}</div>
            <div className="text-xs text-muted-foreground">Matches</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold">{rounds}</div>
            <div className="text-xs text-muted-foreground">Rounds</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold">{recWeeks || "—"}</div>
            <div className="text-xs text-muted-foreground">Est. weeks</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: <span className="text-foreground font-semibold">{rec.minWeeks}–{rec.maxWeeks} weeks</span>.
          Your plan: <span className="text-foreground font-semibold">{planWeeks || "—"} weeks</span>.
        </p>
        {planTooShort && (
          <p className="text-xs text-destructive mt-2">
            Your season window may be too short to comfortably fit {matches} matches. Consider extending the end date.
          </p>
        )}
      </div>
    </div>
  );
}