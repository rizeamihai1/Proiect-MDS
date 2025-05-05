"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScraperTrigger } from "@/components/scraper-trigger"

export default function AdminPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return

      try {
        // In a real app, you would check if the user has admin privileges
        // For this demo, we'll just check if the user is the first user in the database
        const { data } = await supabase
          .from("users")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single()

        setIsAdmin(data?.id === user.id)
      } catch (error) {
        console.error("Error checking admin status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground">You don't have access to this page</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage scrapers and data collection</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ScraperTrigger />

        <Card>
          <CardHeader>
            <CardTitle>Database Stats</CardTitle>
            <CardDescription>Overview of collected data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Total Matches</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Total Odds</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Saved Bets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
