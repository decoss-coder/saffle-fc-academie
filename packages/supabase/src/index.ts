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

export type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function createSupabaseConfig(
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined,
): AppConfig {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables Supabase manquantes. Définissez l'URL et la clé anon du projet.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
