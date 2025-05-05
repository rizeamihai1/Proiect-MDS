"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useRefresh } from "@/contexts/refresh-context"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookmarkIcon, ExternalLink, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"

interface Odds {
  id: string
  bookmaker: string
  home_win: number
  draw: number
  away_win: number
  updated_at: string
}

interface MatchOddsTableProps {
  matchId: string
  team1: string
  team2: string
}

// Define the allowed bookmakers (from the web scrapers)
const ALLOWED_BOOKMAKERS = ["Superbet", "MaxBet", "Spin.ro"]

export function MatchOddsTable({ matchId, team1, team2 }: MatchOddsTableProps) {
  const { user } = useAuth()
  const { lastRefreshed } = useRefresh()
  const [odds, setOdds] = useState<Odds[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOdds = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("odds").select("*").eq("match_id", matchId)

      if (error) throw error

      // Filter odds to only include the allowed bookmakers
      const filteredOdds = data?.filter((odd) => ALLOWED_BOOKMAKERS.includes(odd.bookmaker)) || []

      setOdds(filteredOdds)
    } catch (error) {
      console.error("Error fetching odds:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchOdds()
  }, [user, matchId])

  // Refresh data when lastRefreshed changes
  useEffect(() => {
    if (lastRefreshed) {
      fetchOdds()
    }
  }, [lastRefreshed])

  // Set up real-time subscription for odds
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel(`odds_changes_${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "odds", filter: `match_id=eq.${matchId}` }, () => {
        fetchOdds()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, matchId])

  const saveBet = async (bookmaker: string, betType: string, oddValue: number) => {
    if (!user) return

    try {
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        match_id: matchId,
        bookmaker,
        bet_type: betType,
        odds: oddValue,
      })

      if (error) throw error
      toast({
        title: "Bet saved",
        description: `${team1} vs ${team2} - ${betType} @ ${oddValue}`,
      })
    } catch (error) {
      console.error("Error saving bet:", error)
      toast({
        title: "Error saving bet",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  // Find best odds
  const bestOdds = {
    home_win: Math.max(...odds.map((o) => o.home_win), 0),
    draw: Math.max(...odds.map((o) => o.draw), 0),
    away_win: Math.max(...odds.map((o) => o.away_win), 0),
  }

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (odds.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No odds available from Superbet, MaxBet, or Spin.ro for this match</p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bookmaker</TableHead>
            <TableHead>{team1} (1)</TableHead>
            <TableHead>Draw (X)</TableHead>
            <TableHead>{team2} (2)</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {odds.map((odd) => (
            <TableRow key={odd.id}>
              <TableCell className="font-medium">{odd.bookmaker}</TableCell>
              <TableCell>
                <div
                  className={`flex items-center ${odd.home_win === bestOdds.home_win ? "font-bold text-green-600" : ""}`}
                >
                  {odd.home_win}
                  {odd.home_win === bestOdds.home_win && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-1 h-4 w-4 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Best odds available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className={`flex items-center ${odd.draw === bestOdds.draw ? "font-bold text-green-600" : ""}`}>
                  {odd.draw}
                  {odd.draw === bestOdds.draw && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-1 h-4 w-4 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Best odds available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div
                  className={`flex items-center ${odd.away_win === bestOdds.away_win ? "font-bold text-green-600" : ""}`}
                >
                  {odd.away_win}
                  {odd.away_win === bestOdds.away_win && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-1 h-4 w-4 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Best odds available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {odd.updated_at ? new Date(odd.updated_at).toLocaleTimeString() : "N/A"}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => saveBet(odd.bookmaker, "1", odd.home_win)}
                >
                  <BookmarkIcon className="h-3 w-3" />1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => saveBet(odd.bookmaker, "X", odd.draw)}
                >
                  <BookmarkIcon className="h-3 w-3" />X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => saveBet(odd.bookmaker, "2", odd.away_win)}
                >
                  <BookmarkIcon className="h-3 w-3" />2
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  Bet
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-2 text-xs text-right text-muted-foreground">
        Showing odds from Superbet, MaxBet, and Spin.ro only
      </div>
    </div>
  )
}
