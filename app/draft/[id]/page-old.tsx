"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Timer, Shield, Swords, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match, Beatmap, MatchAction, Team } from "@/types";

export default function DraftPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id as string;
  const token = searchParams.get("token");
  const teamParam = searchParams.get("team") as Team | null;

  const [match, setMatch] = useState<Match | null>(null);
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCaptain, setIsCaptain] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);
  const [numBans, setNumBans] = useState(0);
  const [numPicks, setNumPicks] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (!matchId || !token) return;

    fetchMatchData();
  }, [matchId, token]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!matchId) return;

    const matchChannel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log("Match update:", payload);
          if (payload.new) {
            setMatch(payload.new as Match);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_actions",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log("Action update:", payload);
          if (payload.new) {
            setActions((prev) => [...prev, payload.new as MatchAction]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [matchId]);

  // Timer countdown
  useEffect(() => {
    if (!match?.timer_ends_at) {
      setTimeRemaining(0);
      setIsHandlingTimeout(false);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        new Date(match.timer_ends_at!).getTime() - Date.now()
      );
      setTimeRemaining(Math.ceil(remaining / 1000));

      if (remaining <= 0 && !isHandlingTimeout) {
        setIsHandlingTimeout(true);
        handleTimerExpired();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [match?.timer_ends_at, isHandlingTimeout]);

  const fetchMatchData = async () => {
    try {
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!matchData) {
        alert("Match not found");
        return;
      }

      const typedMatchData = matchData as Match;
      setMatch(typedMatchData);

      // Check if user is captain
      if (token === typedMatchData.team_red_captain_token) {
        setIsCaptain(true);
        setMyTeam("red");
      } else if (token === typedMatchData.team_blue_captain_token) {
        setIsCaptain(true);
        setMyTeam("blue");
      }

      // Fetch stage info
      const { data: stageData } = await supabase
        .from("stages")
        .select("best_of, num_bans")
        .eq("id", typedMatchData.stage_id)
        .single();

      if (stageData) {
        setNumBans((stageData as { num_bans: number }).num_bans);
        setNumPicks((stageData as { best_of: number }).best_of - 1); // Exclude TB
      }

      // Fetch beatmaps for this stage
      const { data: beatmapData } = await supabase
        .from("beatmaps")
        .select("*")
        .eq("stage_id", typedMatchData.stage_id);

      setBeatmaps((beatmapData as Beatmap[]) || []);

      // Fetch actions
      const { data: actionData } = await supabase
        .from("match_actions")
        .select("*")
        .eq("match_id", matchId)
        .order("order_index", { ascending: true });

      setActions((actionData as MatchAction[]) || []);
    } catch (error) {
      console.error("Error fetching match data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerExpired = async () => {
    if (!match || !isCaptain || match.current_team !== myTeam) {
      setIsHandlingTimeout(false);
      return;
    }

    try {
      if (match.status === "picking") {
        // Auto-pick random available map (excluding TB)
        const availableMaps = getAvailableMaps();
        if (availableMaps.length > 0) {
          const randomMap =
            availableMaps[Math.floor(Math.random() * availableMaps.length)];
          console.log(`⏰ TIMEOUT: Auto-picking random map for ${myTeam} team`);
          await handlePick(randomMap.id, true); // Pass true to indicate it's a timeout pick
        } else {
          console.log("⚠️ TIMEOUT: No available maps to pick!");
        }
      } else if (match.status === "banning") {
        // Skip ban
        await performAction("ban", null);
      }
    } finally {
      setIsHandlingTimeout(false);
    }
  };

  const handleRoll = async () => {
    if (!isCaptain || !myTeam) return;

    const roll = Math.floor(Math.random() * 100) + 1;

    await supabase
      .from("matches")
      .update({
        [`team_${myTeam}_roll`]: roll,
      } as never)
      .eq("id", matchId);

    await performAction("roll", null);
  };

  const handleBan = async (beatmapId: string | null) => {
    if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;

    if (beatmapId === null) {
      console.log(`⏭️ ${myTeam} team skipped their ban`);
    }

    await performAction("ban", beatmapId);
  };

  const handlePick = async (beatmapId: string, isTimeout: boolean = false) => {
    if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;

    // Show toast notification for timeout picks
    if (isTimeout) {
      const map = beatmaps.find((b) => b.id === beatmapId);
      if (map) {
        console.log(
          `⏰ Time expired! Random pick: ${map.mod_pool}${map.mod_index} - ${map.title}`
        );
      }
    }

    await performAction("pick", beatmapId);
  };

  const performAction = async (
    actionType: "roll" | "ban" | "pick",
    beatmapId: string | null
  ) => {
    try {
      await fetch(`/api/matches/${matchId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          team: myTeam,
          action_type: actionType,
          beatmap_id: beatmapId,
        }),
      });
    } catch (error) {
      console.error("Error performing action:", error);
    }
  };

  const getAvailableMaps = () => {
    const bannedIds = getBannedMaps().map((b) => b.beatmap.id);
    const pickedIds = getPickedMaps().map((p) => p.beatmap.id);

    return beatmaps.filter(
      (b) =>
        b.mod_pool !== "TB" &&
        !bannedIds.includes(b.id) &&
        !pickedIds.includes(b.id)
    );
  };

  const getBannedMaps = () => {
    return actions
      .filter((a) => a.action_type === "ban" && a.beatmap_id)
      .map((a) => ({
        beatmap: beatmaps.find((b) => b.id === a.beatmap_id)!,
        team: a.team,
      }))
      .filter((b) => b.beatmap);
  };

  const getPickedMaps = () => {
    const picked = actions
      .filter((a) => a.action_type === "pick" && a.beatmap_id)
      .map((a) => ({
        beatmap: beatmaps.find((b) => b.id === a.beatmap_id)!,
        team: a.team,
      }))
      .filter((p) => p.beatmap);

    // Add TB at the end if all picks are done (match completed or in progress)
    if (
      match?.status === "completed" ||
      (picked.length > 0 &&
        match?.status !== "banning" &&
        match?.status !== "rolling")
    ) {
      const tbMap = beatmaps.find((b) => b.mod_pool === "TB");
      if (tbMap && !picked.some((p) => p.beatmap.id === tbMap.id)) {
        picked.push({
          beatmap: tbMap,
          team: "tiebreaker" as Team,
        });
      }
    }

    return picked;
  };

  const groupedBeatmaps = beatmaps.reduce((acc, map) => {
    if (!acc[map.mod_pool]) acc[map.mod_pool] = [];
    acc[map.mod_pool].push(map);
    return acc;
  }, {} as Record<string, Beatmap[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading draft...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Match not found</div>
      </div>
    );
  }

  // Determine background glow based on current team's turn
  const getBackgroundGlow = () => {
    if (match.status === "waiting" || match.status === "completed") {
      return ""; // No glow
    }
    if (match.current_team === "red") {
      return "shadow-[0_0_100px_rgba(239,68,68,0.15)] bg-gradient-to-br from-red-950/20 via-transparent to-transparent";
    }
    if (match.current_team === "blue") {
      return "shadow-[0_0_100px_rgba(59,130,246,0.15)] bg-gradient-to-br from-blue-950/20 via-transparent to-transparent";
    }
    return "";
  };

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col transition-all duration-1000 ${getBackgroundGlow()}`}
    >
      {/* Top Header - Teams & Phase Info */}
      <div className="flex-shrink-0">
        <div
          className={`relative overflow-hidden transition-all duration-1000 ${
            match.current_team === "red"
              ? "bg-gradient-to-r from-red-950/40 via-purple-950/20 to-transparent shadow-red-500/20"
              : match.current_team === "blue"
              ? "bg-gradient-to-r from-transparent via-purple-950/20 to-blue-950/40 shadow-blue-500/20"
              : "bg-gradient-to-r from-purple-950/20 via-gray-950/20 to-purple-950/20"
          } backdrop-blur-md border-b-2 ${
            match.current_team === "red"
              ? "border-red-500/30"
              : match.current_team === "blue"
              ? "border-blue-500/30"
              : "border-purple-500/20"
          }`}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Red Team */}
              <motion.div
                className={`flex-1 transition-all duration-500 ${
                  match.current_team === "red" ? "scale-105" : "scale-100"
                }`}
                animate={
                  match.current_team === "red"
                    ? { opacity: [0.8, 1, 0.8] }
                    : { opacity: 1 }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg ${
                      match.current_team === "red"
                        ? "ring-4 ring-red-400/50 shadow-red-500/50"
                        : ""
                    }`}
                  >
                    <span className="text-white font-bold text-2xl">R</span>
                  </div>
                  <div>
                    <div className="text-red-400 font-bold text-3xl tracking-wide">
                      {match.team_red_name}
                    </div>
                    {match.team_red_roll && (
                      <div className="text-white/80 text-lg">
                        Roll: <span className="font-bold">{match.team_red_roll}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Center - Phase Info & Timer */}
              <div className="flex flex-col items-center gap-3 px-8">
                <div className="flex items-center gap-3">
                  <Swords className="w-8 h-8 text-purple-400" />
                  <div className="text-center">
                    <div className="text-white font-bold text-2xl uppercase tracking-wider">
                      {match.status === "waiting" && "Waiting"}
                      {match.status === "rolling" && "Roll Phase"}
                      {match.status === "banning" && "Ban Phase"}
                      {match.status === "picking" && "Pick Phase"}
                      {match.status === "completed" && "Completed"}
                    </div>
                    {(match.status === "banning" || match.status === "picking") && (
                      <div className="text-gray-300 text-sm">
                        {match.current_team === "red"
                          ? match.team_red_name
                          : match.team_blue_name}
                        &apos;s turn
                      </div>
                    )}
                  </div>
                </div>

                {match.timer_ends_at && (
                  <motion.div
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl ${
                      timeRemaining <= 10
                        ? "bg-red-600/90 shadow-lg shadow-red-500/50"
                        : "bg-purple-600/80"
                    }`}
                    animate={
                      timeRemaining <= 10
                        ? { scale: [1, 1.1, 1], boxShadow: ["0 0 20px rgba(239, 68, 68, 0.5)", "0 0 40px rgba(239, 68, 68, 0.8)", "0 0 20px rgba(239, 68, 68, 0.5)"] }
                        : {}
                    }
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    <Timer className="w-6 h-6 text-white" />
                    <div className="text-white font-bold text-3xl tabular-nums">
                      {timeRemaining}
                    </div>
                  </motion.div>
                )}

                {isCaptain && (
                  <div className="text-pink-400 text-sm font-medium">
                    Captain for{" "}
                    {myTeam === "red" ? match.team_red_name : match.team_blue_name}
                  </div>
                )}

                {isCaptain &&
                  match.current_team === myTeam &&
                  (match.status === "banning" || match.status === "picking") && (
                    <motion.div
                      className="px-4 py-2 bg-gradient-to-r from-pink-500/40 to-purple-500/40 rounded-lg border-2 border-pink-400/60"
                      animate={{
                        borderColor: [
                          "rgba(244, 114, 182, 0.6)",
                          "rgba(192, 132, 252, 0.8)",
                          "rgba(244, 114, 182, 0.6)",
                        ],
                        boxShadow: [
                          "0 0 20px rgba(244, 114, 182, 0.3)",
                          "0 0 30px rgba(192, 132, 252, 0.5)",
                          "0 0 20px rgba(244, 114, 182, 0.3)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="text-pink-100 font-bold text-sm uppercase">
                        ⚡ Your turn to {match.status === "banning" ? "ban" : "pick"}!
                      </div>
                    </motion.div>
                  )}
              </div>

              {/* Blue Team */}
              <motion.div
                className={`flex-1 transition-all duration-500 ${
                  match.current_team === "blue" ? "scale-105" : "scale-100"
                }`}
                animate={
                  match.current_team === "blue"
                    ? { opacity: [0.8, 1, 0.8] }
                    : { opacity: 1 }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-4 justify-end">
                  <div>
                    <div className="text-blue-400 font-bold text-3xl tracking-wide text-right">
                      {match.team_blue_name}
                    </div>
                    {match.team_blue_roll && (
                      <div className="text-white/80 text-lg text-right">
                        Roll: <span className="font-bold">{match.team_blue_roll}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg ${
                      match.current_team === "blue"
                        ? "ring-4 ring-blue-400/50 shadow-blue-500/50"
                        : ""
                    }`}
                  >
                    <span className="text-white font-bold text-2xl">B</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Roll Button */}
            {match.status === "rolling" &&
              isCaptain &&
              !actions.find((a) => a.team === myTeam && a.action_type === "roll") && (
                <motion.button
                  onClick={handleRoll}
                  className="mt-4 mx-auto block px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all text-2xl shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎲 ROLL!
                </motion.button>
              )}

            {/* Skip Ban Button */}
            {match.status === "banning" &&
              isCaptain &&
              match.current_team === myTeam && (
                <motion.button
                  onClick={() => handleBan(null)}
                  className="mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-lg transition-all text-sm border border-gray-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Skip Ban (No Ban)
                </motion.button>
              )}
          </div>
        </div>

        {/* Pick Order Timeline */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 py-3 px-6">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {Array.from({ length: numPicks + 1 }).map((_, index) => {
                const pick = getPickedMaps()[index];
                const isTB = index === numPicks;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex-shrink-0 relative ${
                      pick
                        ? isTB || pick.team === "tiebreaker"
                          ? "ring-2 ring-yellow-400"
                          : pick.team === "red"
                          ? "ring-2 ring-red-400"
                          : "ring-2 ring-blue-400"
                        : "border-2 border-dashed border-gray-600"
                    } rounded-lg overflow-hidden w-28 h-20 bg-gray-800/50`}
                  >
                    {pick ? (
                      <>
                        <img
                          src={pick.beatmap.cover_url}
                          alt={pick.beatmap.title}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute inset-0 ${
                            isTB || pick.team === "tiebreaker"
                              ? "bg-yellow-500/40"
                              : pick.team === "red"
                              ? "bg-red-500/40"
                              : "bg-blue-500/40"
                          } flex flex-col items-center justify-center`}
                        >
                          <span className="text-white font-bold text-xs">
                            {isTB || pick.team === "tiebreaker" ? "TB" : `#${index + 1}`}
                          </span>
                          <span className="text-white text-[10px]">
                            {pick.beatmap.mod_pool}
                            {pick.beatmap.mod_index}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span className="text-gray-500 text-2xl">?</span>
                        <span className="text-gray-500 text-[10px]">
                          {isTB ? "TB" : `#${index + 1}`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left - Red Team Picks & Bans */}
        <div className="w-64 flex flex-col gap-4">
          {/* Red Team Picks */}
          <div className="flex-1 bg-red-950/20 backdrop-blur-md rounded-xl p-4 border-2 border-red-500/30 overflow-y-auto">
            <h3 className="text-red-400 font-bold text-lg mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Red Picks
            </h3>
            <div className="space-y-2">
              {getPickedMaps()
                .filter((p) => p.team === "red")
                .map((pick, index) => (
                  <motion.div
                    key={pick.beatmap.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={pick.beatmap.cover_url}
                      alt={pick.beatmap.title}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-2">
                      <div className="text-white font-bold text-sm">
                        {pick.beatmap.mod_pool}
                        {pick.beatmap.mod_index}
                      </div>
                      <div className="text-white/80 text-xs truncate">
                        {pick.beatmap.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Red Team Bans */}
          <div className="bg-red-950/20 backdrop-blur-md rounded-xl p-4 border-2 border-red-500/30">
            <h3 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Red Bans
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {getBannedMaps()
                .filter((b) => b.team === "red")
                .map((ban, index) => (
                  <motion.div
                    key={ban.beatmap.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={ban.beatmap.cover_url}
                      alt={ban.beatmap.title}
                      className="w-full h-16 object-cover grayscale brightness-50"
                    />
                    <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center border border-red-400">
                      <span className="text-white font-bold text-xs">
                        {ban.beatmap.mod_pool}
                        {ban.beatmap.mod_index}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>

        {/* Center - Map Pool */}
        <div className="flex-1 bg-gradient-to-br from-purple-950/30 via-gray-950/40 to-purple-950/30 backdrop-blur-md rounded-xl p-6 border-2 border-purple-500/20 overflow-y-auto">
          <h2 className="text-white font-bold text-2xl mb-4 text-center uppercase tracking-wider">
            Map Pool
          </h2>
          <div className="space-y-6">
            {Object.entries(groupedBeatmaps).map(([modPool, maps]) => {
              const isTiebreaker = modPool === "TB";

              return (
                <div key={modPool}>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/50"></div>
                    <h3 className="text-white font-bold text-xl px-4 py-1 bg-purple-500/20 rounded-full border border-purple-400/30">
                      {modPool}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/50"></div>
                    {isTiebreaker && (
                      <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 rounded-full text-yellow-400 text-xs font-bold">
                        TIEBREAKER
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {maps.map((map) => {
                        const isBanned = actions.some(
                          (a) => a.action_type === "ban" && a.beatmap_id === map.id
                        );
                        const isPicked = actions.some(
                          (a) => a.action_type === "pick" && a.beatmap_id === map.id
                        );
                        const pickedByTeam = actions.find(
                          (a) => a.action_type === "pick" && a.beatmap_id === map.id
                        )?.team;

                        const canInteract =
                          !isTiebreaker &&
                          isCaptain &&
                          match.current_team === myTeam &&
                          !isBanned &&
                          !isPicked;

                        return (
                          <motion.div
                            key={map.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={
                              canInteract ? { scale: 1.05, zIndex: 10 } : {}
                            }
                            className="relative rounded-xl overflow-hidden group cursor-pointer shadow-lg"
                          >
                            <img
                              src={map.cover_url}
                              alt={map.title}
                              className={`w-full h-32 object-cover transition-all duration-300 ${
                                isBanned
                                  ? "grayscale brightness-50"
                                  : isPicked
                                  ? "brightness-75"
                                  : canInteract
                                  ? "group-hover:brightness-110"
                                  : ""
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-3">
                              <div className="text-white font-bold text-sm">
                                {map.mod_pool}
                                {map.mod_index}
                              </div>
                              <div className="text-white text-xs truncate">
                                {map.title}
                              </div>
                              <div className="text-gray-300 text-xs">
                                {map.star_rating.toFixed(2)}★
                              </div>
                            </div>

                            {/* Banned Overlay */}
                            {isBanned && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-gray-900/90 flex flex-col items-center justify-center border-2 border-red-500"
                              >
                                <Shield className="w-8 h-8 text-white mb-1" />
                                <span className="text-white font-bold text-sm">
                                  BANNED
                                </span>
                              </motion.div>
                            )}

                            {/* Picked Overlay */}
                            {isPicked && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`absolute inset-0 ${
                                  pickedByTeam === "red"
                                    ? "bg-gradient-to-br from-red-500/80 to-red-900/80 border-red-400"
                                    : "bg-gradient-to-br from-blue-500/80 to-blue-900/80 border-blue-400"
                                } flex flex-col items-center justify-center border-2`}
                              >
                                <Trophy className="w-8 h-8 text-white mb-1" />
                                <span className="text-white font-bold text-sm">
                                  PICKED
                                </span>
                                <span className="text-white/90 text-xs mt-1">
                                  {pickedByTeam === "red" ? "RED" : "BLUE"}
                                </span>
                              </motion.div>
                            )}

                            {/* Tiebreaker Lock */}
                            {isTiebreaker && !isBanned && !isPicked && (
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/50 to-orange-600/50 flex flex-col items-center justify-center border-2 border-yellow-500 pointer-events-none">
                                <span className="text-white font-bold text-xs">
                                  🔒 FINAL MAP 🔒
                                </span>
                              </div>
                            )}

                            {/* Ban Button */}
                            {canInteract && match.status === "banning" && (
                              <motion.button
                                onClick={() => handleBan(map.id)}
                                className="absolute inset-0 bg-red-600/0 hover:bg-red-600/90 transition-all flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  ⛔ BAN
                                </span>
                              </motion.button>
                            )}

                            {/* Pick Button */}
                            {canInteract && match.status === "picking" && (
                              <motion.button
                                onClick={() => handlePick(map.id)}
                                className="absolute inset-0 bg-green-600/0 hover:bg-green-600/90 transition-all flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  ✓ PICK
                                </span>
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right - Blue Team Picks & Bans */}
        <div className="w-64 flex flex-col gap-4">
          {/* Blue Team Picks */}
          <div className="flex-1 bg-blue-950/20 backdrop-blur-md rounded-xl p-4 border-2 border-blue-500/30 overflow-y-auto">
            <h3 className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Blue Picks
            </h3>
            <div className="space-y-2">
              {getPickedMaps()
                .filter((p) => p.team === "blue")
                .map((pick, index) => (
                  <motion.div
                    key={pick.beatmap.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={pick.beatmap.cover_url}
                      alt={pick.beatmap.title}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-2">
                      <div className="text-white font-bold text-sm">
                        {pick.beatmap.mod_pool}
                        {pick.beatmap.mod_index}
                      </div>
                      <div className="text-white/80 text-xs truncate">
                        {pick.beatmap.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Blue Team Bans */}
          <div className="bg-blue-950/20 backdrop-blur-md rounded-xl p-4 border-2 border-blue-500/30">
            <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Blue Bans
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {getBannedMaps()
                .filter((b) => b.team === "blue")
                .map((ban, index) => (
                  <motion.div
                    key={ban.beatmap.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={ban.beatmap.cover_url}
                      alt={ban.beatmap.title}
                      className="w-full h-16 object-cover grayscale brightness-50"
                    />
                    <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center border border-blue-400">
                      <span className="text-white font-bold text-xs">
                        {ban.beatmap.mod_pool}
                        {ban.beatmap.mod_index}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
