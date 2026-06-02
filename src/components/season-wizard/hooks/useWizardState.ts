import { useReducer } from "react";

export type Format = "singles" | "doubles";
export type ScoreFormat = "best_of_3" | "pro_set_8" | "single_set_6";
export type DisputeResolution = "creator_decides" | "majority_vote";
export type ForfeitHandling = "auto_loss" | "manual_review";
export type Visibility = "private" | "invite_only";
export type RotationMode = "random" | "invite_order" | "alphabetical" | "manual";

export interface ParticipantInput {
  display_name: string;
  email: string;
}

export interface DoublesTeamInput {
  name: string;
  playerAIdx: number | null;
  playerBIdx: number | null;
}

export interface WizardState {
  step: number;
  basics: {
    name: string;
    format: Format;
    startDate: string;
    endDate: string;
    captainWindowDays: number;
    matchDeadlineDays: number;
  };
  participants: ParticipantInput[];
  doublesTeams: DoublesTeamInput[];
  rules: {
    scoreFormat: ScoreFormat;
    disputeResolution: DisputeResolution;
    forfeitHandling: ForfeitHandling;
    visibility: Visibility;
    rotationMode: RotationMode;
    manualOrder: number[]; // indexes into all-participants (creator at 0)
  };
  notifications: {
    captainReminders: boolean;
    deadlineReminders: boolean;
    weeklyDigest: boolean;
    digestFrequencyDays: number;
  };
}

type Action =
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PATCH_BASICS"; patch: Partial<WizardState["basics"]> }
  | { type: "SET_PARTICIPANTS"; participants: ParticipantInput[] }
  | { type: "SET_DOUBLES_TEAMS"; teams: DoublesTeamInput[] }
  | { type: "PATCH_RULES"; patch: Partial<WizardState["rules"]> }
  | { type: "PATCH_NOTIFICATIONS"; patch: Partial<WizardState["notifications"]> };

const today = new Date().toISOString().slice(0, 10);
const eightWeeksOut = new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10);

const initial: WizardState = {
  step: 1,
  basics: {
    name: "",
    format: "singles",
    startDate: today,
    endDate: eightWeeksOut,
    captainWindowDays: 7,
    matchDeadlineDays: 14,
  },
  participants: [
    { display_name: "", email: "" },
    { display_name: "", email: "" },
    { display_name: "", email: "" },
  ],
  doublesTeams: [],
  rules: {
    scoreFormat: "best_of_3",
    disputeResolution: "creator_decides",
    forfeitHandling: "manual_review",
    visibility: "invite_only",
    rotationMode: "invite_order",
    manualOrder: [],
  },
  notifications: {
    captainReminders: true,
    deadlineReminders: true,
    weeklyDigest: true,
    digestFrequencyDays: 7,
  },
};

function reducer(s: WizardState, a: Action): WizardState {
  switch (a.type) {
    case "SET_STEP":
      return { ...s, step: Math.max(1, Math.min(7, a.step)) };
    case "NEXT":
      return { ...s, step: Math.min(7, s.step + 1) };
    case "PREV":
      return { ...s, step: Math.max(1, s.step - 1) };
    case "PATCH_BASICS":
      return { ...s, basics: { ...s.basics, ...a.patch } };
    case "SET_PARTICIPANTS":
      return { ...s, participants: a.participants };
    case "SET_DOUBLES_TEAMS":
      return { ...s, doublesTeams: a.teams };
    case "PATCH_RULES":
      return { ...s, rules: { ...s.rules, ...a.patch } };
    case "PATCH_NOTIFICATIONS":
      return { ...s, notifications: { ...s.notifications, ...a.patch } };
    default:
      return s;
  }
}

export function useWizardState() {
  return useReducer(reducer, initial);
}

export function validateStep(state: WizardState, step: number): string | null {
  if (step === 1) {
    if (!state.basics.name.trim()) return "Give your season a name.";
    if (!state.basics.startDate || !state.basics.endDate) return "Pick start and end dates.";
    if (new Date(state.basics.endDate) <= new Date(state.basics.startDate))
      return "End date must be after start date.";
    return null;
  }
  if (step === 2) {
    const valid = state.participants.filter((p) => p.display_name.trim()).length;
    if (valid < 1) return "Add at least 1 more player.";
    const total = valid + 1; // creator
    if (state.basics.format === "doubles" && total % 2 !== 0)
      return "Doubles needs an even number of players.";
    return null;
  }
  if (step === 4 && state.basics.format === "doubles") {
    const totalPlayers = state.participants.filter((p) => p.display_name.trim()).length + 1;
    const expectedTeams = totalPlayers / 2;
    if (state.doublesTeams.length !== expectedTeams) return "Create the right number of teams.";
    const used = new Set<number>();
    for (const t of state.doublesTeams) {
      if (t.playerAIdx === null || t.playerBIdx === null) return "Every team needs two players.";
      if (t.playerAIdx === t.playerBIdx) return "A player can't be on both sides of a team.";
      if (used.has(t.playerAIdx) || used.has(t.playerBIdx))
        return "Each player can only be on one team.";
      used.add(t.playerAIdx);
      used.add(t.playerBIdx);
    }
    return null;
  }
  return null;
}