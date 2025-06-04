import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Just read from database, no scraping
    const { data: matches, error: matchError } = await supabase
      .from("scraped_matches")
      .select("*")
      .order("match_date", { ascending: true })
      .limit(100)

    if (matchError) {
      throw matchError
    }

    // Get last update time
    const { data: metadata } = await supabase
      .from("scraper_metadata")
      .select("last_updated")
      .order("last_updated", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      matches: matches || [],
      lastUpdated: metadata?.last_updated || null,
      refreshed: false
    })

  } catch (error) {
    console.error("Match API Error:", error)
    return NextResponse.json(
      { error: String(error), success: false, matches: [], refreshed: false },
      { status: 500 }
    )
  }
}