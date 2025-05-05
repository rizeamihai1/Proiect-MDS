import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
    try {
        const { team1, team2 } = await request.json()

        if (!team1 || !team2) {
            return NextResponse.json(
                { error: "Both team1 and team2 parameters are required", success: false },
                { status: 400 }
            )
        }

        // Call all three odds scrapers sequentially
        const endpoints = [
            "/api/scrapers/superbet/odds",
            "/api/scrapers/maxbet/odds",
            "/api/scrapers/spin/odds"
        ]

        const results = await Promise.all(
            endpoints.map(async endpoint => {
                try {
                    const response = await fetch(new URL(endpoint, request.url).toString(), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ team1, team2 }),
                    })

                    if (!response.ok) {
                        console.warn(`${endpoint} returned status ${response.status}`)
                        return null
                    }

                    return await response.json()
                } catch (error) {
                    console.error(`Error calling ${endpoint}:`, error)
                    return null
                }
            })
        )

        // Get existing odds for this match from database
        const { data: existingOdds } = await supabase
            .from("odds")
            .select("*")
            .or(`team1.eq.${team1},team1.eq.${team2}`)
            .or(`team2.eq.${team2},team2.eq.${team1}`)

        return NextResponse.json({
            success: true,
            odds: existingOdds || [],
            scraperResults: results.filter(Boolean),
        })
    } catch (error: any) {
        console.error("Error fetching all odds:", error)
        return NextResponse.json(
            { error: error.message || "Failed to fetch odds", success: false },
            { status: 500 }
        )
    }
}