"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useRefresh } from "@/contexts/refresh-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MatchOddsTable } from "@/components/match-odds-table"
import { RefreshButton } from "@/components/refresh-button"
import Link from "next/link"

interface Match {
  id: string
  team1: string
  team2: string
  match_date: string
  league: string
}

export default function MatchDetailsPage() {
  const { user } = useAuth()
  const { lastRefreshed } = useRefresh()
  const params = useParams()
  const matchId = params.id as string
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = async () => {
    if (!user || !matchId) return

    try {
      const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).single()

      if (error) throw error
      setMatch(data)
    } catch (error) {
      console.error("Error fetching match:", error)
      setError("Failed to load match details")
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchMatch()
  }, [user, matchId])

  // Refresh data when lastRefreshed changes
  useEffect(() => {
    if (lastRefreshed) {
      fetchMatch()
    }
  }, [lastRefreshed])

  // Set up real-time subscription for this match
  useEffect(() => {
    if (!user || !matchId) return

    const subscription = supabase
      .channel(`match_changes_${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, () => {
        fetchMatch()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, matchId])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/matches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Match not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/dashboard/matches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Link>
        </Button>
        <RefreshButton />
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {match.team1} vs {match.team2}
        </h2>
        <p className="text-muted-foreground">
          {match.league || "Unknown League"} • {new Date(match.match_date).toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Betting Odds Comparison</CardTitle>
          <CardDescription>Compare odds from different bookmakers</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchOddsTable matchId={match.id} team1={match.team1} team2={match.team2} />
        </CardContent>
      </Card>
    </div>
  )
}
