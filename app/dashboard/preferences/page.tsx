"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserPreferences {
  favorite_teams: string[]
  favorite_leagues: string[]
  favorite_bookmakers: string[]
}

const BOOKMAKERS = ["Superbet", "MaxBet", "Spin.ro", "Betano", "Unibet"]

export default function PreferencesPage() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_teams: [],
    favorite_leagues: [],
    favorite_bookmakers: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTeam, setNewTeam] = useState("")
  const [newLeague, setNewLeague] = useState("")

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setPreferences({
            favorite_teams: data.favorite_teams || [],
            favorite_leagues: data.favorite_leagues || [],
            favorite_bookmakers: data.favorite_bookmakers || [],
          })
        }
      } catch (error) {
        console.error("Error fetching preferences:", error)
        setError("Failed to load preferences")
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [user])

  const savePreferences = async () => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (data) {
        // Update existing preferences
        const { error } = await supabase.from("user_preferences").update(preferences).eq("id", data.id)

        if (error) throw error
      } else {
        // Insert new preferences
        const { error } = await supabase.from("user_preferences").insert({
          user_id: user.id,
          ...preferences,
        })

        if (error) throw error
      }

      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      setError("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  const addTeam = () => {
    if (!newTeam.trim()) return
    setPreferences((prev) => ({
      ...prev,
      favorite_teams: [...prev.favorite_teams, newTeam.trim()],
    }))
    setNewTeam("")
  }

  const removeTeam = (team: string) => {
    setPreferences((prev) => ({
      ...prev,
      favorite_teams: prev.favorite_teams.filter((t) => t !== team),
    }))
  }

  const addLeague = () => {
    if (!newLeague.trim()) return
    setPreferences((prev) => ({
      ...prev,
      favorite_leagues: [...prev.favorite_leagues, newLeague.trim()],
    }))
    setNewLeague("")
  }

  const removeLeague = (league: string) => {
    setPreferences((prev) => ({
      ...prev,
      favorite_leagues: prev.favorite_leagues.filter((l) => l !== league),
    }))
  }

  const toggleBookmaker = (bookmaker: string) => {
    setPreferences((prev) => {
      const isSelected = prev.favorite_bookmakers.includes(bookmaker)
      return {
        ...prev,
        favorite_bookmakers: isSelected
          ? prev.favorite_bookmakers.filter((b) => b !== bookmaker)
          : [...prev.favorite_bookmakers, bookmaker],
      }
    })
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
        <h2 className="text-3xl font-bold tracking-tight">Preferences</h2>
        <p className="text-muted-foreground">Customize your betting experience</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Favorite Teams</CardTitle>
            <CardDescription>Add teams you want to follow closely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a team..."
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTeam()}
              />
              <Button onClick={addTeam}>Add</Button>
            </div>
            <div className="space-y-2">
              {preferences.favorite_teams.map((team) => (
                <div key={team} className="flex items-center justify-between rounded-md border p-2">
                  <span>{team}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeTeam(team)}>
                    Remove
                  </Button>
                </div>
              ))}
              {preferences.favorite_teams.length === 0 && (
                <p className="text-sm text-muted-foreground">No favorite teams added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Favorite Leagues</CardTitle>
            <CardDescription>Add leagues you want to follow closely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a league..."
                value={newLeague}
                onChange={(e) => setNewLeague(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLeague()}
              />
              <Button onClick={addLeague}>Add</Button>
            </div>
            <div className="space-y-2">
              {preferences.favorite_leagues.map((league) => (
                <div key={league} className="flex items-center justify-between rounded-md border p-2">
                  <span>{league}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeLeague(league)}>
                    Remove
                  </Button>
                </div>
              ))}
              {preferences.favorite_leagues.length === 0 && (
                <p className="text-sm text-muted-foreground">No favorite leagues added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bookmakers</CardTitle>
            <CardDescription>Select bookmakers to compare odds from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {BOOKMAKERS.map((bookmaker) => (
                <div key={bookmaker} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bookmaker-${bookmaker}`}
                    checked={preferences.favorite_bookmakers.includes(bookmaker)}
                    onCheckedChange={() => toggleBookmaker(bookmaker)}
                  />
                  <Label htmlFor={`bookmaker-${bookmaker}`}>{bookmaker}</Label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
