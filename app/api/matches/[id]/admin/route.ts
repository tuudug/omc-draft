import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateMatchState, startMatch } from "@/lib/match-logic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const body = await request.json();
    const { action } = body;

    // TODO: Ideally check admin token here, but we rely on simple path access for this prototype
    
    if (action === "reset") {
        // Delete all actions
        await supabase.from("match_actions").delete().eq("match_id", id);
        
        // Reset match
        await supabase.from("matches").update({
            status: "rolling",
            current_team: null,
            team_red_roll: null,
            team_blue_roll: null,
            roll_winner: null,
            roll_winner_preference: null,
            roll_loser_preference: null,
            timer_ends_at: null,
            current_pick_number: 0,
            current_ban_number: 0
        }).eq("id", id);
        
        return NextResponse.json({ success: true });
    }
    
    if (action === "undo") {
        // Get last action
        const { data: lastAction } = await supabase.from("match_actions")
            .select("*")
            .eq("match_id", id)
            .order("order_index", { ascending: false })
            .limit(1)
            .single();
            
        if (!lastAction) return NextResponse.json({ error: "No actions to undo" });
        
        // Delete it
        await supabase.from("match_actions").delete().eq("id", lastAction.id);
        
        // Handle roll reset if we undo a roll
        // If we undo a roll, we should probably clear the roll value in match table too?
        if (lastAction.action_type === 'roll') {
             // We don't know which team rolled unless we check lastAction.team
             // But simpler is to let calculateMatchState handle it?
             // calculateMatchState reads from match table. 
             // We need to clear the match table roll value manually here.
             const team = lastAction.team; // 'red' or 'blue'
             if (team === 'red') {
                 await supabase.from("matches").update({ team_red_roll: null } as never).eq("id", id);
             } else {
                 await supabase.from("matches").update({ team_blue_roll: null } as never).eq("id", id);
             }
        }
        
        // Handle preference reset
        if (lastAction.action_type === 'preference') {
             // If undoing preference, we need to clear it from match table.
             // But which one? winner or loser preference?
             // Check match state
             const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
             if (match) {
                 if (match.roll_loser_preference) {
                     await supabase.from("matches").update({ roll_loser_preference: null } as never).eq("id", id);
                 } else if (match.roll_winner_preference) {
                     await supabase.from("matches").update({ roll_winner_preference: null } as never).eq("id", id);
                 }
             }
        }

        // Re-calculate state
        await calculateMatchState(id);
        
        return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
