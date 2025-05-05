"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRefresh } from "@/contexts/refresh-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshButton } from "@/components/refresh-button"
import Link from "next/link"

interface Match {
  id: string
  team1: string
  team2: string
  match_date: string
  league: string
}

export default function MatchesPage() {
  const { user } = useAuth()
  const { lastRefreshed } = useRefresh()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchMatches = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("matches").select("*").order("match_date", { ascending: true })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error("Error fetching matches:", error)
      setError("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchMatches()
  }, [user])

  // Refresh data when lastRefreshed changes
  useEffect(() => {
    if (lastRefreshed) {
      fetchMatches()
    }
  }, [lastRefreshed])

  // Set up real-time subscription for matches
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel("matches_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const filteredMatches = matches.filter((match) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      match.team1.toLowerCase().includes(searchLower) ||
      match.team2.toLowerCase().includes(searchLower) ||
      match.league?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Matches</h2>
        <p className="text-muted-foreground">Browse and compare odds for upcoming matches</p>
      </div>

      {/* Make the refresh button more prominent */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <RefreshButton />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Matches</CardTitle>
              <CardDescription>{filteredMatches.length} matches found</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search matches..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredMatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      {match.team1} vs {match.team2}
                    </TableCell>
                    <TableCell>{match.league || "Unknown"}</TableCell>
                    <TableCell>{new Date(match.match_date).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/matches/${match.id}`}>View Odds</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">No matches found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
