import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BettingOddsTable } from "@/components/betting-odds-table"

export function PopularEvents() {
  // Mock data for popular events
  const popularEvents = [
    {
      category: "Football",
      league: "Premier League - England",
      event: "Manchester United vs Liverpool",
      date: "May 5, 2025",
      time: "15:00",
    },
    {
      category: "Basketball",
      league: "NBA - USA",
      event: "LA Lakers vs Boston Celtics",
      date: "May 6, 2025",
      time: "19:30",
    },
    {
      category: "Tennis",
      league: "French Open",
      event: "Novak Djokovic vs Rafael Nadal",
      date: "May 7, 2025",
      time: "14:00",
    },
  ]

  return (
    <div className="grid gap-6">
      {popularEvents.map((event, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{event.league}</CardTitle>
                <CardDescription>{event.category}</CardDescription>
              </div>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                View all {event.category} events
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <BettingOddsTable event={event.event} date={event.date} time={event.time} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">More {event.category} Odds</Button>
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
