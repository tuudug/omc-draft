"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

type ModPool = "NM" | "HD" | "HR" | "FM" | "DT" | "TB";

const MOD_POOLS: ModPool[] = ["NM", "HD", "HR", "FM", "DT", "TB"];

export default function CreateStagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stageName, setStageName] = useState("");
  const [bestOf, setBestOf] = useState(9);
  const [numBans, setNumBans] = useState(2);
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

      const response = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stageName,
          best_of: bestOf,
          num_bans: numBans,
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
