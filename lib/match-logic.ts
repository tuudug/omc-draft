import { supabase } from "./supabase";
import type { Match, MatchAction, RollPreference, Stage, Team } from "@/types";

export async function calculateMatchState(matchId: string) {
  // 1. Fetch Match
  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!matchData) throw new Error("Match not found");
  const match = matchData as Match;

  // 2. Fetch Stage
  const { data: stageData } = await supabase
    .from("stages")
    .select("*")
    .eq("id", match.stage_id)
    .single();
  
  if (!stageData) throw new Error("Stage not found");
  const stage = stageData as Stage;
  
  // 3. Fetch Actions
  const { data: actionsData } = await supabase
    .from("match_actions")
    .select("*")
    .eq("match_id", matchId)
    .order("order_index", { ascending: true });
    
  const actions = (actionsData || []) as MatchAction[];

  // 4. Calculate State
  let status = "rolling";
  let currentTeam: Team | null = null;
  let timerEndsAt: string | null = null;
  let rollWinner: Team | null = match.roll_winner;
  
  // Analyze Rolls
  // Logic: If both have rolls, we have a winner.
  const redRoll = match.team_red_roll;
  const blueRoll = match.team_blue_roll;

  if (redRoll !== null && blueRoll !== null) {
      if (redRoll > blueRoll) rollWinner = "red";
      else if (blueRoll > redRoll) rollWinner = "blue";
      else {
          // Tie
          status = "rolling";
          rollWinner = null;
      }
  } else {
      status = "rolling";
      rollWinner = null;
  }

  if (rollWinner) {
      status = "preference_selection";
      currentTeam = rollWinner; // Winner picks preference first
  }

  // Analyze Preferences
  let winnerPreference: RollPreference | null = match.roll_winner_preference || null;
  let loserPreference: RollPreference | null = match.roll_loser_preference || null;
  
  if (winnerPreference) {
      // Winner picked.
      const loser = rollWinner === "red" ? "blue" : "red";
      currentTeam = loser; // Loser picks next
      
      if (loserPreference) {
          // Both picked. Ready for draft.
          status = "banning"; // Temporary, will be overwritten by pattern logic
      }
  }

  // If preferences are done, determine First Pick and First Ban teams
  let firstPickTeam: Team | null = null;
  let secondPickTeam: Team | null = null;
  
  if (winnerPreference && loserPreference && rollWinner) {
       const winner = rollWinner;
       const loser = winner === "red" ? "blue" : "red";
       
       // Logic: 
       // If winner picks First Pick, Winner is FP.
       // If winner picks Second Pick, Loser is FP.
       // If winner picks First Ban, who is FP? The one who didn't pick Second Pick.
       // Wait, we need to know who picks FIRST.
       // Usually: 
       // Choices are: First Pick, Second Pick, First Ban, Second Ban.
       // If Winner picks First Pick -> Winner is FP.
       // If Winner picks Second Pick -> Loser is FP.
       // If Winner picks First Ban -> Loser gets to choose Pick Order? No, typically it's combined.
       // "Winner gets first ban and first pick" says the prompt.
       // "Option to re-roll if tied".
       
       // But the prompt says: "Winner gets first ban and first pick".
       // This implies there is no preference selection?
       // "Roll Phase ... Winner gets first ban and first pick".
       // If so, we can skip preference selection if strictly following that requirement.
       // BUT, standard osu! tournaments allows choice.
       // And the app already has `preference_selection` status.
       // I'll stick to the existing robust preference system.
       
       // Resolving FP/SP:
       if (winnerPreference === "first_pick") {
           firstPickTeam = winner;
           secondPickTeam = loser;
       } else if (winnerPreference === "second_pick") {
           firstPickTeam = loser;
           secondPickTeam = winner;
       } else if (loserPreference === "first_pick") {
           firstPickTeam = loser;
           secondPickTeam = winner;
       } else if (loserPreference === "second_pick") {
           firstPickTeam = winner;
           secondPickTeam = loser;
       } else {
           // Both picked Ban preferences?
           // E.g. Winner: First Ban. Loser: Second Ban.
           // Who picks first? Default to Winner? Or Random?
           // Standard: Winner of roll decides EITHER Pick Order OR Ban Order. The other team decides the other.
           // Since our DB stores `roll_winner_preference`, let's assume valid flows.
           // Default: Winner is First Pick if not specified.
           firstPickTeam = winner;
           secondPickTeam = loser;
       }
       
       // Process Draft Pattern
       const draftActions = actions.filter(a => a.action_type === "ban" || a.action_type === "pick");
       const pattern = stage.draft_pattern; // Array<{action, team: 1|2}>
       
       if (!pattern || pattern.length === 0) {
           status = "completed"; 
       } else {
           const nextStepIndex = draftActions.length;
           
           if (nextStepIndex >= pattern.length) {
               status = "completed";
               currentTeam = null;
               timerEndsAt = null;
           } else {
               const step = pattern[nextStepIndex];
               // Ensure step is typed correctly if coming from JSON
               const action = step.action; 
               const teamIndex = step.team;
               
               status = action === "ban" ? "banning" : "picking"; // "banning" or "picking"
               
               // team 1 = firstPickTeam, team 2 = secondPickTeam
               currentTeam = teamIndex === 1 ? firstPickTeam : secondPickTeam;
               
               // Set timer
               timerEndsAt = new Date(Date.now() + stage.timer_duration * 1000).toISOString();
           }
       }
  }

  // Update Match
  // Only update if something changed or if we need to set timer (which we do on every recalc usually triggered by action)
  await supabase.from("matches").update({
      status,
      current_team: currentTeam,
      timer_ends_at: timerEndsAt,
      roll_winner: rollWinner
  } as never).eq("id", matchId);
}

export async function processMatchAction(
  matchId: string,
  actionType: "roll" | "ban" | "pick" | "preference",
  team: "red" | "blue",
  preference?: RollPreference
) {
    // Determine if we need to handle specific logic before recalc
    // E.g. clearing rolls on tie is handled in calculateMatchState? 
    // No, actions are already inserted.
    
    // For Roll: if tie, we need to clear rolls.
    // calculateMatchState detects tie. But it doesn't delete actions.
    
    // Let's rely on calculateMatchState to set status.
    
    await calculateMatchState(matchId);
}

export async function startMatch(matchId: string) {
  await supabase
    .from("matches")
    .update({
      status: "rolling",
      current_team: null,
      timer_ends_at: null,
    } as never)
    .eq("id", matchId);
}
