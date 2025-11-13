export type ModPool = "NM" | "HD" | "HR" | "FM" | "DT" | "TB";
export type Team = "red" | "blue" | "tiebreaker";
export type MatchStatus =
  | "waiting"
  | "rolling"
  | "preference_selection"
  | "banning"
  | "picking"
  | "completed";
export type ActionType = "ban" | "pick" | "roll" | "preference";
export type RollPreference = "first_pick" | "second_pick" | "first_ban" | "second_ban";

export interface Stage {
  id: string;
  name: string;
  best_of: number;
  num_bans: number;
  created_at: string;
}

export interface Beatmap {
  id: string;
  beatmap_id: number;
  stage_id: string;
  mod_pool: ModPool;
  mod_index: number;
  title: string;
  artist: string;
  difficulty_name: string;
  star_rating: number;
  bpm: number;
  length: number;
  cs: number;
  ar: number;
  od: number;
  hp: number;
  cover_url: string;
  created_at: string;
}

export interface Match {
  id: string;
  stage_id: string;
  team_red_name: string;
  team_blue_name: string;
  team_red_captain_id: number;
  team_blue_captain_id: number;
  team_red_captain_token: string;
  team_blue_captain_token: string;
  spectator_token: string;
  roll_winner: Team | null;
  team_red_roll: number | null;
  team_blue_roll: number | null;
  status: MatchStatus;
  current_action: string | null;
  current_team: Team | null;
  timer_ends_at: string | null;
  created_at: string;
  // New customization fields
  team_red_color?: string;
  team_blue_color?: string;
  team_red_logo_url?: string;
  team_blue_logo_url?: string;
  roll_winner_preference?: RollPreference | null;
  tournament_name?: string;
  tournament_logo_url?: string;
}

export interface MatchAction {
  id: string;
  match_id: string;
  team: Team;
  action_type: ActionType;
  beatmap_id: string | null;
  order_index: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface OsuBeatmap {
  id: number;
  beatmapset_id: number;
  difficulty_rating: number;
  mode: string;
  status: string;
  total_length: number;
  version: string;
  accuracy: number;
  ar: number;
  bpm: number;
  cs: number;
  drain: number;
  hit_length: number;
  beatmapset: {
    artist: string;
    title: string;
    covers: {
      cover: string;
      "cover@2x": string;
      card: string;
      "card@2x": string;
      list: string;
      "list@2x": string;
      slimcover: string;
      "slimcover@2x": string;
    };
  };
}

export interface DraftState {
  match: Match;
  beatmaps: Beatmap[];
  actions: MatchAction[];
}
