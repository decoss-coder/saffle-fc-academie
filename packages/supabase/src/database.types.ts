export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role:
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
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Database["public"]["Tables"]["profiles"]["Row"]["role"];
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      players: {
        Row: {
          id: string;
          matricule: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          gender: string;
          category: string;
          team: string | null;
          user_id: string | null;
          is_archived: boolean;
        };
      };
    };
    Enums: {
      user_role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
    };
  };
};
