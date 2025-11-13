"use client";

import { motion } from "framer-motion";
import { Clock, Music2, Star, Shield, Trophy, Ban } from "lucide-react";
import type { Beatmap } from "@/types";

interface EnhancedMapCardProps {
  beatmap: Beatmap;
  status: "available" | "banned" | "picked" | "locked";
  pickedByTeam?: "red" | "blue";
  teamRedColor?: string;
  teamBlueColor?: string;
  canInteract?: boolean;
  interactionMode?: "ban" | "pick";
  onBan?: () => void;
  onPick?: () => void;
}

export function EnhancedMapCard({
  beatmap,
  status,
  pickedByTeam,
  teamRedColor = "#EF4444",
  teamBlueColor = "#3B82F6",
  canInteract = false,
  interactionMode,
  onBan,
  onPick,
}: EnhancedMapCardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isTiebreaker = beatmap.mod_pool === "TB";
  const isBanned = status === "banned";
  const isPicked = status === "picked";
  const isLocked = status === "locked" || isTiebreaker;

  const teamColor = pickedByTeam === "red" ? teamRedColor : pickedByTeam === "blue" ? teamBlueColor : undefined;

  return (
    <motion.div
      layout
      className={`relative rounded-lg overflow-hidden group shadow-md ${
        canInteract ? "cursor-pointer" : ""
      } ${isTiebreaker ? "ring-1 ring-yellow-500" : ""}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={canInteract ? { scale: 1.03, zIndex: 10 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Background Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={beatmap.cover_url}
          alt={beatmap.title}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isBanned
              ? "grayscale brightness-50"
              : isPicked
              ? "brightness-75"
              : canInteract
              ? "group-hover:brightness-110 group-hover:scale-110"
              : ""
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Mod Badge */}
        <div className="absolute top-1 left-1">
          <div
            className={`px-2 py-0.5 rounded font-bold text-xs shadow ${
              isTiebreaker
                ? "bg-yellow-500 text-black"
                : "bg-purple-600 text-white"
            }`}
          >
            {beatmap.mod_pool}
            {beatmap.mod_index}
          </div>
        </div>

        {/* Star Rating */}
        <div className="absolute top-1 right-1">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm rounded">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-xs">
              {beatmap.star_rating.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Map Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white font-bold text-base leading-tight mb-1 line-clamp-1">
            {beatmap.title}
          </div>
          <div className="text-white/80 text-sm mb-1.5 line-clamp-1">
            {beatmap.artist}
          </div>

          {/* Stats Row */}
          <div className="flex gap-1.5 text-xs">
            {/* Length */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 py-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-white text-xs">
                {formatTime(beatmap.length)}
              </span>
            </div>

            {/* BPM */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 py-1">
              <Music2 className="w-3 h-3 text-pink-400" />
              <span className="text-white text-xs">{Math.round(beatmap.bpm)}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 py-1">
              <span className="text-white/60 text-xs">AR</span>
              <span className="text-white text-xs">{beatmap.ar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banned Overlay */}
      {isBanned && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-gray-900/90 flex flex-col items-center justify-center border-2 border-red-500"
        >
          <Ban className="w-8 h-8 text-white mb-1" />
          <span className="text-white font-bold text-sm uppercase tracking-wide">
            BANNED
          </span>
        </motion.div>
      )}

      {/* Picked Overlay */}
      {isPicked && teamColor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center border-2"
          style={{
            backgroundColor: `${teamColor}cc`,
            borderColor: teamColor,
          }}
        >
          <Trophy className="w-8 h-8 text-white mb-1" />
          <span className="text-white font-bold text-sm uppercase tracking-wide">
            PICKED
          </span>
        </motion.div>
      )}

      {/* Tiebreaker Lock */}
      {isLocked && isTiebreaker && !isBanned && !isPicked && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/50 to-orange-600/50 flex flex-col items-center justify-center border-2 border-yellow-500 pointer-events-none">
          <span className="text-white font-bold text-xs uppercase tracking-wide">
            🔒 TIEBREAKER
          </span>
        </div>
      )}

      {/* Interactive Buttons */}
      {canInteract && interactionMode === "ban" && onBan && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onBan();
          }}
          className="absolute inset-0 bg-red-600/0 hover:bg-red-600/90 transition-all flex flex-col items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shield className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
          <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            BAN
          </span>
        </motion.button>
      )}

      {canInteract && interactionMode === "pick" && onPick && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onPick();
          }}
          className="absolute inset-0 bg-green-600/0 hover:bg-green-600/90 transition-all flex flex-col items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trophy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
          <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            PICK
          </span>
        </motion.button>
      )}

      {/* Hover Glow Effect */}
      {canInteract && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            boxShadow: `0 0 30px ${
              interactionMode === "ban" ? "#EF4444" : "#10B981"
            }`,
          }}
        />
      )}
    </motion.div>
  );
}
