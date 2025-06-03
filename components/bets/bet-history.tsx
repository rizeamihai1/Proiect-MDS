"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Bet = {
  id: number
  amount: number
  profit: number
  placed_at: string
  user_id?: string
}

export default function BetHistory() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      // Always fetch bets, but filter by user_id if logged in
      fetchBets(user?.id)
    }

    const fetchBets = async (userId?: string) => {
      try {
        let query = supabase.from("bets").select("*")

        // If user is logged in, only show their bets
        if (userId) {
          query = query.eq("user_id", userId)
        }

        const { data, error } = await query.order("placed_at", { ascending: false })

        if (error) throw error
        setBets(data || [])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading bet history...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{user ? "Your Bet History" : "Recent Bets"}</h2>

      {!user && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
          <p>
            You're viewing public bet data.{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to see your personal bets.
          </p>
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {bets.length === 0 ? (
        <p className="text-gray-500">{user ? "You haven't placed any bets yet." : "No bets have been placed yet."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-right">Amount</th>
                <th className="py-2 px-4 text-right">Profit</th>
                <th className="py-2 px-4 text-right">Net Result</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet) => {
                const netResult = bet.profit - bet.amount
                const isProfit = netResult > 0

                return (
                  <tr key={bet.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-t">{new Date(bet.placed_at).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-t text-right">${bet.amount.toFixed(2)}</td>
                    <td className="py-2 px-4 border-t text-right">${bet.profit.toFixed(2)}</td>
                    <td className={`py-2 px-4 border-t text-right ${isProfit ? "text-green-600" : "text-red-600"}`}>
                      {isProfit ? "+" : ""}${netResult.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!user && (
        <div className="mt-6 flex flex-col gap-4">
          <Button asChild>
            <Link href="/signup">Sign up to place your own bets</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      )}

      {user && (
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
