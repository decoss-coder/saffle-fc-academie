export type UserRole =
  | "admin"
  | "president"
  | "board"
  | "treasurer"
  | "coach"
  | "parent"
  | "player_formation"
  | "player_team_a"
  | "communication"
  | "logistics";

export type { Database } from "./database.types";

export function createSupabaseConfig(
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined,
): { supabaseUrl: string; supabaseAnonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables Supabase manquantes. Définissez l'URL et la clé anon du projet.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
