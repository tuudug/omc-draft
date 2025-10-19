"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/admin-context";

interface Stage {
  id: string;
  name: string;
  best_of: number;
  num_bans: number;
}

interface MatchLinks {
  match_id: string;
  team_red_url: string;
  team_blue_url: string;
  spectator_url: string;
}

export default function CreateMatchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdmin();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [teamRedName, setTeamRedName] = useState("");
  const [teamBlueName, setTeamBlueName] = useState("");
  const [teamRedCaptain, setTeamRedCaptain] = useState("");
  const [teamBlueCaptain, setTeamBlueCaptain] = useState("");
  const [matchLinks, setMatchLinks] = useState<MatchLinks | null>(null);
  const [copiedUrl, setCopiedUrl] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    } else {
      fetchStages();
    }
  }, [isAuthenticated, router]);

  const fetchStages = async () => {
    try {
      const response = await fetch("/api/stages");
      const data = await response.json();
      setStages(data.stages || []);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_id: selectedStage,
          team_red_name: teamRedName,
          team_blue_name: teamBlueName,
          team_red_captain_id: parseInt(teamRedCaptain),
          team_blue_captain_id: parseInt(teamBlueCaptain),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatchLinks(data);
      } else {
        alert("Failed to create match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      alert("Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(""), 2000);
  };

  const resetForm = () => {
    setMatchLinks(null);
    setSelectedStage("");
    setTeamRedName("");
    setTeamBlueName("");
    setTeamRedCaptain("");
    setTeamBlueCaptain("");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (matchLinks) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-8">
              Match Created!
            </h1>

            <div className="space-y-4">
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-300 font-medium">
                    Team Red Captain URL
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(matchLinks.team_red_url, "red")
                    }
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {copiedUrl === "red" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </button>
                </div>
                <code className="text-white text-sm break-all">
                  {matchLinks.team_red_url}
                </code>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300 font-medium">
                    Team Blue Captain URL
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(matchLinks.team_blue_url, "blue")
                    }
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {copiedUrl === "blue" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </button>
                </div>
                <code className="text-white text-sm break-all">
                  {matchLinks.team_blue_url}
                </code>
              </div>

              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-300 font-medium">
                    Spectator URL
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(matchLinks.spectator_url, "spectator")
                    }
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {copiedUrl === "spectator" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </button>
                </div>
                <code className="text-white text-sm break-all">
                  {matchLinks.spectator_url}
                </code>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={resetForm}
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all"
              >
                Create Another Match
              </button>
              <Link
                href="/admin"
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all text-center"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Admin Dashboard
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-8">Create Match</h1>

          {stages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">No stages created yet.</p>
              <Link
                href="/admin/stages"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Stage First
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Select Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Choose a stage...</option>
                  {stages.map((stage) => (
                    <option
                      key={stage.id}
                      value={stage.id}
                      className="bg-gray-900"
                    >
                      {stage.name} (BO{stage.best_of})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 bg-red-900/20 p-6 rounded-lg border border-red-500/30">
                  <h3 className="text-xl font-bold text-red-300">Team Red</h3>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={teamRedName}
                      onChange={(e) => setTeamRedName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Team Red"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Captain osu! ID
                    </label>
                    <input
                      type="number"
                      value={teamRedCaptain}
                      onChange={(e) => setTeamRedCaptain(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="123456"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-blue-900/20 p-6 rounded-lg border border-blue-500/30">
                  <h3 className="text-xl font-bold text-blue-300">Team Blue</h3>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={teamBlueName}
                      onChange={(e) => setTeamBlueName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Team Blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Captain osu! ID
                    </label>
                    <input
                      type="number"
                      value={teamBlueCaptain}
                      onChange={(e) => setTeamBlueCaptain(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="789012"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Match...
                  </>
                ) : (
                  "Create Match"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
