import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

interface OddResponse {
    odds?: Array<BookmakerOdd>;
    message?: string;
}

interface BookmakerOdd {
    bookmaker?: string;
    odd_1?: string | number;
    odd_X?: string | number;
    odd_2?: string | number;
    home_win?: string | number;
    draw?: string | number;
    away_win?: string | number;
    updated_at?: string;
}

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

        console.log("Superbet response data:", results[0]?.odds); // Log the superbet results

        // Get existing odds for this match from database
        const { data: existingOdds } = await supabase
            .from("odds")
            .select("*")
            .or(`team1.eq.${team1},team1.eq.${team2}`)
            .or(`team2.eq.${team2},team2.eq.${team1}`)

        const formattedOdds = results.filter(Boolean).flatMap(result => {
            if (!result.odds) return [];

            return result.odds.map((odd: BookmakerOdd) => {
                // Fix the bookmaker logic with proper grouping
                let bookmaker = odd.bookmaker;
                if (!bookmaker) {
                    if (result.message?.includes("Superbet")) bookmaker = "Superbet";
                    else if (result.message?.includes("MaxBet")) bookmaker = "MaxBet";
                    else bookmaker = "Spin.ro";
                }

                return {
                    bookmaker,
                    home_win: parseFloat(String(odd.odd_1 || odd.home_win || 0)),
                    draw: parseFloat(String(odd.odd_X || odd.draw || 0)),
                    away_win: parseFloat(String(odd.odd_2 || odd.away_win || 0)),
                    updated_at: odd.updated_at || new Date().toISOString()
                };
            });
        });

        // Remove the duplicate return statement and combine the logic
        return NextResponse.json({
            success: true,
            odds: formattedOdds.length > 0 ? formattedOdds : (existingOdds || []),
            scraperResults: results.filter(Boolean),
        })

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