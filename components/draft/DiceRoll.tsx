"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dices } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [animatedValue, setAnimatedValue] = useState<number>(1);

  // Animate through random numbers while rolling
  useEffect(() => {
    if (!isRolling) return;

    const interval = setInterval(() => {
      setAnimatedValue(Math.floor(Math.random() * 100) + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isRolling]);

  // Set final value when roll completes
  useEffect(() => {
    if (rollValue !== null && !isRolling) {
      setAnimatedValue(rollValue);
    }
  }, [rollValue, isRolling]);

  const displayValue = rollValue !== null && !isRolling ? rollValue : animatedValue;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Dice Display */}
      <motion.div
        className="relative"
        animate={isRolling ? { rotate: [0, 360] } : {}}
        transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0, ease: "linear" }}
      >
        <motion.div
          className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold text-white shadow-xl`}
          style={{
            backgroundColor: teamColor,
            boxShadow: `0 0 60px ${teamColor}80`,
          }}
          animate={
            isRolling
              ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    `0 0 40px ${teamColor}80`,
                    `0 0 80px ${teamColor}`,
                    `0 0 40px ${teamColor}80`,
                  ],
                }
              : rollValue !== null
              ? {
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    `0 0 60px ${teamColor}80`,
                    `0 0 100px ${teamColor}`,
                    `0 0 60px ${teamColor}80`,
                  ],
                }
              : {}
          }
          transition={{
            duration: 0.3,
            repeat: isRolling ? Infinity : rollValue !== null ? 1 : 0,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={displayValue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
            >
              {displayValue}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Dice Icon Overlay when not rolled */}
        {rollValue === null && !isRolling && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Dices className="w-16 h-16 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Team Name */}
      <div className="text-lg font-bold" style={{ color: teamColor }}>
        {teamName}
      </div>

      {/* Roll Button */}
      {canRoll && rollValue === null && !isRolling && (
        <motion.button
          onClick={onRoll}
          className="px-4 py-2 rounded-lg font-bold text-sm text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${teamColor}, ${teamColor}dd)`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              `0 0 20px ${teamColor}40`,
              `0 0 40px ${teamColor}80`,
              `0 0 20px ${teamColor}40`,
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🎲 ROLL!
        </motion.button>
      )}

      {/* Rolling Status */}
      {isRolling && (
        <motion.div
          className="text-sm font-bold text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          Rolling...
        </motion.div>
      )}

      {/* Result Status */}
      {rollValue !== null && !isRolling && (
        <motion.div
          className="text-sm font-bold"
          style={{ color: teamColor }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Rolled: {rollValue}
        </motion.div>
      )}
    </div>
  );
}
