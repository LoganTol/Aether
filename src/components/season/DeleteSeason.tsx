import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteSeason({ seasonId, seasonName }: { seasonId: string; seasonName: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("delete_season_v2", { _season: seasonId });
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Season deleted" });
    navigate("/app");
  };
  return (
    <section className="mt-10 max-w-2xl space-y-3 rounded-lg border border-destructive/40 p-5">
      <h3 className="text-ui-title">Delete Season</h3>
      <p className="text-body">Permanently removes this season, its players, matches and scores. This can't be undone.</p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy}>Delete Season</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{seasonName}"?</AlertDialogTitle>
            <AlertDialogDescription>All players, matches and scores in this season will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Season</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
