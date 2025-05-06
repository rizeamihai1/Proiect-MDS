"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink, Info } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { SAMPLE_ODDS } from "@/lib/sample-data"
import { KellyCalculator } from "@/components/kelly-calculator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"


interface Match {
  id?: string
  team1: string
  team2: string
  match_date: string
  league: string
}

interface Odds {
  bookmaker: string
  home_win: number
  draw: number
  away_win: number
  updated_at: string
}

interface ExpandableMatchRowProps {
  match: Match
  isPreview?: boolean
}

export function ExpandableMatchRow({ match, isPreview = false }: ExpandableMatchRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [odds, setOdds] = useState<Odds[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("odds")

  const toggleExpand = async () => {
    if (!isExpanded && odds.length === 0) {
      await fetchOdds()
    }
    setIsExpanded(!isExpanded)
  }

  // Update the fetchOdds function with better error handling
  // In expandable-match-row.tsx, update the fetchOdds function:
  const fetchOdds = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Seraching for ", match.team1, "vs", match.team2)

      // toast({
      //   title: "Searching odds for match:",
      //   description: `${match.team1} vs ${match.team2}`,
      //   duration: 3000,
      // })

      // If we're in preview mode, just use sample data
      if (isPreview) {
        setOdds(SAMPLE_ODDS)
        return
      }


      // Call our new endpoint that runs all scrapers
      const response = await fetch("/api/odds/fetch-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team1: match.team1,
          team2: match.team2,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch odds")
      }

      const data = await response.json()

      if (data.success && data.odds && data.odds.length > 0) {
        setOdds(data.odds)
      } else {
        // If no odds found, use sample data as fallback
        setOdds(SAMPLE_ODDS)
        setError("No odds found for this match. Using sample data.")
      }
    } catch (error) {
      console.error("Error fetching odds:", error)
      setError("Failed to fetch odds. Using sample data.")
      // Ultimate fallback
      setOdds(SAMPLE_ODDS)
    } finally {
      setLoading(false)
    }
  }

  // Find best odds
  const bestOdds = {
    home_win: Math.max(...odds.map((o) => o.home_win), 0),
    draw: Math.max(...odds.map((o) => o.draw), 0),
    away_win: Math.max(...odds.map((o) => o.away_win), 0),
  }

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP • HH:mm")
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50" onClick={toggleExpand}>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-medium">
              {match.team1} vs {match.team2}
            </h3>
            <p className="text-sm text-muted-foreground">{formatDate(match.match_date)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleExpand()
          }}
        >
          {isExpanded ? "Hide Odds" : "Show Odds"}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 bg-muted/20">
          {isPreview && (
            <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Showing sample odds data in preview mode.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="py-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : odds.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList>
                <TabsTrigger value="odds">Odds Comparison</TabsTrigger>
                <TabsTrigger value="kelly">Kelly Calculator</TabsTrigger>
              </TabsList>

              <TabsContent value="odds">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bookmaker</TableHead>
                      <TableHead>{match.team1} (1)</TableHead>
                      <TableHead>Draw (X)</TableHead>
                      <TableHead>{match.team2} (2)</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {odds.map((odd, index) => (
                      <TableRow key={odd.bookmaker || `odd-${index}`}>
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
                          <div
                            className={`flex items-center ${odd.draw === bestOdds.draw ? "font-bold text-green-600" : ""}`}
                          >
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
                            {odd.updated_at ? format(new Date(odd.updated_at), "HH:mm:ss") : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="gap-1">
                            Bet Now
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="kelly">
                <KellyCalculator odds={odds} team1={match.team1} team2={match.team2} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No odds available from Superbet, MaxBet, or Spin.ro for this match
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchOdds}>
                Refresh Odds
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
