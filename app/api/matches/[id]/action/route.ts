import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { processMatchAction } from "@/lib/match-logic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { match_id, team, action_type, beatmap_id } = body;

    // Validate input
    if (!match_id || !team || !action_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current match state
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get current action count
    const { count } = await supabase
      .from("match_actions")
      .select("*", { count: "exact", head: true })
      .eq("match_id", match_id);

    // Insert action
    const { data: action, error } = await supabase
      .from("match_actions")
      .insert({
        match_id,
        team,
        action_type,
        beatmap_id,
        order_index: (count || 0) + 1,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Error creating action:", error);
      return NextResponse.json(
        { error: "Failed to create action" },
        { status: 500 }
      );
    }

    // Process match state transition
    await processMatchAction(match_id, action_type, team);

    return NextResponse.json({ action });
  } catch (error) {
    console.error("Error in create action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
