"use client";

import { motion } from "framer-motion";
import { Trophy, Shield, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { RollPreference } from "@/types";

interface PreferenceSelectorProps {
  winnerTeam: "red" | "blue";
  winnerName: string;
  winnerColor: string;
  loserName: string;
  canSelect: boolean;
  onSelect: (preference: RollPreference) => void;
  selectedPreference?: RollPreference | null;
}

const preferences: Array<{
  value: RollPreference;
  label: string;
  description: string;
  icon: typeof Trophy;
  gradient: string;
}> = [
  {
    value: "first_pick",
    label: "First Pick",
    description: "Pick the first map",
    icon: Trophy,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    value: "second_pick",
    label: "Second Pick",
    description: "Pick the second map",
    icon: ArrowDownCircle,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    value: "first_ban",
    label: "First Ban",
    description: "Ban the first map",
    icon: Shield,
    gradient: "from-red-500 to-rose-600",
  },
  {
    value: "second_ban",
    label: "Second Ban",
    description: "Ban the second map",
    icon: ArrowUpCircle,
    gradient: "from-orange-500 to-amber-600",
  },
];

export function PreferenceSelector({
  winnerTeam,
  winnerName,
  winnerColor,
  loserName,
  canSelect,
  onSelect,
  selectedPreference,
}: PreferenceSelectorProps) {
  // Determine what the loser gets based on winner's selection
  const getLoserPreference = (winnerPref: RollPreference): string => {
    const map: Record<RollPreference, string> = {
      first_pick: "Second Pick",
      second_pick: "First Pick",
      first_ban: "Second Ban",
      second_ban: "First Ban",
    };
    return map[winnerPref];
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-4xl font-bold mb-2" style={{ color: winnerColor }}>
          🎉 {winnerName} Won the Roll!
        </div>
        <div className="text-2xl text-white/80">
          {canSelect
            ? "Choose your preference:"
            : selectedPreference
            ? `Selected: ${preferences.find((p) => p.value === selectedPreference)?.label}`
            : "Waiting for selection..."}
        </div>
      </motion.div>

      {/* Preference Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {preferences.map((pref, index) => {
          const Icon = pref.icon;
          const isSelected = selectedPreference === pref.value;
          const isDisabled = !canSelect || (selectedPreference !== null && !isSelected);

          return (
            <motion.button
              key={pref.value}
              onClick={() => canSelect && !selectedPreference && onSelect(pref.value)}
              disabled={isDisabled}
              className={`relative rounded-2xl p-6 border-4 transition-all ${
                isSelected
                  ? "border-white ring-4"
                  : isDisabled
                  ? "border-gray-600 opacity-40 cursor-not-allowed"
                  : "border-transparent hover:border-white/50"
              }`}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd)`
                  : `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: isDisabled ? 0.4 : 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!isDisabled ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pref.gradient} opacity-90`}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <Icon className="w-12 h-12 text-white" />
                <div className="text-white font-bold text-xl">{pref.label}</div>
                <div className="text-white/90 text-sm">{pref.description}</div>
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <span className="text-2xl">✓</span>
                </motion.div>
              )}

              {/* Hover Effect */}
              {!isDisabled && !isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-white/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Result Summary */}
      {selectedPreference && (
        <motion.div
          className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Winner Gets */}
            <div className="text-center">
              <div className="text-lg text-white/60 mb-2">Winner ({winnerName})</div>
              <div className="text-2xl font-bold" style={{ color: winnerColor }}>
                {preferences.find((p) => p.value === selectedPreference)?.label}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center">
              <div className="h-full w-px bg-white/20" />
            </div>

            {/* Loser Gets */}
            <div className="text-center">
              <div className="text-lg text-white/60 mb-2">Loser ({loserName})</div>
              <div className="text-2xl font-bold text-white">
                {getLoserPreference(selectedPreference)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
