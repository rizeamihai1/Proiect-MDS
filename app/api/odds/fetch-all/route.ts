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

        // Format odds and deduplicate by bookmaker
        const bookmakerMap = new Map();

        // Check if we have any real data from Superbet
        const superbetResult = results[0];
        console.log("Processing Superbet data:", superbetResult);

        if (superbetResult && Array.isArray(superbetResult.odds)) {
            // Handle Superbet data
            const superbetOdd = superbetResult.odds[0];
            if (superbetOdd) {
                bookmakerMap.set("Superbet", {
                    bookmaker: "Superbet",
                    home_win: parseFloat(String(superbetOdd.odd_1 || 0)),
                    draw: parseFloat(String(superbetOdd.odd_X || 0)),
                    away_win: parseFloat(String(superbetOdd.odd_2 || 0)),
                    updated_at: new Date().toISOString()
                });
            }
        }

        // Add placeholder data for MaxBet and Spin.ro
        if (!bookmakerMap.has("MaxBet")) {
            bookmakerMap.set("MaxBet", {
                bookmaker: "MaxBet",
                home_win: 2.05,
                draw: 3.5,
                away_win: 3.55,
                updated_at: new Date().toISOString()
            });
        }

        if (!bookmakerMap.has("Spin.ro")) {
            bookmakerMap.set("Spin.ro", {
                bookmaker: "Spin.ro",
                home_win: 2.15,
                draw: 3.35,
                away_win: 3.65,
                updated_at: new Date().toISOString()
            });
        }

        const formattedOdds = Array.from(bookmakerMap.values());

        return NextResponse.json({
            success: true,
            odds: formattedOdds,
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