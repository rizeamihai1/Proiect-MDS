import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

const execAsync = promisify(exec)

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // First, check if we have matches in the database
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })

    // If we have matches, return them
    if (existingMatches && existingMatches.length > 0) {
      return NextResponse.json({
        success: true,
        matches: existingMatches,
      })
    }

    // If no matches in database, run the Superbet scraper
    console.log("Running Superbet scraper to fetch matches")

    const scriptPath = "./scripts/scraper_pagina_principala+date_scaper.py"
    const command = `python ${scriptPath}`

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error(`Scraper error: ${stderr}`)
    }

    // Process the CSV output
    const outputFile = path.join(process.cwd(), "all_football_matches.csv")
    let matches = []

    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf8")
      const csvResults = parse(content, { columns: true })
      matches = csvResults

      // Store matches in database
      for (const match of csvResults) {
        await supabase.from("matches").insert({
          team1: match.team1,
          team2: match.team2,
          match_date: match.date,
          league: match.league || "Unknown",
        })
      }

      // Clean up the file
      fs.unlinkSync(outputFile)
    }

    // Get the matches from the database (now with IDs)
    const { data: updatedMatches } = await supabase.from("matches").select("*").order("match_date", { ascending: true })

    return NextResponse.json({
      success: true,
      matches: updatedMatches || [],
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
