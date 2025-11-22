"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

type ModPool = "NM" | "HD" | "HR" | "FM" | "DT" | "TB";

const MOD_POOLS: ModPool[] = ["NM", "HD", "HR", "FM", "DT", "TB"];

// Helper to generate draft pattern based on type
const generateDraftPattern = (type: string, numBans: number, bestOf: number) => {
    // This is a simplified generator. In a real app, you might want full manual control.
    // We generate a long enough array of actions.
    // "Standard" usually means alternating bans, then alternating double picks (Snake) or single picks.
    // For OWC:
    // 2 bans each (ABBA)
    // Picks: AB BA AB BA ... (Snake)
    
    const pattern = [];
    
    // BANS
    // Simple ABBA for 2 bans
    if (numBans === 1) {
        pattern.push({ action: 'ban', team: 1 });
        pattern.push({ action: 'ban', team: 2 });
    } else if (numBans === 2) {
        pattern.push({ action: 'ban', team: 1 });
        pattern.push({ action: 'ban', team: 2 });
        pattern.push({ action: 'ban', team: 2 });
        pattern.push({ action: 'ban', team: 1 });
    } else {
        // Generic alternating for other numbers
        for (let i = 0; i < numBans * 2; i++) {
            pattern.push({ action: 'ban', team: (i % 2) + 1 });
        }
    }

    // PICKS
    // Generate enough picks for the match to end
    // Max picks needed = Best Of (if 6-6 then TB, so actually BestOf - 1 picks + TB)
    // But let's generate plenty.
    
    if (type === "Snake") {
        // 1, 2, 2, 1, 1, 2...
        let currentTeam = 1;
        for (let i = 0; i < bestOf; i++) {
            pattern.push({ action: 'pick', team: currentTeam });
            // Snake logic: flip every 2 picks, but start is 1, 2.
            // Sequence: 1, 2, 2, 1, 1, 2, 2, 1
            // Index:    0, 1, 2, 3, 4, 5, 6, 7
            
            // Actually standard OWC is:
            // P1, P2, P2, P1, P1, P2...
            
            if (i % 4 === 0) currentTeam = 2; // after 1st pick (index 0), next is 2
            else if (i % 4 === 1) currentTeam = 2; // after 2nd pick (index 1), next is 2 (wait, 1, 2 -> 2)
            else if (i % 4 === 2) currentTeam = 1; 
            else currentTeam = 1;
            
            // Let's redo Snake logic
            // 0: Team 1
            // 1: Team 2
            // 2: Team 2
            // 3: Team 1
            // 4: Team 1
            // 5: Team 2
            // ...
        }
        // Correct snake generation loop
        for (let i = 0; i < bestOf + 2; i++) {
             // 1, 2, 2, 1, 1, 2...
             // 0 -> 1
             // 1 -> 2
             // 2 -> 2
             // 3 -> 1
             // 4 -> 1
             
             // Logic: if i % 4 == 0 or 3 -> Team 1. Else Team 2.
             const team = (i % 4 === 0 || i % 4 === 3) ? 1 : 2;
             // But wait, the first pick is Team 1 (by definition of "First Pick Team")
             
             // Actually, usually it is:
             // Pick 1: Team A
             // Pick 2: Team B
             // Pick 3: Team B
             // Pick 4: Team A
             // Pick 5: Team A
             // Pick 6: Team B
             // ...
             
             // i=0 (1st pick): 0 % 4 = 0 -> T1
             // i=1 (2nd pick): 1 % 4 = 1 -> T2
             // i=2 (3rd pick): 2 % 4 = 2 -> T2
             // i=3 (4th pick): 3 % 4 = 3 -> T1
             // Matches!
        }
    } else {
        // Alternating (ABAB)
        for (let i = 0; i < bestOf + 2; i++) {
             pattern.push({ action: 'pick', team: (i % 2) + 1 });
        }
    }
    
    // Re-generate using the loop properly
    const picks = [];
    for (let i = 0; i < bestOf + 5; i++) { // Extra buffer
        let team = 1;
        if (type === "Snake") {
            team = (i % 4 === 0 || i % 4 === 3) ? 1 : 2;
        } else {
             team = (i % 2) + 1;
        }
        picks.push({ action: 'pick', team });
    }
    
    return [...pattern, ...picks];
};

export default function CreateStagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stageName, setStageName] = useState("");
  const [bestOf, setBestOf] = useState(9);
  const [numBans, setNumBans] = useState(2);
  const [timerDuration, setTimerDuration] = useState(120);
  const [draftPatternType, setDraftPatternType] = useState("Snake");
  
  const [beatmaps, setBeatmaps] = useState<Record<ModPool, string[]>>({
    NM: ["", "", "", "", "", "", "", "", ""],
    HD: ["", "", ""],
    HR: ["", "", ""],
    FM: ["", "", ""],
    DT: ["", "", ""],
    TB: [""],
  });

  const handleBeatmapChange = (mod: ModPool, index: number, value: string) => {
    setBeatmaps((prev) => ({
      ...prev,
      [mod]: prev[mod].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addBeatmapSlot = (mod: ModPool) => {
    setBeatmaps((prev) => ({
      ...prev,
      [mod]: [...prev[mod], ""],
    }));
  };

  const removeBeatmapSlot = (mod: ModPool, index: number) => {
    setBeatmaps((prev) => ({
      ...prev,
      [mod]: prev[mod].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty beatmap IDs and convert to numbers
      const beatmapData: Record<string, number[]> = {};
      for (const [mod, ids] of Object.entries(beatmaps)) {
        const filtered = ids
          .filter((id) => id.trim() !== "")
          .map((id) => parseInt(id.trim()));
        if (filtered.length > 0) {
          beatmapData[mod] = filtered;
        }
      }

      const draftPattern = generateDraftPattern(draftPatternType, numBans, bestOf);

      const response = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stageName,
          best_of: bestOf,
          num_bans: numBans,
          timer_duration: timerDuration,
          draft_pattern: draftPattern,
          beatmaps: beatmapData,
        }),
      });

      if (response.ok) {
        router.push("/admin/matches");
      } else {
        alert("Failed to create stage");
      }
    } catch (error) {
      console.error("Error creating stage:", error);
      alert("Failed to create stage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-8">Create Stage</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Stage Name
                </label>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Group Stage"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Best of
                  </label>
                  <input
                    type="number"
                    value={bestOf}
                    onChange={(e) => setBestOf(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="3"
                    step="2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Number of Bans
                  </label>
                  <input
                    type="number"
                    value={numBans}
                    onChange={(e) => setNumBans(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Timer Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Draft Pattern
                  </label>
                  <select
                    value={draftPatternType}
                    onChange={(e) => setDraftPatternType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 [&>option]:text-black"
                  >
                    <option value="Snake">Standard (Snake - 1-2-2-1)</option>
                    <option value="Alternating">Alternating (1-2-1-2)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Beatmap Pools */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Map Pools</h2>

              {MOD_POOLS.map((mod) => (
                <div key={mod} className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{mod}</h3>
                    <button
                      type="button"
                      onClick={() => addBeatmapSlot(mod)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Slot
                    </button>
                  </div>

                  <div className="space-y-2">
                    {beatmaps[mod].map((beatmapId, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="flex items-center justify-center w-12 text-white font-medium">
                          {mod}
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={beatmapId}
                          onChange={(e) =>
                            handleBeatmapChange(mod, index, e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="Beatmap ID"
                        />
                        {beatmaps[mod].length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBeatmapSlot(mod, index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Stage...
                </>
              ) : (
                "Create Stage"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
