// Sample match data to use when database tables don't exist
export const SAMPLE_MATCHES = [
  {
    id: "1",
    team1: "Manchester United",
    team2: "Liverpool",
    match_date: "2025-05-05T15:00:00",
    league: "Premier League - England",
  },
  {
    id: "2",
    team1: "Real Madrid",
    team2: "Barcelona",
    match_date: "2025-05-07T20:00:00",
    league: "La Liga - Spain",
  },
  {
    id: "3",
    team1: "Bayern Munich",
    team2: "Borussia Dortmund",
    match_date: "2025-05-09T17:30:00",
    league: "Bundesliga - Germany",
  },
  {
    id: "4",
    team1: "AC Milan",
    team2: "Inter Milan",
    match_date: "2025-05-11T20:45:00",
    league: "Serie A - Italy",
  },
  {
    id: "5",
    team1: "PSG",
    team2: "Marseille",
    match_date: "2025-05-12T20:00:00",
    league: "Ligue 1 - France",
  },
]

// Sample odds data to use as fallback
export const SAMPLE_ODDS = [
  {
    bookmaker: "Superbet",
    home_win: 2.1,
    draw: 3.4,
    away_win: 3.6,
    updated_at: new Date().toISOString(),
  },
  {
    bookmaker: "MaxBet",
    home_win: 2.05,
    draw: 3.5,
    away_win: 3.55,
    updated_at: new Date().toISOString(),
  },
  {
    bookmaker: "Spin.ro",
    home_win: 2.15,
    draw: 3.35,
    away_win: 3.65,
    updated_at: new Date().toISOString(),
  },
]
