"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface SavedBet {
  id: string
  match_id: string
  bookmaker: string
  bet_type: string
  odds: number
  created_at: string
  match: {
    team1: string
    team2: string
    match_date: string
  }
}

// Define the allowed bookmakers (from the web scrapers)
const ALLOWED_BOOKMAKERS = ["Superbet", "MaxBet", "Spin.ro"]

export default function SavedBetsPage() {
  const { user } = useAuth()
  const [savedBets, setSavedBets] = useState<SavedBet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSavedBets = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("saved_bets")
          .select(`
            *,
            match:match_id (
              team1,
              team2,
              match_date
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Filter to only include the allowed bookmakers
        const filteredBets = data?.filter((bet) => ALLOWED_BOOKMAKERS.includes(bet.bookmaker)) || []

        setSavedBets(filteredBets)
      } catch (error) {
        console.error("Error fetching saved bets:", error)
        setError("Failed to load saved bets")
      } finally {
        setLoading(false)
      }
    }

    fetchSavedBets()
  }, [user])

  const deleteSavedBet = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("saved_bets").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setSavedBets((prev) => prev.filter((bet) => bet.id !== id))
      toast({
        title: "Bet removed",
        description: "The bet has been removed from your saved bets",
      })
    } catch (error) {
      console.error("Error deleting saved bet:", error)
      toast({
        title: "Error removing bet",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Saved Bets</h2>
        <p className="text-muted-foreground">
          Track your saved betting opportunities from Superbet, MaxBet, and Spin.ro
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Bets</CardTitle>
          <CardDescription>Bets you've saved from Superbet, MaxBet, and Spin.ro</CardDescription>
        </CardHeader>
        <CardContent>
          {savedBets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Bookmaker</TableHead>
                  <TableHead>Bet Type</TableHead>
                  <TableHead>Odds</TableHead>
                  <TableHead>Saved On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-medium">
                      {bet.match.team1} vs {bet.match.team2}
                    </TableCell>
                    <TableCell>{new Date(bet.match.match_date).toLocaleString()}</TableCell>
                    <TableCell>{bet.bookmaker}</TableCell>
                    <TableCell>{bet.bet_type}</TableCell>
                    <TableCell>{bet.odds}</TableCell>
                    <TableCell>{new Date(bet.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteSavedBet(bet.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">No saved bets found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
