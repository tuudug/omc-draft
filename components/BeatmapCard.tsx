import type { Beatmap } from "@/types";
import { Music, Clock, Gauge } from "lucide-react";

interface BeatmapCardProps {
  beatmap: Beatmap;
  onClick?: () => void;
  disabled?: boolean;
  status?: "banned" | "picked" | "available";
  className?: string;
}

export default function BeatmapCard({
  beatmap,
  onClick,
  disabled,
  status = "available",
  className = "",
}: BeatmapCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:scale-105"
      } transition-all duration-200 ${className}`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Background Image */}
      <div
        className="w-full h-32 bg-cover bg-center"
        style={{ backgroundImage: `url(${beatmap.cover_url})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent">
        <div className="absolute top-2 left-2 flex gap-2">
          <span className="px-2 py-1 bg-purple-600 rounded text-white text-xs font-bold">
            {beatmap.mod_pool}
            {beatmap.mod_index}
          </span>
          <span className="px-2 py-1 bg-yellow-600 rounded text-white text-xs font-bold">
            {beatmap.star_rating.toFixed(2)}★
          </span>
        </div>

        {status === "banned" && (
          <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">BANNED</span>
          </div>
        )}

        {status === "picked" && (
          <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">PICKED</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <div className="flex items-center gap-2 text-white">
            <Music className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold text-sm truncate">{beatmap.title}</span>
          </div>
          <div className="text-gray-300 text-xs truncate">{beatmap.artist}</div>
          <div className="text-gray-300 text-xs">{beatmap.difficulty_name}</div>

          <div className="flex gap-3 text-gray-300 text-xs mt-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(beatmap.length)}
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              {beatmap.bpm} BPM
            </div>
          </div>

          <div className="flex gap-2 text-gray-300 text-xs">
            <span>CS {beatmap.cs}</span>
            <span>AR {beatmap.ar}</span>
            <span>OD {beatmap.od}</span>
            <span>HP {beatmap.hp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
