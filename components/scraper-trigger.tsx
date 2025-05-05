"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ScraperTrigger() {
  const [scraper, setScraper] = useState("")
  const [team1, setTeam1] = useState("")
  const [team2, setTeam2] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runScraper = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<string, string> = {}

      if (team1) params.team1 = team1
      if (team2) params.team2 = team2

      let url = ""
      let method = "GET"
      let body = undefined

      // Determine the API endpoint based on the selected scraper
      if (scraper === "superbet_main") {
        url = "/api/scrapers/superbet/matches"
      } else if (scraper === "superbet_odds") {
        url = "/api/scrapers/superbet/odds"
        method = "POST"
        body = JSON.stringify({ team1, team2 })
      } else if (scraper === "maxbet_main") {
        url = "/api/scrapers/maxbet/matches"
      } else if (scraper === "maxbet_odds") {
        url = "/api/scrapers/maxbet/odds"
        method = "POST"
        body = JSON.stringify({ team1, team2 })
      } else if (scraper === "spin_odds") {
        url = "/api/scrapers/spin/odds"
        method = "POST"
        body = JSON.stringify({ team1, team2 })
      } else {
        throw new Error("Invalid scraper selected")
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run scraper")
      }

      toast({
        title: "Scraper executed successfully",
        description: data.isPreview
          ? "Using sample data in preview mode"
          : `Found ${data.matches?.length || data.odds?.length || 0} results`,
      })
    } catch (error: any) {
      console.error("Error running scraper:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Scraper</CardTitle>
        <CardDescription>Fetch the latest matches and odds from betting sites</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="scraper">Scraper</Label>
          <Select value={scraper} onValueChange={setScraper}>
            <SelectTrigger id="scraper">
              <SelectValue placeholder="Select a scraper" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="superbet_main">Superbet - All Matches</SelectItem>
              <SelectItem value="superbet_odds">Superbet - Match Odds</SelectItem>
              <SelectItem value="maxbet_main">MaxBet - All Matches</SelectItem>
              <SelectItem value="maxbet_odds">MaxBet - Match Odds</SelectItem>
              <SelectItem value="spin_odds">Spin - Match Odds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scraper.includes("odds") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="team1">Team 1</Label>
              <Input
                id="team1"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                placeholder="Enter team 1 name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team2">Team 2</Label>
              <Input
                id="team2"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                placeholder="Enter team 2 name"
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runScraper} disabled={loading || !scraper}>
          {loading ? "Running..." : "Run Scraper"}
        </Button>
      </CardFooter>
    </Card>
  )
}
