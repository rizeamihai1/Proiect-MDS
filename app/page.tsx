// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Filter, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import TopBets from "@/components/bets/top-bets"
import AuthNav from "@/components/auth/auth-nav"
import { SAMPLE_MATCHES } from "@/lib/sample-data"

// Import the ExpandableMatchRow component only if it exists
let ExpandableMatchRow: any
try {
  ExpandableMatchRow = require("@/components/expandable-match-row").ExpandableMatchRow
} catch (error) {
  // Component doesn't exist, we'll handle this in the render
  console.warn("ExpandableMatchRow component not found, using fallback")
}

interface Match {
  id: string
  team1: string
  team2: string
  match_date: string
  league: string
}

// Simple fallback component for ExpandableMatchRow
function MatchRowFallback({ match }: { match: Match }) {
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">
            {match.team1} vs {match.team2}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(match.match_date).toLocaleDateString()}{" "}
            {new Date(match.match_date).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm">
          View Odds
        </Button>
      </div>
    </div>
  )
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLeague, setActiveLeague] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  // Fetch matches with improved error handling from the old version
  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      // First try to get matches from the API
      try {
        const response = await fetch("/api/matches")

        // Check if the response is OK and contains JSON
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }

        // Try to parse the JSON
        const data = await response.json()

        // Check if we're in preview mode
        if (data.isPreview) {
          setIsPreview(true)
        }

        // Set the matches
        setMatches(data.matches || SAMPLE_MATCHES)
      } catch (apiError) {
        console.error("API error:", apiError)
        // Fall back to sample data
        setMatches(SAMPLE_MATCHES)
        setIsPreview(true)
        setError("Could not fetch live data. Using sample data instead.")
      }
    } catch (error) {
      console.error("Error in fetchMatches:", error)
      // Ultimate fallback
      setMatches(SAMPLE_MATCHES)
      setIsPreview(true)
      setError("An unexpected error occurred. Using sample data.")
    } finally {
      setLoading(false)
    }
  }

  // Refresh data manually with improved error handling from the old version
  const refreshData = async () => {
    try {
      setRefreshing(true)
      setError(null)

      try {
        const response = await fetch("/api/refresh", {
          method: "POST",
        })

        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }

        // Try to parse the JSON
        const data = await response.json()

        // Check if we're in preview mode
        if (data.isPreview) {
          setIsPreview(true)
        }

        // Set the matches
        setMatches(data.matches || SAMPLE_MATCHES)
      } catch (apiError) {
        console.error("API error during refresh:", apiError)
        // Fall back to sample data
        setMatches(SAMPLE_MATCHES)
        setIsPreview(true)
        setError("Could not refresh data. Using sample data instead.")
      }
    } catch (error) {
      console.error("Error in refreshData:", error)
      // Ultimate fallback
      setMatches(SAMPLE_MATCHES)
      setIsPreview(true)
      setError("An unexpected error occurred during refresh. Using sample data.")
    } finally {
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchMatches()
  }, [])

  // Filter matches by search query and active league
  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.team1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.team2?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.league?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLeague =
      activeLeague === "all" ||
      match.league?.toLowerCase().includes(activeLeague.toLowerCase())

    return matchesSearch && matchesLeague
  })

  // Group matches by league
  const matchesByLeague = filteredMatches.reduce(
    (acc, match) => {
      const league = match.league || "Unknown League"
      if (!acc[league]) {
        acc[league] = []
      }
      acc[league].push(match)
      return acc
    },
    {} as Record<string, Match[]>
  )

  // Get unique leagues for tabs
  const leagues = Object.keys(matchesByLeague).sort()

  // Determine which component to use for rendering matches
  const MatchComponent = ExpandableMatchRow || MatchRowFallback

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">FootballOdds</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center space-x-4 sm:justify-end">
            <div className="flex-1 sm:grow-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search matches..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <nav className="hidden space-x-2 md:flex">
              <Button variant="outline" asChild>
                <Link href="/tools/kelly-calculator">Kelly Calculator</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/predictions">Predicții</Link>
              </Button>
              <AuthNav />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-start gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              Football Betting Odds <br className="hidden sm:inline" />
              Compare and Find the Best Value
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Compare football betting odds from Superbet, MaxBet, and Spin.ro to maximize your potential winnings.
            </p>
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
          <div className="flex gap-4">
            <Button onClick={refreshData} disabled={refreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Odds"}
            </Button>
          </div>

          {isPreview && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p>You're viewing sample data in preview mode.</p>
                <p className="mt-1 text-xs">Could not connect to the API for live data.</p>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </section>

        {/* Add the Top 5 Bets section from the new version */}
        <section className="container py-8">
          <TopBets />
        </section>

        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Football Matches</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeLeague} onValueChange={setActiveLeague}>
            <TabsList className="mb-6 overflow-auto">
              <TabsTrigger value="all">All Leagues</TabsTrigger>
              {leagues.map((league) => (
                <TabsTrigger key={league} value={league.toLowerCase()}>
                  {league}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(matchesByLeague).map(([league, leagueMatches]) => (
                    <Card key={league}>
                      <CardHeader>
                        <CardTitle>{league}</CardTitle>
                        <CardDescription>
                          {leagueMatches.length} {leagueMatches.length === 1 ? "match" : "matches"} available
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {leagueMatches.map((match) => (
                            <MatchComponent
                              key={match.id || `${match.team1}-${match.team2}`}
                              match={match}
                              isPreview={isPreview}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No matches found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {leagues.map((league) => (
              <TabsContent key={league} value={league.toLowerCase()} className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>{league}</CardTitle>
                    <CardDescription>
                      {matchesByLeague[league].length}{" "}
                      {matchesByLeague[league].length === 1 ? "match" : "matches"} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {matchesByLeague[league].map((match) => (
                        <MatchComponent
                          key={match.id || `${match.team1}-${match.team2}`}
                          match={match}
                          isPreview={isPreview}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; 2025 FootballOdds. All rights reserved. 18+ Gamble Responsibly.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground underline underline-offset-4">
              Responsible Gambling
            </Link>
          </div>
        </div>
      </footer>
    </div>
)
