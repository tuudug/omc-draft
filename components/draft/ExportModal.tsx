"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check, FileText, FileJson, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import type { Match, Beatmap, MatchAction } from "@/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  beatmaps: Beatmap[];
  actions: MatchAction[];
}

export function ExportModal({
  isOpen,
  onClose,
  match,
  beatmaps,
  actions,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const generateTextSummary = (): string => {
    const bans = actions.filter((a) => a.action_type === "ban" && a.beatmap_id);
    const picks = actions.filter((a) => a.action_type === "pick" && a.beatmap_id);

    let text = `=== ${match.tournament_name || "osu! Tournament"} - Draft Summary ===\n\n`;
    text += `Match: ${match.team_red_name} vs ${match.team_blue_name}\n`;
    text += `Date: ${new Date(match.created_at).toLocaleDateString()}\n\n`;

    text += `--- Roll Results ---\n`;
    text += `${match.team_red_name}: ${match.team_red_roll}\n`;
    text += `${match.team_blue_name}: ${match.team_blue_roll}\n`;
    text += `Winner: ${match.roll_winner === "red" ? match.team_red_name : match.team_blue_name}\n`;
    if (match.roll_winner_preference) {
      text += `Preference: ${match.roll_winner_preference.replace("_", " ").toUpperCase()}\n`;
    }
    text += `\n`;

    text += `--- Bans ---\n`;
    bans.forEach((ban, i) => {
      const beatmap = beatmaps.find((b) => b.id === ban.beatmap_id);
      if (beatmap) {
        text += `${i + 1}. [${ban.team.toUpperCase()}] ${beatmap.mod_pool}${beatmap.mod_index} - ${beatmap.title}\n`;
      }
    });
    text += `\n`;

    text += `--- Picks ---\n`;
    picks.forEach((pick, i) => {
      const beatmap = beatmaps.find((b) => b.id === pick.beatmap_id);
      if (beatmap) {
        text += `${i + 1}. [${pick.team.toUpperCase()}] ${beatmap.mod_pool}${beatmap.mod_index} - ${beatmap.title}\n`;
      }
    });

    const tb = beatmaps.find((b) => b.mod_pool === "TB");
    if (tb) {
      text += `${picks.length + 1}. [TB] ${tb.mod_pool}${tb.mod_index} - ${tb.title}\n`;
    }

    return text;
  };

  const generateJSON = (): string => {
    const exportData = {
      match: {
        id: match.id,
        tournament: match.tournament_name || "osu! Tournament",
        teams: {
          red: match.team_red_name,
          blue: match.team_blue_name,
        },
        roll: {
          red: match.team_red_roll,
          blue: match.team_blue_roll,
          winner: match.roll_winner,
          preference: match.roll_winner_preference,
        },
        date: match.created_at,
      },
      actions: actions.map((action) => {
        const beatmap = action.beatmap_id
          ? beatmaps.find((b) => b.id === action.beatmap_id)
          : null;

        return {
          order: action.order_index,
          type: action.action_type,
          team: action.team,
          beatmap: beatmap
            ? {
                id: beatmap.beatmap_id,
                mod_pool: beatmap.mod_pool,
                mod_index: beatmap.mod_index,
                title: beatmap.title,
                artist: beatmap.artist,
                difficulty: beatmap.difficulty_name,
                star_rating: beatmap.star_rating,
              }
            : null,
          timestamp: action.created_at,
        };
      }),
    };

    return JSON.stringify(exportData, null, 2);
  };

  const copyToClipboard = async (format: "text" | "json") => {
    const content = format === "text" ? generateTextSummary() : generateJSON();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Download className="w-8 h-8 text-purple-400" />
                  Export Draft
                </h2>
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-red-600/20 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Text Format */}
                <motion.div
                  className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/30 rounded-xl p-6"
                  whileHover={{ borderColor: "rgba(59, 130, 246, 0.6)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Text Format</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Export as human-readable text summary
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => copyToClipboard("text")}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() =>
                        downloadFile(
                          generateTextSummary(),
                          `draft-${match.id.slice(0, 8)}.txt`
                        )
                      }
                      className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* JSON Format */}
                <motion.div
                  className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/30 rounded-xl p-6"
                  whileHover={{ borderColor: "rgba(16, 185, 129, 0.6)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FileJson className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-bold text-white">JSON Format</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Export as structured JSON data
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => copyToClipboard("json")}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() =>
                        downloadFile(
                          generateJSON(),
                          `draft-${match.id.slice(0, 8)}.json`
                        )
                      }
                      className="px-4 py-2 bg-green-600/50 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Preview */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Preview</h3>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-white/80 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{generateTextSummary()}</pre>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
