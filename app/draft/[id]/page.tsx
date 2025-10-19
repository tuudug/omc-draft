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
    const bannedIds = actions
      .filter((a) => a.action_type === "ban" && a.beatmap_id)
      .map((a) => a.beatmap_id);
    const pickedIds = actions
      .filter((a) => a.action_type === "pick" && a.beatmap_id)
      .map((a) => a.beatmap_id);

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
      .map((a) => beatmaps.find((b) => b.id === a.beatmap_id))
      .filter(Boolean) as Beatmap[];
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
      className={`h-screen overflow-hidden flex flex-col p-3 transition-all duration-1000 ${getBackgroundGlow()}`}
    >
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Header */}
        <div
          className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-2xl flex-shrink-0 transition-all duration-1000 ${
            match.current_team === "red"
              ? "ring-2 ring-red-500/30 shadow-red-500/20"
              : match.current_team === "blue"
              ? "ring-2 ring-blue-500/30 shadow-blue-500/20"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-red-400 font-bold text-xl">
                  {match.team_red_name}
                </div>
                {match.team_red_roll && (
                  <div className="text-white text-lg">
                    Roll: {match.team_red_roll}
                  </div>
                )}
              </div>
              <Swords className="w-6 h-6 text-white" />
              <div className="text-center">
                <div className="text-blue-400 font-bold text-xl">
                  {match.team_blue_name}
                </div>
                {match.team_blue_roll && (
                  <div className="text-white text-lg">
                    Roll: {match.team_blue_roll}
                  </div>
                )}
              </div>
            </div>

            {match.timer_ends_at && (
              <motion.div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeRemaining <= 10
                    ? "bg-red-600 animate-pulse"
                    : "bg-purple-600"
                }`}
                animate={timeRemaining <= 10 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Timer className="w-5 h-5 text-white" />
                <div className="text-white font-bold text-xl">
                  {timeRemaining}s
                </div>
              </motion.div>
            )}
          </div>

          <div className="text-center">
            <div className="text-white text-base">
              {match.status === "waiting" && "Waiting for captains..."}
              {match.status === "rolling" && "Roll phase - Click ROLL!"}
              {match.status === "banning" &&
                `Ban phase - ${
                  match.current_team === "red"
                    ? match.team_red_name
                    : match.team_blue_name
                }'s turn`}
              {match.status === "picking" &&
                `Pick phase - ${
                  match.current_team === "red"
                    ? match.team_red_name
                    : match.team_blue_name
                }'s turn`}
              {match.status === "completed" && "Draft completed!"}
            </div>
            {isCaptain && (
              <div className="mt-1 text-pink-400 text-sm">
                Captain for{" "}
                {myTeam === "red" ? match.team_red_name : match.team_blue_name}
              </div>
            )}
            {/* YOUR TURN INDICATOR */}
            {isCaptain &&
              match.current_team === myTeam &&
              (match.status === "banning" || match.status === "picking") && (
                <motion.div
                  className="mt-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-lg border border-pink-400/50"
                  animate={{
                    borderColor: [
                      "rgba(244, 114, 182, 0.5)",
                      "rgba(192, 132, 252, 0.5)",
                      "rgba(244, 114, 182, 0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-pink-200 font-medium text-xs">
                    Your turn to {match.status === "banning" ? "ban" : "pick"}
                  </div>
                </motion.div>
              )}
          </div>

          {match.status === "rolling" &&
            isCaptain &&
            !actions.find(
              (a) => a.team === myTeam && a.action_type === "roll"
            ) && (
              <button
                onClick={handleRoll}
                className="mt-3 w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all text-lg"
              >
                ROLL!
              </button>
            )}

          {/* No Ban Button */}
          {match.status === "banning" &&
            isCaptain &&
            match.current_team === myTeam && (
              <button
                onClick={() => handleBan(null)}
                className="mt-3 w-full py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-lg transition-all text-sm border border-gray-500"
              >
                Skip Ban (No Ban)
              </button>
            )}
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-3 overflow-hidden">
          {/* Left Column: Pick Order & Banned Maps */}
          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            {/* Pick Order - Always Visible with Slots */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Pick Order</h2>
              <div className="space-y-1.5">
                {Array.from({ length: numPicks + 1 }).map((_, index) => {
                  const pick = getPickedMaps()[index];
                  const isTB = index === numPicks; // Last slot is always TB

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed ${
                        pick
                          ? isTB || pick.team === "tiebreaker"
                            ? "bg-yellow-900/30 border-yellow-500 border-solid"
                            : pick.team === "red"
                            ? "bg-red-900/30 border-red-500 border-solid"
                            : "bg-blue-900/30 border-blue-500 border-solid"
                          : "bg-white/5 border-gray-500"
                      }`}
                    >
                      <div
                        className={`font-bold text-sm w-6 ${
                          pick ? "text-white" : "text-gray-500"
                        }`}
                      >
                        #{index + 1}
                      </div>

                      {pick ? (
                        <>
                          <div className="relative flex-shrink-0">
                            <img
                              src={pick.beatmap.cover_url}
                              alt={pick.beatmap.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                            <div
                              className={`absolute inset-0 ${
                                isTB || pick.team === "tiebreaker"
                                  ? "bg-yellow-500/30 border-yellow-400"
                                  : pick.team === "red"
                                  ? "bg-red-500/30 border-red-400"
                                  : "bg-blue-500/30 border-blue-400"
                              } rounded flex items-center justify-center border`}
                            >
                              <span className="text-white font-bold text-[10px]">
                                {isTB || pick.team === "tiebreaker"
                                  ? "TB"
                                  : "PICKED"}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-xs truncate">
                              {pick.beatmap.title}
                            </div>
                            <div className="text-gray-300 text-[10px]">
                              {pick.beatmap.mod_pool}
                              {pick.beatmap.mod_index} (
                              {pick.beatmap.star_rating.toFixed(2)}★)
                            </div>
                          </div>
                          {!isTB && pick.team !== "tiebreaker" && (
                            <div
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                pick.team === "red"
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {pick.team === "red" ? "RED" : "BLUE"}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-10 bg-gray-800/50 rounded flex items-center justify-center">
                            <span className="text-gray-600 text-xs">?</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-500 text-xs">
                              {isTB ? "Tiebreaker" : "Waiting..."}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Banned Maps - Always Visible with Slots */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Bans ({getBannedMaps().length}/{numBans * 2})
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: numBans * 2 }).map((_, index) => {
                  const bannedMap = getBannedMaps()[index];

                  return bannedMap ? (
                    <motion.div
                      key={bannedMap.id}
                      className="relative"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <img
                        src={bannedMap.cover_url}
                        alt={bannedMap.title}
                        className="w-full h-16 object-cover rounded-lg grayscale brightness-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 to-gray-900/80 rounded-lg flex flex-col items-center justify-center border-2 border-red-500">
                        <Shield className="w-4 h-4 text-white" />
                        <span className="text-white font-bold text-[10px]">
                          {bannedMap.mod_pool}
                          {bannedMap.mod_index}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div
                      key={`ban-slot-${index}`}
                      className="relative border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/30"
                    >
                      <div className="w-full h-16 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Map Pool */}
          <div className="col-span-9 bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-2xl overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-3">Map Pool</h2>
            <div className="space-y-4">
              {Object.entries(groupedBeatmaps).map(([modPool, maps]) => {
                const isTiebreaker = modPool === "TB";

                return (
                  <div key={modPool}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {modPool}
                      </h3>
                      {isTiebreaker && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500 rounded-full text-yellow-400 text-[10px] font-bold">
                          AUTO FINAL MAP
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      <AnimatePresence>
                        {maps.map((map) => {
                          const isBanned = actions.some(
                            (a) =>
                              a.action_type === "ban" && a.beatmap_id === map.id
                          );
                          const isPicked = actions.some(
                            (a) =>
                              a.action_type === "pick" &&
                              a.beatmap_id === map.id
                          );
                          const pickedByTeam = actions.find(
                            (a) =>
                              a.action_type === "pick" &&
                              a.beatmap_id === map.id
                          )?.team;

                          // TB cannot be banned or picked - it's automatic
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
                              className="relative rounded-lg overflow-hidden"
                            >
                              <img
                                src={map.cover_url}
                                alt={map.title}
                                className={`w-full h-24 object-cover ${
                                  isBanned
                                    ? "grayscale brightness-50"
                                    : isPicked
                                    ? "brightness-75"
                                    : ""
                                }`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                <div className="text-white font-bold text-xs">
                                  {map.mod_pool}
                                  {map.mod_index}
                                </div>
                                <div className="text-white text-[10px] truncate">
                                  {map.title}
                                </div>
                                <div className="text-gray-300 text-[10px]">
                                  {map.star_rating.toFixed(2)}★
                                </div>
                              </div>

                              {/* Banned Overlay */}
                              {isBanned && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 to-gray-900/80 flex flex-col items-center justify-center border-2 border-red-500">
                                  <Shield className="w-5 h-5 text-white mb-0.5" />
                                  <span className="text-white font-bold text-xs">
                                    BANNED
                                  </span>
                                </div>
                              )}

                              {/* Picked Overlay */}
                              {isPicked && (
                                <div
                                  className={`absolute inset-0 ${
                                    pickedByTeam === "red"
                                      ? "bg-gradient-to-br from-red-500/70 to-red-900/70 border-red-400"
                                      : "bg-gradient-to-br from-blue-500/70 to-blue-900/70 border-blue-400"
                                  } flex flex-col items-center justify-center border-2`}
                                >
                                  <Trophy className="w-5 h-5 text-white mb-0.5" />
                                  <span className="text-white font-bold text-xs">
                                    PICKED
                                  </span>
                                  <span className="text-white/90 text-[10px] mt-0.5">
                                    {pickedByTeam === "red" ? "RED" : "BLUE"}
                                  </span>
                                </div>
                              )}

                              {/* Tiebreaker Lock Overlay */}
                              {isTiebreaker && !isBanned && !isPicked && (
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/40 to-orange-600/40 flex flex-col items-center justify-center border-2 border-yellow-500 pointer-events-none">
                                  <span className="text-white font-bold text-[10px]">
                                    🔒 FINAL MAP 🔒
                                  </span>
                                </div>
                              )}

                              {/* Ban Button */}
                              {canInteract && match.status === "banning" && (
                                <button
                                  onClick={() => handleBan(map.id)}
                                  className="absolute inset-0 bg-red-600/0 hover:bg-red-600/80 transition-all flex items-center justify-center group"
                                >
                                  <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    BAN
                                  </span>
                                </button>
                              )}

                              {/* Pick Button */}
                              {canInteract && match.status === "picking" && (
                                <button
                                  onClick={() => handlePick(map.id)}
                                  className="absolute inset-0 bg-green-600/0 hover:bg-green-600/80 transition-all flex items-center justify-center group"
                                >
                                  <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    PICK
                                  </span>
                                </button>
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
        </div>
      </div>
    </div>
  );
}
