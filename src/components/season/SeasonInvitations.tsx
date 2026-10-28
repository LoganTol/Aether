import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateInvitePlayers, type InvitePlayer } from "@/components/season-wizard/lib/creationV2";
type Invite = {
  id: string;
  token: string;
  recipient_email: string | null;
  recipient_name: string | null;
  status: string;
  expires_at: string;
};
export default function SeasonInvitations({
  seasonId,
  onChange,
  locked = false,
}: {
  seasonId: string;
  onChange?: () => void;
  locked?: boolean;
}) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [players, setPlayers] = useState<InvitePlayer[]>([{ name: "", email: "" }]);
  const [busy, setBusy] = useState(false);
  const updatePlayer = (index: number, field: keyof InvitePlayer, value: string) =>
    setPlayers((rows) => rows.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("season_invites")
      .select("id,token,recipient_email,recipient_name,status,expires_at")
      .eq("season_id", seasonId)
      .order("created_at");
    if (error) toast({ title: error.message, variant: "destructive" });
    else setInvites(data || []);
  }, [seasonId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join/${token}`);
      toast({ title: "Invitation copied" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };
  const shared = invites.find(
    (i) => !i.recipient_email && i.status === "pending" && new Date(i.expires_at) > new Date(),
  );
  const share = async () => {
    if (shared) {
      await copy(shared.token);
      return;
    }
    const { data, error } = await supabase.rpc("manage_season_invite_v2", { _season: seasonId });
    if (error) toast({ title: error.message, variant: "destructive" });
    else if (data) {
      await copy(data);
      refresh();
    }
  };
  const prepare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const list = validateInvitePlayers(players);
      if (!list.length) throw new Error("Enter at least one player name and email.");
      const { error } = await supabase.rpc("prepare_named_season_invites_v2", {
        _season: seasonId,
        _players: list.map((p) => ({ name: p.name, email: p.email })),
      });
      if (error) throw error;
      setPlayers([{ name: "", email: "" }]);
      toast({
        title: "Invitations prepared",
        description: "Copy personal links below. Email sending awaits sender-domain setup.",
      });
      await refresh();
      onChange?.();
    } catch (e) {
      toast({ title: (e as { message: string }).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (id: string) => {
    const { error } = await supabase.rpc("manage_season_invite_v2", { _season: seasonId, _revoke: id });
    if (error) toast({ title: error.message, variant: "destructive" });
    else refresh();
  };
  return (
    <section className="space-y-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ui-title">{locked ? "Roster Invitations" : "Invite Players"}</h2>
        <Button variant="outline" disabled={locked && !shared} onClick={share}>
          <Copy />
          Copy season link
        </Button>
      </div>
      {!locked && (
        <>
          <h3 className="text-sm font-medium">Email invitations</h3>
          <div className="space-y-4">
            {players.map((player, i) => (
              <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="min-w-0">
                  <label htmlFor={`overview-player-name-${i}`} className="mb-2 block text-sm font-medium">
                    Player name
                  </label>
                  <input
                    id={`overview-player-name-${i}`}
                    className="field"
                    placeholder="First and last name"
                    value={player.name}
                    maxLength={60}
                    disabled={busy}
                    onChange={(e) => updatePlayer(i, "name", e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor={`overview-player-email-${i}`} className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id={`overview-player-email-${i}`}
                    type="email"
                    className="field"
                    placeholder="alex@example.com"
                    value={player.email}
                    maxLength={254}
                    disabled={busy}
                    onChange={(e) => updatePlayer(i, "email", e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  aria-label={`Remove player ${i + 1}`}
                  onClick={() => setPlayers((rows) => rows.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setPlayers((rows) => [...rows, { name: "", email: "" }])}
            >
              <Plus />
              Add player
            </Button>
          </div>
          <Button onClick={prepare} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}Send Invitations
          </Button>
        </>
      )}
      <p className="text-meta">Personal invitation links expire after 30 days. Email delivery awaits sender setup.</p>
      <ul className="divide-y divide-border">
        {invites.map((i) => {
          const state = i.status === "pending" && new Date(i.expires_at) <= new Date() ? "expired" : i.status;
          return (
            <li key={i.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                {i.recipient_name && <p className="break-words text-sm font-medium">{i.recipient_name}</p>}
                <p className="break-all text-sm">{i.recipient_email || "Shared season link"}</p>
                <p className="text-meta capitalize">{state}</p>
              </div>
              {state === "pending" && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Copy invitation for ${i.recipient_email || "season"}`}
                    onClick={() => copy(i.token)}
                  >
                    <Copy />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Revoke invitation" onClick={() => revoke(i.id)}>
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
