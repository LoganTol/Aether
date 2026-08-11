import { useEffect } from "react";
import { DoublesTeamInput, WizardState } from "../hooks/useWizardState";
import { Surface } from "@/components/ui-system";

interface Props {
  state: WizardState;
  creatorName: string;
  setTeams: (teams: DoublesTeamInput[]) => void;
}

export default function Step4DoublesTeams({ state, creatorName, setTeams }: Props) {
  // Build pool: 0 = creator, 1..n = participants index+1
  const valid = state.participants.filter((p) => p.display_name.trim());
  const pool = [creatorName, ...valid.map((p) => p.display_name)];
  const expectedTeams = Math.floor(pool.length / 2);

  useEffect(() => {
    if (state.doublesTeams.length !== expectedTeams) {
      const defaults: DoublesTeamInput[] = Array.from({ length: expectedTeams }, (_, i) => ({
        name: `Team ${i + 1}`,
        playerAIdx: null,
        playerBIdx: null,
      }));
      setTeams(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedTeams]);

  const used = new Set<number>();
  state.doublesTeams.forEach((t) => {
    if (t.playerAIdx !== null) used.add(t.playerAIdx);
    if (t.playerBIdx !== null) used.add(t.playerBIdx);
  });

  const update = (i: number, patch: Partial<DoublesTeamInput>) => {
    setTeams(state.doublesTeams.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  const optionAvailable = (currentIdx: number | null, slotIdx: number) =>
    Array.from({ length: pool.length }, (_, i) => i).filter(
      (i) => i === currentIdx || !used.has(i)
    );

  return (
    <div className="space-y-5">
      <Surface level={1} padded="lg">
        <h2 className="text-ui-title mb-1">Assign doubles teams</h2>
        <p className="text-meta">
          {pool.length} players → {expectedTeams} fixed teams. Each player must be on exactly one team.
        </p>
      </Surface>

      <div className="space-y-3">
        {state.doublesTeams.map((t, i) => (
          <Surface key={i} level={1} className="space-y-3">
            <input
              value={t.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder={`Team ${i + 1}`}
              maxLength={40}
              className="field font-semibold"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PlayerSelect
                pool={pool}
                value={t.playerAIdx}
                available={optionAvailable(t.playerAIdx, i)}
                onChange={(v) => update(i, { playerAIdx: v })}
                label="Player A"
              />
              <PlayerSelect
                pool={pool}
                value={t.playerBIdx}
                available={optionAvailable(t.playerBIdx, i)}
                onChange={(v) => update(i, { playerBIdx: v })}
                label="Player B"
              />
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function PlayerSelect({
  pool,
  value,
  available,
  onChange,
  label,
}: {
  pool: string[];
  value: number | null;
  available: number[];
  onChange: (v: number | null) => void;
  label: string;
}) {
  return (
    <div>
      <label className="text-eyebrow mb-1.5 block">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
        className="field"
      >
        <option value="">— select —</option>
        {available.map((i) => (
          <option key={i} value={i}>
            {pool[i]}
          </option>
        ))}
      </select>
    </div>
  );
}
