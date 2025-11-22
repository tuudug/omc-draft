import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { startMatch } from "@/lib/match-logic";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stage_id,
      team_red_name,
      team_blue_name,
      team_red_captain_id,
      team_blue_captain_id,
    } = body;

    // Validate input
    if (
      !stage_id ||
      !team_red_name ||
      !team_blue_name ||
      !team_red_captain_id ||
      !team_blue_captain_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique tokens
    const team_red_captain_token = generateToken();
    const team_blue_captain_token = generateToken();
    const spectator_token = generateToken();
    const admin_token = generateToken();

    // Create match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        stage_id,
        team_red_name,
        team_blue_name,
        team_red_captain_id,
        team_blue_captain_id,
        team_red_captain_token,
        team_blue_captain_token,
        spectator_token,
        admin_token,
        status: "waiting",
      } as never)
      .select()
      .single();

    if (matchError || !match) {
      console.error("Error creating match:", matchError);
      return NextResponse.json(
        { error: "Failed to create match" },
        { status: 500 }
      );
    }

    // Cast match for type safety
    const matchData = match as { id: string };

    // Start the match (set to rolling status)
    await startMatch(matchData.id);

    // Return match data with URLs
    // Try environment variable first, then use request headers to detect actual domain
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      baseUrl = `${protocol}://${host}`;
    }

    return NextResponse.json({
      match_id: matchData.id,
      team_red_url: `${baseUrl}/draft/${matchData.id}?token=${team_red_captain_token}&team=red`,
      team_blue_url: `${baseUrl}/draft/${matchData.id}?token=${team_blue_captain_token}&team=blue`,
      spectator_url: `${baseUrl}/draft/${matchData.id}?token=${spectator_token}`,
      admin_url: `${baseUrl}/draft/${matchData.id}?token=${admin_token}&role=admin`,
    });
  } catch (error) {
    console.error("Error in create match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*, stages(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
      return NextResponse.json(
        { error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error in get matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
