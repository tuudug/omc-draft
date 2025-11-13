"use client";

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
      <div
        className={`relative overflow-hidden rounded-lg px-6 py-2 bg-gradient-to-r ${config.gradient} shadow-lg`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white" />

          <div className="flex items-center gap-2">
            <div className="text-white font-bold text-lg uppercase tracking-wide">
              {config.label}
            </div>
            {currentTeam && currentTeamName && (
              <div className="text-white/90 text-sm">
                <span style={{ color: displayColor }} className="font-bold">
                  {currentTeamName}
                </span>
                &apos;s Turn
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Counter */}
      {actionCounter && (
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
          <div className="text-white text-sm font-bold">{actionCounter}</div>
        </div>
      )}

      {/* Timer Display */}
      {timeRemaining !== undefined && timeRemaining > 0 && (
        <div
          className={`relative px-4 py-1 rounded-lg shadow-lg ${
            isUrgent
              ? "bg-red-600"
              : "bg-gradient-to-r from-purple-600/80 to-pink-600/80"
          }`}
        >
          {/* Progress Bar Background */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div
              className="h-full bg-white/20 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeRemaining / 60) * 100}%` }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Timer className="w-4 h-4 text-white" />
            <div className="text-white font-bold text-2xl tabular-nums">
              {timeRemaining}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
