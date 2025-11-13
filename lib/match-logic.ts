import { supabase } from "./supabase";
import type { Match, MatchAction, RollPreference } from "@/types";

const TIMER_DURATION = 60; // seconds

export async function processMatchAction(
  matchId: string,
  actionType: "roll" | "ban" | "pick" | "preference",
  team: "red" | "blue",
  preference?: RollPreference
) {
  // Get current match state
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) return;

  const typedMatch = match as unknown as Match;

  // Get all actions
  const { data: actions } = await supabase
    .from("match_actions")
    .select("*")
    .eq("match_id", matchId)
    .order("order_index", { ascending: true });

  const typedActions = (actions || []) as unknown as MatchAction[];

  // Get stage info
  const { data: stage } = await supabase
    .from("stages")
    .select("best_of, num_bans")
    .eq("id", typedMatch.stage_id)
    .single();

  if (!stage) return;

  const numBans = (stage as { num_bans: number }).num_bans;
  const numPicks = (stage as { best_of: number }).best_of - 1; // Don't count tiebreaker

  // Determine next state
  const rolls = typedActions.filter((a) => a.action_type === "roll");
  const bans = typedActions.filter((a) => a.action_type === "ban");
  const picks = typedActions.filter((a) => a.action_type === "pick");

  let newStatus = typedMatch.status;
  let newCurrentTeam = typedMatch.current_team;
  let rollWinner = typedMatch.roll_winner;
  let timerEndsAt = null;

  // Handle roll phase
  if (actionType === "roll") {
    if (rolls.length === 2) {
      // Both teams rolled, determine winner
      const redRoll = typedMatch.team_red_roll || 0;
      const blueRoll = typedMatch.team_blue_roll || 0;

      if (redRoll > blueRoll) {
        rollWinner = "red";
      } else if (blueRoll > redRoll) {
        rollWinner = "blue";
      } else {
        // Tie - need re-roll (shouldn't happen with 1-100 range but handle it)
        await supabase
          .from("matches")
          .update({
            team_red_roll: null,
            team_blue_roll: null,
            status: "rolling",
            current_team: null,
            timer_ends_at: null,
          } as never)
          .eq("id", matchId);

        // Delete roll actions to restart
        await supabase
          .from("match_actions")
          .delete()
          .eq("match_id", matchId)
          .eq("action_type", "roll");

        return;
      }

      // Move to preference selection phase
      newStatus = "preference_selection";
      newCurrentTeam = rollWinner;
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    }
  }

  // Handle preference selection phase
  if (actionType === "preference") {
    if (!preference) return;

    // Determine pick/ban order based on preference
    let firstBanTeam: "red" | "blue";
    let firstPickTeam: "red" | "blue";

    if (preference === "first_ban") {
      firstBanTeam = team;
      firstPickTeam = team === "red" ? "blue" : "red";
    } else if (preference === "second_ban") {
      firstBanTeam = team === "red" ? "blue" : "red";
      firstPickTeam = team;
    } else if (preference === "first_pick") {
      firstPickTeam = team;
      firstBanTeam = team === "red" ? "blue" : "red";
    } else {
      // second_pick
      firstPickTeam = team === "red" ? "blue" : "red";
      firstBanTeam = team;
    }

    // Start ban phase if there are bans, otherwise go to picking
    if (numBans > 0) {
      newStatus = "banning";
      newCurrentTeam = firstBanTeam;
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    } else {
      // No bans, go straight to picking
      newStatus = "picking";
      newCurrentTeam = firstPickTeam;
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    }

    // Store the preference and pick order for later reference
    await supabase
      .from("matches")
      .update({
        roll_winner_preference: preference,
      } as never)
      .eq("id", matchId);
  }

  // Handle ban phase
  if (actionType === "ban") {
    const totalBansNeeded = numBans * 2; // Both teams ban

    if (bans.length >= totalBansNeeded) {
      // Ban phase complete, start picking
      newStatus = "picking";
      newCurrentTeam = rollWinner;
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    } else {
      // Continue banning, alternate teams
      newCurrentTeam = team === "red" ? "blue" : "red";
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    }
  }

  // Handle pick phase
  if (actionType === "pick") {
    if (picks.length >= numPicks) {
      // All picks done
      newStatus = "completed";
      newCurrentTeam = null;
      timerEndsAt = null;
    } else {
      // Continue picking, alternate teams
      newCurrentTeam = team === "red" ? "blue" : "red";
      timerEndsAt = new Date(Date.now() + TIMER_DURATION * 1000).toISOString();
    }
  }

  // Update match state
  const updateData: {
    status: typeof newStatus;
    current_team: typeof newCurrentTeam;
    timer_ends_at: string | null;
    roll_winner?: typeof rollWinner;
  } = {
    status: newStatus,
    current_team: newCurrentTeam,
    timer_ends_at: timerEndsAt,
  };

  if (rollWinner !== typedMatch.roll_winner) {
    updateData.roll_winner = rollWinner;
  }

  await supabase
    .from("matches")
    .update(updateData as never)
    .eq("id", matchId);
}

export async function startMatch(matchId: string) {
  // Initialize match to rolling status
  await supabase
    .from("matches")
    .update({
      status: "rolling",
      current_team: null,
      timer_ends_at: null,
    } as never)
    .eq("id", matchId);
}
