import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FootballOddsTable } from "@/components/football-odds-table"

export function PopularMatches() {
  // Mock data for popular football matches
  const popularMatches = [
    {
      league: "Premier League - England",
      event: "Manchester United vs Liverpool",
      date: "May 5, 2025",
      time: "15:00",
    },
    {
      league: "La Liga - Spain",
      event: "Real Madrid vs Barcelona",
      date: "May 7, 2025",
      time: "20:00",
    },
    {
      league: "Bundesliga - Germany",
      event: "Bayern Munich vs Borussia Dortmund",
      date: "May 9, 2025",
      time: "17:30",
    },
  ]

  return (
    <div className="grid gap-6">
      {popularMatches.map((match, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{match.league}</CardTitle>
                <CardDescription>Football</CardDescription>
              </div>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                View all {match.league} matches
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <FootballOddsTable event={match.event} date={match.date} time={match.time} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">More Markets</Button>
            <Button className="gap-2">
              Compare All Bookmakers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
