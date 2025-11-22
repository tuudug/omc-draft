"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match, Beatmap, MatchAction, Team, RollPreference } from "@/types";

// Import new components
import { DiceRoll } from "@/components/draft/DiceRoll";
import { PreferenceSelector } from "@/components/draft/PreferenceSelector";
import { EnhancedMapCard } from "@/components/draft/EnhancedMapCard";
import { PhaseIndicator } from "@/components/draft/PhaseIndicator";
import { AudioManager } from "@/components/draft/AudioManager";
import { AdminControls } from "@/components/draft/AdminControls";
import { ExportModal } from "@/components/draft/ExportModal";

export default function DraftPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id as string;
  const token = searchParams.get("token");
  const teamParam = searchParams.get("team") as Team | null;

  // Match state
  const [match, setMatch] = useState<Match | null>(null);
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myTeam, setMyTeam] = useState<"red" | "blue" | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);
  const [numBans, setNumBans] = useState(0);
  const [numPicks, setNumPicks] = useState(0);

  // UI state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");

  // Roll animation state
  const [isRollingRed, setIsRollingRed] = useState(false);
  const [isRollingBlue, setIsRollingBlue] = useState(false);

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
          if (payload.new) {
            setActions((prev) => [...prev, payload.new as MatchAction]);
            setLastAction((payload.new as MatchAction).action_type);
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

      // Check if user is captain or admin
      if (token === typedMatchData.team_red_captain_token) {
        setIsCaptain(true);
        setMyTeam("red");
      } else if (token === typedMatchData.team_blue_captain_token) {
        setIsCaptain(true);
        setMyTeam("blue");
      } else if (token === typedMatchData.admin_token) {
        setIsCaptain(true); // Admins act as super-captains
        setIsAdmin(true);
      }

      // Fetch stage info
      const { data: stageData } = await supabase
        .from("stages")
        .select("best_of, num_bans")
        .eq("id", typedMatchData.stage_id)
        .single();

      if (stageData) {
        setNumBans((stageData as { num_bans: number }).num_bans);
        setNumPicks((stageData as { best_of: number }).best_of - 1);
      }

      // Fetch beatmaps
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
        const availableMaps = getAvailableMaps();
        if (availableMaps.length > 0) {
          const randomMap =
            availableMaps[Math.floor(Math.random() * availableMaps.length)];
          await handlePick(randomMap.id, true);
        }
      } else if (match.status === "banning") {
        await performAction("ban", null);
      } else if (match.status === "preference_selection") {
        // Auto-select first_pick as default
        await handlePreferenceSelect("first_pick");
      }
    } finally {
      setIsHandlingTimeout(false);
    }
  };

  const handleRoll = async () => {
    if (!isCaptain || !myTeam) return;

    // Start rolling animation
    if (myTeam === "red") {
      setIsRollingRed(true);
    } else {
      setIsRollingBlue(true);
    }

    const roll = Math.floor(Math.random() * 100) + 1;

    await supabase
      .from("matches")
      .update({
        [`team_${myTeam}_roll`]: roll,
      } as never)
      .eq("id", matchId);

    // Keep rolling animation for 2 seconds
    setTimeout(() => {
      if (myTeam === "red") {
        setIsRollingRed(false);
      } else {
        setIsRollingBlue(false);
      }
    }, 2000);

    await performAction("roll", null);
  };

  const handlePreferenceSelect = async (preference: RollPreference) => {
    if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;
    await performAction("preference", null, preference);
  };

  const handleBan = async (beatmapId: string | null) => {
    if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;
    await performAction("ban", beatmapId);
  };

  const handlePick = async (beatmapId: string, isTimeout: boolean = false) => {
    if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;
    await performAction("pick", beatmapId);
  };

  const performAction = async (
    actionType: "roll" | "ban" | "pick" | "preference",
    beatmapId: string | null,
    preference?: RollPreference
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
          preference,
        }),
      });
    } catch (error) {
      console.error("Error performing action:", error);
    }
  };

  const handleUndo = async () => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/matches/${matchId}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo" }),
      });
    } catch (error) {
      console.error("Error performing undo:", error);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/matches/${matchId}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
    } catch (error) {
      console.error("Error performing reset:", error);
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

    // Add TB at the end if all picks are done
    if (
      match?.status === "completed" ||
      (picked.length > 0 &&
        match?.status !== "banning" &&
        match?.status !== "rolling" &&
        match?.status !== "preference_selection")
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

  const getActionCounter = (): string => {
    if (match?.status === "banning") {
      const bansCount = actions.filter((a) => a.action_type === "ban").length;
      return `Ban ${bansCount + 1} of ${numBans * 2}`;
    } else if (match?.status === "picking") {
      const picksCount = actions.filter((a) => a.action_type === "pick").length;
      return `Pick ${picksCount + 1} of ${numPicks}`;
    }
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-white text-xl">Loading draft...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-white text-xl">Match not found</div>
      </div>
    );
  }

  const teamRedColor = match.team_red_color || "#EF4444";
  const teamBlueColor = match.team_blue_color || "#3B82F6";

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden flex flex-col">
      {/* Audio Manager */}
      <AudioManager
        enabled={audioEnabled}
        status={match.status}
        timeRemaining={timeRemaining}
        onBan={lastAction === "ban"}
        onPick={lastAction === "pick"}
        onRoll={lastAction === "roll"}
      />

      {/* Admin Controls */}
      <AdminControls
        isAdmin={isAdmin}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onExport={() => setShowExportModal(true)}
        onUndo={handleUndo}
        onReset={handleReset}
        canUndo={actions.length > 0}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        match={match}
        beatmaps={beatmaps}
        actions={actions}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 px-3 py-2">
        {/* Tournament Header */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-white">
            {match.tournament_name || "osu! Mongolia Cup 2025"}
          </h1>
          <div className="text-sm text-purple-300">
            {match.team_red_name} vs {match.team_blue_name}
          </div>
        </motion.div>

        {/* Phase Indicator */}
        <div className="mb-2">
          <PhaseIndicator
            status={match.status}
            currentTeam={match.current_team === "red" || match.current_team === "blue" ? match.current_team : undefined}
            currentTeamName={
              match.current_team === "red"
                ? match.team_red_name
                : match.current_team === "blue"
                ? match.team_blue_name
                : undefined
            }
            teamColor={
              match.current_team === "red"
                ? teamRedColor
                : match.current_team === "blue"
                ? teamBlueColor
                : undefined
            }
            timeRemaining={timeRemaining}
            actionCounter={getActionCounter()}
          />
        </div>

        {/* Rolling Phase */}
        {match.status === "rolling" && (
          <motion.div
            className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <DiceRoll
              team="red"
              teamName={match.team_red_name}
              teamColor={teamRedColor}
              rollValue={match.team_red_roll}
              isRolling={isRollingRed}
              onRoll={handleRoll}
              canRoll={
                isCaptain &&
                myTeam === "red" &&
                !actions.find((a) => a.team === "red" && a.action_type === "roll")
              }
            />
            <DiceRoll
              team="blue"
              teamName={match.team_blue_name}
              teamColor={teamBlueColor}
              rollValue={match.team_blue_roll}
              isRolling={isRollingBlue}
              onRoll={handleRoll}
              canRoll={
                isCaptain &&
                myTeam === "blue" &&
                !actions.find((a) => a.team === "blue" && a.action_type === "roll")
              }
            />
          </motion.div>
        )}

        {/* Preference Selection Phase */}
        {match.status === "preference_selection" &&
         match.roll_winner &&
         (match.roll_winner === "red" || match.roll_winner === "blue") && (
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PreferenceSelector
              winnerTeam={match.roll_winner}
              winnerName={
                match.roll_winner === "red"
                  ? match.team_red_name
                  : match.team_blue_name
              }
              winnerColor={
                match.roll_winner === "red" ? teamRedColor : teamBlueColor
              }
              loserName={
                match.roll_winner === "red"
                  ? match.team_blue_name
                  : match.team_red_name
              }
              loserColor={
                match.roll_winner === "red" ? teamBlueColor : teamRedColor
              }
              canSelect={isCaptain && myTeam === match.current_team}
              onSelect={handlePreferenceSelect}
              winnerPreference={match.roll_winner_preference}
              loserPreference={match.roll_loser_preference}
              currentTeam={
                match.current_team === "tiebreaker"
                  ? null
                  : match.current_team
              }
            />
          </motion.div>
        )}

        {/* Pick Order Timeline */}
        {(match.status === "banning" ||
          match.status === "picking" ||
          match.status === "completed") && (
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg py-2 px-3 mb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
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
                          ? "ring-1 ring-yellow-400"
                          : pick.team === "red"
                          ? "ring-1 ring-red-400"
                          : "ring-1 ring-blue-400"
                        : "border border-dashed border-gray-600"
                    } rounded overflow-hidden w-16 h-12 bg-gray-800/50`}
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
        )}

        {/* Main Draft Layout */}
        {(match.status === "banning" ||
          match.status === "picking" ||
          match.status === "completed") && (
          <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
            {/* Red Team Column */}
            <div className="col-span-2 flex flex-col gap-2 min-h-0">
              {/* Red Picks */}
              <div className="flex-1 bg-red-950/20 backdrop-blur-md rounded-lg p-2 border border-red-500/30 overflow-y-auto">
                <h3 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Red Picks
                </h3>
                <div className="space-y-1.5">
                  {getPickedMaps()
                    .filter((p) => p.team === "red")
                    .map((pick) => (
                      <motion.div
                        key={pick.beatmap.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded overflow-hidden"
                      >
                        <img
                          src={pick.beatmap.cover_url}
                          alt={pick.beatmap.title}
                          className="w-full h-12 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-1">
                          <div className="text-white font-bold text-xs">
                            {pick.beatmap.mod_pool}
                            {pick.beatmap.mod_index}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Red Bans */}
              <div className="bg-red-950/20 backdrop-blur-md rounded-lg p-2 border border-red-500/30">
                <h3 className="text-red-400 font-bold text-xs mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Bans
                </h3>
                <div className="grid grid-cols-2 gap-1">
                  {getBannedMaps()
                    .filter((b) => b.team === "red")
                    .map((ban) => (
                      <motion.div
                        key={ban.beatmap.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded overflow-hidden"
                      >
                        <img
                          src={ban.beatmap.cover_url}
                          alt={ban.beatmap.title}
                          className="w-full h-8 object-cover grayscale brightness-50"
                        />
                        <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
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

            {/* Map Pool */}
            <div className="col-span-8 bg-gradient-to-br from-purple-950/30 via-gray-950/40 to-purple-950/30 backdrop-blur-md rounded-lg p-3 border border-purple-500/20 overflow-y-auto">
              <h2 className="text-white font-bold text-lg mb-3 text-center uppercase tracking-wide">
                Map Pool
              </h2>
              <div className="space-y-3">
                {Object.entries(groupedBeatmaps).map(([modPool, maps]) => {
                  const isTiebreaker = modPool === "TB";

                  return (
                    <div key={modPool}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/50"></div>
                        <h3 className="text-white font-bold text-sm px-3 py-1 bg-purple-500/20 rounded border border-purple-400/30">
                          {modPool}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/50"></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {maps.map((map) => {
                          const isBanned = actions.some(
                            (a) => a.action_type === "ban" && a.beatmap_id === map.id
                          );
                          const isPicked = actions.some(
                            (a) => a.action_type === "pick" && a.beatmap_id === map.id
                          );
                          const pickedByTeam = actions.find(
                            (a) => a.action_type === "pick" && a.beatmap_id === map.id
                          )?.team as "red" | "blue" | undefined;

                          const canInteract =
                            !isTiebreaker &&
                            isCaptain &&
                            match.current_team === myTeam &&
                            !isBanned &&
                            !isPicked;

                          return (
                            <EnhancedMapCard
                              key={map.id}
                              beatmap={map}
                              status={
                                isBanned
                                  ? "banned"
                                  : isPicked
                                  ? "picked"
                                  : isTiebreaker
                                  ? "locked"
                                  : "available"
                              }
                              pickedByTeam={pickedByTeam}
                              teamRedColor={teamRedColor}
                              teamBlueColor={teamBlueColor}
                              canInteract={canInteract}
                              interactionMode={
                                match.status === "banning"
                                  ? "ban"
                                  : match.status === "picking"
                                  ? "pick"
                                  : undefined
                              }
                              onBan={() => handleBan(map.id)}
                              onPick={() => handlePick(map.id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blue Team Column */}
            <div className="col-span-2 flex flex-col gap-2 min-h-0">
              {/* Blue Picks */}
              <div className="flex-1 bg-blue-950/20 backdrop-blur-md rounded-lg p-2 border border-blue-500/30 overflow-y-auto">
                <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Blue Picks
                </h3>
                <div className="space-y-1.5">
                  {getPickedMaps()
                    .filter((p) => p.team === "blue")
                    .map((pick) => (
                      <motion.div
                        key={pick.beatmap.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded overflow-hidden"
                      >
                        <img
                          src={pick.beatmap.cover_url}
                          alt={pick.beatmap.title}
                          className="w-full h-12 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-1">
                          <div className="text-white font-bold text-xs">
                            {pick.beatmap.mod_pool}
                            {pick.beatmap.mod_index}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Blue Bans */}
              <div className="bg-blue-950/20 backdrop-blur-md rounded-lg p-2 border border-blue-500/30">
                <h3 className="text-blue-400 font-bold text-xs mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Bans
                </h3>
                <div className="grid grid-cols-2 gap-1">
                  {getBannedMaps()
                    .filter((b) => b.team === "blue")
                    .map((ban) => (
                      <motion.div
                        key={ban.beatmap.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded overflow-hidden"
                      >
                        <img
                          src={ban.beatmap.cover_url}
                          alt={ban.beatmap.title}
                          className="w-full h-8 object-cover grayscale brightness-50"
                        />
                        <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center">
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
        )}
      </div>
    </div>
  );
}
