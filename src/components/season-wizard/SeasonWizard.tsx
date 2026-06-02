import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import WizardShell from "./WizardShell";
import Step1Basics from "./steps/Step1Basics";
import Step2Participants from "./steps/Step2Participants";
import Step3FormatReview from "./steps/Step3FormatReview";
import Step4DoublesTeams from "./steps/Step4DoublesTeams";
import Step5RulesAndRotation from "./steps/Step5RulesAndRotation";
import Step6Notifications from "./steps/Step6Notifications";
import Step7ReviewLaunch from "./steps/Step7ReviewLaunch";
import { useWizardState, validateStep } from "./hooks/useWizardState";

const STEP_LABELS = [
  "Basics",
  "Participants",
  "Review",
  "Teams",
  "Rules",
  "Notifications",
  "Launch",
];

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Season basics", subtitle: "Name it, pick a format, set the dates." },
  2: { title: "Add your players", subtitle: "Invite by email — you can also share a link." },
  3: { title: "Format review", subtitle: "Confirm the season shape before the next steps." },
  4: { title: "Doubles teams", subtitle: "Pair players into fixed teams." },
  5: { title: "Rules & rotation", subtitle: "How matches score and how the captain rotates." },
  6: { title: "Notifications", subtitle: "Choose what reminders go out." },
  7: { title: "Review & launch", subtitle: "One last look before the season goes live." },
};

export default function SeasonWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useWizardState();
  const [launching, setLaunching] = useState(false);

  const creatorName =
    (user?.user_metadata as { display_name?: string; full_name?: string } | null)?.display_name ||
    (user?.user_metadata as { display_name?: string; full_name?: string } | null)?.full_name ||
    user?.email?.split("@")[0] ||
    "Host";

  const isDoubles = state.basics.format === "doubles";

  const goNext = () => {
    const err = validateStep(state, state.step);
    if (err) {
      toast({ title: "Hold on", description: err, variant: "destructive" });
      return;
    }
    // skip step 4 if not doubles
    if (state.step === 3 && !isDoubles) {
      dispatch({ type: "SET_STEP", step: 5 });
      return;
    }
    dispatch({ type: "NEXT" });
  };

  const goBack = () => {
    if (state.step === 5 && !isDoubles) {
      dispatch({ type: "SET_STEP", step: 3 });
      return;
    }
    dispatch({ type: "PREV" });
  };

  const launch = async () => {
    if (!user) return;
    // final validation pass
    for (const s of [1, 2, 4]) {
      const err = validateStep(state, s);
      if (err) {
        toast({ title: "Fix step " + s, description: err, variant: "destructive" });
        dispatch({ type: "SET_STEP", step: s });
        return;
      }
    }

    setLaunching(true);
    try {
      // 1. Season
      const { data: season, error: sErr } = await supabase
        .from("seasons")
        .insert({
          creator_id: user.id,
          name: state.basics.name.trim(),
          format: state.basics.format,
          start_date: state.basics.startDate,
          end_date: state.basics.endDate,
          status: "active",
          visibility: state.rules.visibility,
          lifecycle_status: "active",
        })
        .select()
        .single();
      if (sErr) throw sErr;

      // 2. Settings
      const { error: setErr } = await supabase.from("season_settings").insert({
        season_id: season.id,
        captain_window_days: state.basics.captainWindowDays,
        match_deadline_days: state.basics.matchDeadlineDays,
        score_format: state.rules.scoreFormat,
        dispute_resolution: state.rules.disputeResolution,
        forfeit_handling: state.rules.forfeitHandling,
        captain_rotation_mode: state.rules.rotationMode,
        captain_reminders: state.notifications.captainReminders,
        deadline_reminders: state.notifications.deadlineReminders,
        weekly_digest: state.notifications.weeklyDigest,
        digest_frequency_days: state.notifications.digestFrequencyDays,
      });
      if (setErr) throw setErr;

      // 3. Participants (creator first, then invitees)
      const valid = state.participants.filter((p) => p.display_name.trim());
      const rows = [
        {
          season_id: season.id,
          display_name: creatorName,
          invited_email: user.email || null,
          user_id: user.id,
          status: "active" as const,
          joined_at: new Date().toISOString(),
        },
        ...valid.map((p) => ({
          season_id: season.id,
          display_name: p.display_name.trim(),
          invited_email: p.email.trim() || null,
          user_id: null,
          status: "invited" as const,
          joined_at: null,
        })),
      ];
      const { data: insertedParticipants, error: pErr } = await supabase
        .from("season_participants")
        .insert(rows)
        .select();
      if (pErr) throw pErr;

      // 4. Doubles teams (map wizard indexes -> participant ids)
      if (isDoubles && insertedParticipants) {
        const teamRows = state.doublesTeams
          .filter((t) => t.playerAIdx !== null && t.playerBIdx !== null)
          .map((t) => ({
            season_id: season.id,
            name: t.name.trim() || "Team",
            player_a_id: insertedParticipants[t.playerAIdx as number].id,
            player_b_id: insertedParticipants[t.playerBIdx as number].id,
          }));
        if (teamRows.length) {
          const { error: tErr } = await supabase.from("doubles_teams").insert(teamRows);
          if (tErr) throw tErr;
        }
      }

      // 5. Generate fixtures
      const { error: fErr } = await supabase.functions.invoke("generate-fixtures", {
        body: { season_id: season.id },
      });
      if (fErr) throw fErr;

      toast({ title: "Season launched", description: "Schedule generated." });
      navigate(`/app/seasons/${season.id}/launched`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not launch season";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  const meta = STEP_TITLES[state.step];

  return (
    <WizardShell
      step={state.step}
      totalSteps={7}
      title={meta.title}
      subtitle={meta.subtitle}
      stepLabels={STEP_LABELS}
      onBack={goBack}
      onNext={goNext}
      onLaunch={launch}
      launching={launching}
    >
      {state.step === 1 && (
        <Step1Basics
          state={state}
          patch={(p) => dispatch({ type: "PATCH_BASICS", patch: p })}
        />
      )}
      {state.step === 2 && (
        <Step2Participants
          state={state}
          creatorName={creatorName}
          setParticipants={(p) => dispatch({ type: "SET_PARTICIPANTS", participants: p })}
        />
      )}
      {state.step === 3 && <Step3FormatReview state={state} creatorName={creatorName} />}
      {state.step === 4 && isDoubles && (
        <Step4DoublesTeams
          state={state}
          creatorName={creatorName}
          setTeams={(t) => dispatch({ type: "SET_DOUBLES_TEAMS", teams: t })}
        />
      )}
      {state.step === 5 && (
        <Step5RulesAndRotation
          state={state}
          creatorName={creatorName}
          patchRules={(p) => dispatch({ type: "PATCH_RULES", patch: p })}
        />
      )}
      {state.step === 6 && (
        <Step6Notifications
          state={state}
          patch={(p) => dispatch({ type: "PATCH_NOTIFICATIONS", patch: p })}
        />
      )}
      {state.step === 7 && <Step7ReviewLaunch state={state} creatorName={creatorName} />}
    </WizardShell>
  );
}