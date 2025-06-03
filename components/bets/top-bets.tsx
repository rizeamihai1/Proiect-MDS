"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Sample data for fallback if database is empty
const SAMPLE_BETS = [
  {
    id: 1,
    amount: 1000,
    profit: 1500,
    placed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    amount: 750,
    profit: 1200,
    placed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    amount: 600,
    profit: 900,
    placed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    amount: 500,
    profit: 800,
    placed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    amount: 400,
    profit: 600,
    placed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

type Bet = {
  id: number
  amount: number
  profit: number
  placed_at: string
}

export default function TopBets() {
  const [topBets, setTopBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingSampleData, setUsingSampleData] = useState(false)

  useEffect(() => {
    const fetchTopBets = async () => {
      try {
        // Fetch top bets from Supabase across ALL users
        const { data, error } = await supabase
          .from("bets")
          .select("id, amount, profit, placed_at")
          .order("profit", { ascending: false })
          .limit(5)

        if (error) throw error

        if (data && data.length > 0) {
          // Convert string amounts to numbers if needed
          const formattedData = data.map((bet) => ({
            ...bet,
            amount: typeof bet.amount === "string" ? Number.parseFloat(bet.amount) : Number(bet.amount),
            profit: typeof bet.profit === "string" ? Number.parseFloat(bet.profit) : Number(bet.profit),
          }))

          setTopBets(formattedData)
          setUsingSampleData(false)
        } else {
          // No data found, use sample data
          setTopBets(SAMPLE_BETS)
          setUsingSampleData(true)
        }
      } catch (error: any) {
        console.error("Error fetching top bets:", error)
        setError(error.message)
        // Fallback to sample data on error
        setTopBets(SAMPLE_BETS)
        setUsingSampleData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchTopBets()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Most Profitable Bets</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Most Profitable Bets</CardTitle>
        <CardDescription>The most successful bets from our community</CardDescription>
        {usingSampleData && <p className="text-xs text-amber-600 mt-1">Using sample data</p>}
      </CardHeader>
      <CardContent>
        {topBets.length === 0 ? (
          <p className="text-muted-foreground">No bets have been placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {topBets.map((bet) => {
                  const netProfit = bet.profit - bet.amount
                  return (
                    <tr key={bet.id} className="border-b">
                      <td className="py-2">{new Date(bet.placed_at).toLocaleDateString()}</td>
                      <td className="text-right py-2">${bet.amount.toFixed(2)}</td>
                      <td className="text-right py-2">${bet.profit.toFixed(2)}</td>
                      <td className="text-right py-2 text-green-600">+${netProfit.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
