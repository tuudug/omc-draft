"use client";

import { Dices } from "lucide-react";

interface DiceRollProps {
  team: "red" | "blue";
  teamName: string;
  teamColor: string;
  rollValue: number | null;
  isRolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
}

export function DiceRoll({
  team,
  teamName,
  teamColor,
  rollValue,
  isRolling,
  onRoll,
  canRoll,
}: DiceRollProps) {

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Dice Display */}
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold text-white shadow-xl`}
          style={{
            backgroundColor: teamColor,
            boxShadow: `0 0 30px ${teamColor}80`,
          }}
        >
          {rollValue !== null ? (
            <span>{rollValue}</span>
          ) : (
            <Dices className="w-12 h-12 text-white" />
          )}
        </div>
      </div>

      {/* Team Name */}
      <div className="text-lg font-bold" style={{ color: teamColor }}>
        {teamName}
      </div>

      {/* Roll Button */}
      {canRoll && rollValue === null && (
        <button
          onClick={onRoll}
          className="px-4 py-2 rounded-lg font-bold text-sm text-white shadow-lg hover:opacity-90 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${teamColor}, ${teamColor}dd)`,
          }}
        >
          🎲 ROLL!
        </button>
      )}

      {/* Result Status */}
      {rollValue !== null && (
        <div
          className="text-sm font-bold"
          style={{ color: teamColor }}
        >
          Rolled: {rollValue}
        </div>
      )}
    </div>
  );
}
