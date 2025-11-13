"use client";

import { motion } from "framer-motion";
import { Timer, Dices, Shield, Trophy, CheckCircle2 } from "lucide-react";
import type { MatchStatus } from "@/types";

interface PhaseIndicatorProps {
  status: MatchStatus;
  currentTeam?: "red" | "blue" | null;
  currentTeamName?: string;
  teamColor?: string;
  timeRemaining?: number;
  actionCounter?: string; // e.g., "Ban 1 of 4" or "Pick 3 of 12"
}

const phaseConfig: Record<
  MatchStatus,
  {
    label: string;
    icon: typeof Timer;
    color: string;
    gradient: string;
  }
> = {
  waiting: {
    label: "Waiting",
    icon: Timer,
    color: "#9333EA",
    gradient: "from-purple-600 to-purple-800",
  },
  rolling: {
    label: "Roll Phase",
    icon: Dices,
    color: "#EC4899",
    gradient: "from-pink-600 to-purple-600",
  },
  preference_selection: {
    label: "Preference Selection",
    icon: CheckCircle2,
    color: "#3B82F6",
    gradient: "from-blue-600 to-cyan-600",
  },
  banning: {
    label: "Ban Phase",
    icon: Shield,
    color: "#EF4444",
    gradient: "from-red-600 to-rose-700",
  },
  picking: {
    label: "Pick Phase",
    icon: Trophy,
    color: "#10B981",
    gradient: "from-green-600 to-emerald-700",
  },
  completed: {
    label: "Draft Completed",
    icon: CheckCircle2,
    color: "#8B5CF6",
    gradient: "from-violet-600 to-purple-700",
  },
};

export function PhaseIndicator({
  status,
  currentTeam,
  currentTeamName,
  teamColor,
  timeRemaining,
  actionCounter,
}: PhaseIndicatorProps) {
  const config = phaseConfig[status];
  const Icon = config.icon;

  const isUrgent = timeRemaining !== undefined && timeRemaining <= 10;
  const displayColor = currentTeam && teamColor ? teamColor : config.color;

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Main Phase Display */}
      <motion.div
        className={`relative overflow-hidden rounded-lg px-6 py-2 bg-gradient-to-r ${config.gradient} shadow-lg`}
        animate={
          isUrgent
            ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 40px rgba(239, 68, 68, 0.5)",
                  "0 0 60px rgba(239, 68, 68, 0.8)",
                  "0 0 40px rgba(239, 68, 68, 0.5)",
                ],
              }
            : {}
        }
        transition={{ duration: 0.6, repeat: isUrgent ? Infinity : 0 }}
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative z-10 flex items-center gap-2">
          <motion.div
            animate={{ rotate: status === "rolling" ? 360 : 0 }}
            transition={{
              duration: 2,
              repeat: status === "rolling" ? Infinity : 0,
              ease: "linear",
            }}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>

          <div className="flex items-center gap-2">
            <div className="text-white font-bold text-lg uppercase tracking-wide">
              {config.label}
            </div>
            {currentTeam && currentTeamName && (
              <motion.div
                className="text-white/90 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span style={{ color: displayColor }} className="font-bold">
                  {currentTeamName}
                </span>
                &apos;s Turn
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action Counter */}
      {actionCounter && (
        <motion.div
          className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-white text-sm font-bold">{actionCounter}</div>
        </motion.div>
      )}

      {/* Timer Display */}
      {timeRemaining !== undefined && timeRemaining > 0 && (
        <motion.div
          className={`relative px-4 py-1 rounded-lg shadow-lg ${
            isUrgent
              ? "bg-red-600"
              : "bg-gradient-to-r from-purple-600/80 to-pink-600/80"
          }`}
          animate={
            isUrgent
              ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 20px rgba(239, 68, 68, 0.5)",
                    "0 0 40px rgba(239, 68, 68, 0.8)",
                    "0 0 20px rgba(239, 68, 68, 0.5)",
                  ],
                }
              : {}
          }
          transition={{ duration: 0.6, repeat: isUrgent ? Infinity : 0 }}
        >
          {/* Progress Bar Background */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <motion.div
              className="h-full bg-white/20"
              initial={{ width: "100%" }}
              animate={{
                width: `${(timeRemaining / 60) * 100}%`,
              }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Timer className={`w-4 h-4 text-white ${isUrgent ? "animate-pulse" : ""}`} />
            <div className="text-white font-bold text-2xl tabular-nums">
              {timeRemaining}s
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
