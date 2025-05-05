"use client"

import { useState } from "react"
import { ArrowUpDown, ExternalLink, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BettingOddsTableProps {
  event: string
  date: string
  time: string
}

interface BookmakerOdds {
  name: string
  homeWin: string
  draw: string
  awayWin: string
  bestOdds: boolean[]
}

export function BettingOddsTable({ event, date, time }: BettingOddsTableProps) {
  // Mock data - in a real app this would come from an API
  const [bookmakers, setBookmakers] = useState<BookmakerOdds[]>([
    {
      name: "Bet365",
      homeWin: "2.10",
      draw: "3.40",
      awayWin: "3.60",
      bestOdds: [true, false, false],
    },
    {
      name: "William Hill",
      homeWin: "2.05",
      draw: "3.50",
      awayWin: "3.60",
      bestOdds: [false, true, false],
    },
    {
      name: "Paddy Power",
      homeWin: "2.00",
      draw: "3.40",
      awayWin: "3.70",
      bestOdds: [false, false, true],
    },
    {
      name: "Betfair",
      homeWin: "2.05",
      draw: "3.45",
      awayWin: "3.65",
      bestOdds: [false, false, false],
    },
    {
      name: "Unibet",
      homeWin: "2.08",
      draw: "3.35",
      awayWin: "3.60",
      bestOdds: [false, false, false],
    },
  ])

  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }

    // Sort the bookmakers array based on the selected column
    const sortedBookmakers = [...bookmakers].sort((a, b) => {
      let valueA, valueB

      if (column === "name") {
        valueA = a.name
        valueB = b.name
      } else if (column === "homeWin") {
        valueA = Number.parseFloat(a.homeWin)
        valueB = Number.parseFloat(b.homeWin)
      } else if (column === "draw") {
        valueA = Number.parseFloat(a.draw)
        valueB = Number.parseFloat(b.draw)
      } else if (column === "awayWin") {
        valueA = Number.parseFloat(a.awayWin)
        valueB = Number.parseFloat(b.awayWin)
      } else {
        return 0
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      } else {
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
      }
    })

    setBookmakers(sortedBookmakers)
  }

  // Extract team names from event
  const teams = event.split(" vs ")
  const homeTeam = teams[0]
  const awayTeam = teams.length > 1 ? teams[1] : ""

  return (
    <div className="rounded-md border">
      <div className="bg-muted/50 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{event}</h3>
          <p className="text-sm text-muted-foreground">
            {date} • {time}
          </p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="flex items-center gap-1 font-medium"
              >
                Bookmaker
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("homeWin")}
                className="flex items-center gap-1 font-medium"
              >
                {homeTeam} (1)
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("draw")}
                className="flex items-center gap-1 font-medium"
              >
                Draw (X)
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("awayWin")}
                className="flex items-center gap-1 font-medium"
              >
                {awayTeam} (2)
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookmakers.map((bookmaker) => (
            <TableRow key={bookmaker.name}>
              <TableCell className="font-medium">{bookmaker.name}</TableCell>
              <TableCell>
                <div className={`flex items-center ${bookmaker.bestOdds[0] ? "font-bold text-green-600" : ""}`}>
                  {bookmaker.homeWin}
                  {bookmaker.bestOdds[0] && (
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
                <div className={`flex items-center ${bookmaker.bestOdds[1] ? "font-bold text-green-600" : ""}`}>
                  {bookmaker.draw}
                  {bookmaker.bestOdds[1] && (
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
                <div className={`flex items-center ${bookmaker.bestOdds[2] ? "font-bold text-green-600" : ""}`}>
                  {bookmaker.awayWin}
                  {bookmaker.bestOdds[2] && (
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
    </div>
  )
}
