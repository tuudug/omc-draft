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
      className={`relative rounded-xl overflow-hidden group shadow-lg ${
        canInteract ? "cursor-pointer" : ""
      } ${isTiebreaker ? "ring-2 ring-yellow-500" : ""}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={canInteract ? { scale: 1.05, zIndex: 10 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Background Image */}
      <div className="relative h-48 overflow-hidden">
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
        <div className="absolute top-2 left-2">
          <div
            className={`px-3 py-1 rounded-lg font-bold text-sm shadow-lg ${
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
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-black/80 backdrop-blur-sm rounded-lg">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-sm">
              {beatmap.star_rating.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Map Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1">
            {beatmap.title}
          </div>
          <div className="text-white/80 text-sm mb-2 line-clamp-1">
            {beatmap.artist} - {beatmap.difficulty_name}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Length */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-white font-medium">
                {formatTime(beatmap.length)}
              </span>
            </div>

            {/* BPM */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
              <Music2 className="w-3 h-3 text-pink-400" />
              <span className="text-white font-medium">{beatmap.bpm}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
              <span className="text-white/60">CS</span>
              <span className="text-white font-medium">{beatmap.cs}</span>
              <span className="text-white/60">AR</span>
              <span className="text-white font-medium">{beatmap.ar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banned Overlay */}
      {isBanned && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-gray-900/90 flex flex-col items-center justify-center border-4 border-red-500"
        >
          <Ban className="w-16 h-16 text-white mb-2" />
          <span className="text-white font-bold text-2xl uppercase tracking-wider">
            BANNED
          </span>
        </motion.div>
      )}

      {/* Picked Overlay */}
      {isPicked && teamColor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center border-4"
          style={{
            backgroundColor: `${teamColor}cc`,
            borderColor: teamColor,
          }}
        >
          <Trophy className="w-16 h-16 text-white mb-2" />
          <span className="text-white font-bold text-2xl uppercase tracking-wider">
            PICKED
          </span>
          <span className="text-white/90 text-lg mt-1">
            {pickedByTeam === "red" ? "RED TEAM" : "BLUE TEAM"}
          </span>
        </motion.div>
      )}

      {/* Tiebreaker Lock */}
      {isLocked && isTiebreaker && !isBanned && !isPicked && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/50 to-orange-600/50 flex flex-col items-center justify-center border-4 border-yellow-500 pointer-events-none">
          <span className="text-white font-bold text-lg uppercase tracking-wider">
            🔒 TIEBREAKER 🔒
          </span>
          <span className="text-white/90 text-sm mt-1">Final Map</span>
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
          <Shield className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity mb-2" />
          <span className="text-white font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
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
          <Trophy className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity mb-2" />
          <span className="text-white font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
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
