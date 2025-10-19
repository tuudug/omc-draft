import { NextRequest, NextResponse } from "next/server";
import { getBeatmapData } from "@/lib/osu-api";
import type { OsuBeatmap } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const beatmapId = searchParams.get("id");

  if (!beatmapId) {
    return NextResponse.json(
      { error: "Beatmap ID is required" },
      { status: 400 }
    );
  }

  try {
    const data: OsuBeatmap = await getBeatmapData(parseInt(beatmapId));

    return NextResponse.json({
      id: data.id,
      title: data.beatmapset.title,
      artist: data.beatmapset.artist,
      difficulty_name: data.version,
      star_rating: data.difficulty_rating,
      bpm: data.bpm,
      length: data.total_length,
      cs: data.cs,
      ar: data.ar,
      od: data.accuracy,
      hp: data.drain,
      cover_url: data.beatmapset.covers["cover@2x"],
    });
  } catch (error) {
    console.error("Error fetching beatmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch beatmap data" },
      { status: 500 }
    );
  }
}
