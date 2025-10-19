export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stages: {
        Row: {
          id: string;
          name: string;
          best_of: number;
          num_bans: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          best_of: number;
          num_bans: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          best_of?: number;
          num_bans?: number;
          created_at?: string;
        };
      };
      beatmaps: {
        Row: {
          id: string;
          beatmap_id: number;
          stage_id: string;
          mod_pool: "NM" | "HD" | "HR" | "FM" | "DT" | "TB";
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
        };
        Insert: {
          id?: string;
          beatmap_id: number;
          stage_id: string;
          mod_pool: "NM" | "HD" | "HR" | "FM" | "DT" | "TB";
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
          created_at?: string;
        };
        Update: {
          id?: string;
          beatmap_id?: number;
          stage_id?: string;
          mod_pool?: "NM" | "HD" | "HR" | "FM" | "DT" | "TB";
          mod_index?: number;
          title?: string;
          artist?: string;
          difficulty_name?: string;
          star_rating?: number;
          bpm?: number;
          length?: number;
          cs?: number;
          ar?: number;
          od?: number;
          hp?: number;
          cover_url?: string;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          stage_id: string;
          team_red_name: string;
          team_blue_name: string;
          team_red_captain_id: number;
          team_blue_captain_id: number;
          team_red_captain_token: string;
          team_blue_captain_token: string;
          spectator_token: string;
          roll_winner: "red" | "blue" | null;
          team_red_roll: number | null;
          team_blue_roll: number | null;
          status: "waiting" | "rolling" | "banning" | "picking" | "completed";
          current_action: string | null;
          current_team: "red" | "blue" | null;
          timer_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          team_red_name: string;
          team_blue_name: string;
          team_red_captain_id: number;
          team_blue_captain_id: number;
          team_red_captain_token?: string;
          team_blue_captain_token?: string;
          spectator_token?: string;
          roll_winner?: "red" | "blue" | null;
          team_red_roll?: number | null;
          team_blue_roll?: number | null;
          status?: "waiting" | "rolling" | "banning" | "picking" | "completed";
          current_action?: string | null;
          current_team?: "red" | "blue" | null;
          timer_ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stage_id?: string;
          team_red_name?: string;
          team_blue_name?: string;
          team_red_captain_id?: number;
          team_blue_captain_id?: number;
          team_red_captain_token?: string;
          team_blue_captain_token?: string;
          spectator_token?: string;
          roll_winner?: "red" | "blue" | null;
          team_red_roll?: number | null;
          team_blue_roll?: number | null;
          status?: "waiting" | "rolling" | "banning" | "picking" | "completed";
          current_action?: string | null;
          current_team?: "red" | "blue" | null;
          timer_ends_at?: string | null;
          created_at?: string;
        };
      };
      match_actions: {
        Row: {
          id: string;
          match_id: string;
          team: "red" | "blue";
          action_type: "ban" | "pick" | "roll";
          beatmap_id: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team: "red" | "blue";
          action_type: "ban" | "pick" | "roll";
          beatmap_id?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          team?: "red" | "blue";
          action_type?: "ban" | "pick" | "roll";
          beatmap_id?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
