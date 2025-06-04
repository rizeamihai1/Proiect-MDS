export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          favorite_teams: string[]
          favorite_leagues: string[]
          favorite_bookmakers: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          favorite_teams?: string[]
          favorite_leagues?: string[]
          favorite_bookmakers?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          favorite_teams?: string[]
          favorite_leagues?: string[]
          favorite_bookmakers?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          team1: string
          team2: string
          match_date: string
          league: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team1: string
          team2: string
          match_date: string
          league?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team1?: string
          team2?: string
          match_date?: string
          league?: string
          created_at?: string
          updated_at?: string
        }
      }
      odds: {
        Row: {
          id: string
          match_id: string
          bookmaker: string
          home_win: number
          draw: number
          away_win: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          bookmaker: string
          home_win: number
          draw: number
          away_win: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          bookmaker?: string
          home_win?: number
          draw?: number
          away_win?: number
          created_at?: string
          updated_at?: string
        }
      }
      saved_bets: {
        Row: {
          id: string
          user_id: string
          match_id: string
          bookmaker: string
          bet_type: string
          odds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          bookmaker: string
          bet_type: string
          odds: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          bookmaker?: string
          bet_type?: string
          odds?: number
          created_at?: string
        }
      }
      scraped_matches: {
        Row: {
          id: string
          team1: string
          team2: string
          match_date: string
          league: string
          created_at: string
        }
        Insert: {
          id?: string
          team1: string
          team2: string
          match_date: string
          league?: string
          created_at?: string
        }
        Update: {
          id?: string
          team1?: string
          team2?: string
          match_date?: string
          league?: string
          created_at?: string
        }
      }
      scraper_metadata: {
        Row: {
          id: string
          last_updated: string
          match_count: number
          created_at: string
        }
        Insert: {
          id?: string
          last_updated: string
          match_count: number
          created_at?: string
        }
        Update: {
          id?: string
          last_updated?: string
          match_count?: number
          created_at?: string
        }
      }
    }
  }
}
