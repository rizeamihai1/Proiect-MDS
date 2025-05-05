"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useRefresh } from "@/contexts/refresh-context"
import { MatchOddsTable } from "@/components/match-odds-table"
import { RefreshButton } from "@/components/refresh-button"
import { Badge } from "@/components/ui/badge"

interface Match {
  id: string
  team1: string
  team2: string
  match_date: string
  league: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const { lastRefreshed } = useRefresh()
  const [matches, setMatches] = useState<Match[]>([])
  const [favoriteMatches, setFavoriteMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  // Function to fetch matches
  const fetchMatches = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true })
        .limit(10)

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch favorite matches
  const fetchFavoriteMatches = async () => {
    if (!user) return

    try {
      // Get user preferences
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("favorite_teams")
        .eq("user_id", user.id)
        .single()

      if (preferences?.favorite_teams?.length) {
        // Get matches for favorite teams
        const { data } = await supabase
          .from("matches")
          .select("*")
          .or(preferences.favorite_teams.map((team) => `team1.eq.${team},team2.eq.${team}`).join(","))
          .order("match_date", { ascending: true })
          .limit(10)

        setFavoriteMatches(data || [])
      }
    } catch (error) {
      console.error("Error fetching favorite matches:", error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchMatches()
    fetchFavoriteMatches()
  }, [user])

  // Refresh data when lastRefreshed changes
  useEffect(() => {
    if (lastRefreshed) {
      fetchMatches()
      fetchFavoriteMatches()
    }
  }, [lastRefreshed])

  // Set up real-time subscription for matches
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel("matches_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        fetchMatches()
        fetchFavoriteMatches()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Compare betting odds from Superbet, MaxBet, and Spin.ro</p>
      </div>

      {/* Make the refresh button more prominent */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <RefreshButton />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-primary/10">
          Superbet
        </Badge>
        <Badge variant="outline" className="bg-primary/10">
          MaxBet
        </Badge>
        <Badge variant="outline" className="bg-primary/10">
          Spin.ro
        </Badge>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Matches</TabsTrigger>
          <TabsTrigger value="favorites">Favorite Teams</TabsTrigger>
          <TabsTrigger value="saved">Saved Bets</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4 pt-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : matches.length > 0 ? (
            matches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <CardTitle>
                    {match.team1} vs {match.team2}
                  </CardTitle>
                  <CardDescription>
                    {new Date(match.match_date).toLocaleString()} • {match.league || "Unknown League"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MatchOddsTable matchId={match.id} team1={match.team1} team2={match.team2} />
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No upcoming matches found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="favorites">
          {favoriteMatches.length > 0 ? (
            <div className="space-y-4">
              {favoriteMatches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <CardTitle>
                      {match.team1} vs {match.team2}
                    </CardTitle>
                    <CardDescription>
                      {new Date(match.match_date).toLocaleString()} • {match.league || "Unknown League"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MatchOddsTable matchId={match.id} team1={match.team1} team2={match.team2} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">Set your favorite teams in preferences</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="saved">
          <Card>
            <CardContent className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Save bets to track them here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
