import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getBeatmapData } from "@/lib/osu-api";
import type { OsuBeatmap } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, best_of, num_bans, beatmaps, timer_duration, draft_pattern } = body;

    // Validate input
    if (!name || !best_of || num_bans === undefined || !beatmaps) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create stage
    const { data: stage, error: stageError } = await supabase
      .from("stages")
      .insert({ name, best_of, num_bans, timer_duration, draft_pattern } as never)
      .select()
      .single();

    if (stageError || !stage) {
      console.error("Error creating stage:", stageError);
      return NextResponse.json(
        { error: "Failed to create stage" },
        { status: 500 }
      );
    }

    // Cast stage for type safety
    const stageData = stage as { id: string };

    // Fetch and insert beatmaps
    const beatmapInserts = [];
    for (const [modPool, maps] of Object.entries(beatmaps) as [
      string,
      number[]
    ][]) {
      for (let i = 0; i < maps.length; i++) {
        const beatmapId = maps[i];
        try {
          const osuData: OsuBeatmap = await getBeatmapData(beatmapId);
          beatmapInserts.push({
            beatmap_id: osuData.id,
            stage_id: stageData.id,
            mod_pool: modPool,
            mod_index: i + 1,
            title: osuData.beatmapset.title,
            artist: osuData.beatmapset.artist,
            difficulty_name: osuData.version,
            star_rating: osuData.difficulty_rating,
            bpm: osuData.bpm,
            length: osuData.total_length,
            cs: osuData.cs,
            ar: osuData.ar,
            od: osuData.accuracy,
            hp: osuData.drain,
            cover_url: osuData.beatmapset.covers["cover@2x"],
          });
        } catch (error) {
          console.error(`Error fetching beatmap ${beatmapId}:`, error);
          // Continue with other beatmaps
        }
      }
    }

    if (beatmapInserts.length > 0) {
      const { error: beatmapsError } = await supabase
        .from("beatmaps")
        .insert(beatmapInserts as never);

      if (beatmapsError) {
        console.error("Error inserting beatmaps:", beatmapsError);
      }
    }

    return NextResponse.json({ stage, beatmapCount: beatmapInserts.length });
  } catch (error) {
    console.error("Error in create stage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: stages, error } = await supabase
      .from("stages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stages:", error);
      return NextResponse.json(
        { error: "Failed to fetch stages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stages });
  } catch (error) {
    console.error("Error in get stages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
