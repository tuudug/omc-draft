"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, RotateCcw, Undo2, Download, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface AdminControlsProps {
  isAdmin?: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onUndo?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  canUndo?: boolean;
}

export function AdminControls({
  isAdmin = false,
  audioEnabled,
  onToggleAudio,
  onUndo,
  onReset,
  onExport,
  canUndo = false,
}: AdminControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAdmin) {
    // Show only audio toggle for non-admin users
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.button
          onClick={onToggleAudio}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {audioEnabled ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute bottom-20 right-0 bg-black/90 backdrop-blur-md rounded-2xl p-4 border-2 border-purple-500/50 shadow-2xl min-w-[240px]"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <div className="text-purple-400 font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Controls
            </div>

            <div className="space-y-2">
              {/* Audio Toggle */}
              <motion.button
                onClick={onToggleAudio}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600/50 to-pink-600/50 hover:from-purple-600 hover:to-pink-600 text-white font-medium flex items-center gap-3 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
                <span>{audioEnabled ? "Mute Audio" : "Unmute Audio"}</span>
              </motion.button>

              {/* Undo */}
              {onUndo && (
                <motion.button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all ${
                    canUndo
                      ? "bg-gradient-to-r from-blue-600/50 to-cyan-600/50 hover:from-blue-600 hover:to-cyan-600 text-white"
                      : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                  }`}
                  whileHover={canUndo ? { scale: 1.02 } : {}}
                  whileTap={canUndo ? { scale: 0.98 } : {}}
                >
                  <Undo2 className="w-5 h-5" />
                  <span>Undo Last Action</span>
                </motion.button>
              )}

              {/* Reset */}
              {onReset && (
                <motion.button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset the draft? This cannot be undone.")) {
                      onReset();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/50 to-rose-600/50 hover:from-red-600 hover:to-rose-600 text-white font-medium flex items-center gap-3 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset Draft</span>
                </motion.button>
              )}

              {/* Export */}
              {onExport && (
                <motion.button
                  onClick={onExport}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-600/50 to-emerald-600/50 hover:from-green-600 hover:to-emerald-600 text-white font-medium flex items-center gap-3 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  <span>Export Draft</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={
          isExpanded
            ? { rotate: 90 }
            : {
                rotate: 0,
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.5)",
                  "0 0 40px rgba(168, 85, 247, 0.8)",
                  "0 0 20px rgba(168, 85, 247, 0.5)",
                ],
              }
        }
        transition={{ duration: 0.3 }}
      >
        <Settings className="w-7 h-7" />
      </motion.button>
    </div>
  );
}
