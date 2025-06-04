import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { supabase } from "@/lib/supabase/client"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Execute the Superbet scraper
    const scriptPath = path.join(process.cwd(), "scripts/scraper_pagina_principala+date_scaper.py")
    const outputFile = path.join(process.cwd(), "all_football_matches.csv")

    // Ensure Python dependencies are installed
    try {
      await execAsync(`python scripts/utils.py`)
    } catch (error) {
      console.error("Failed to ensure dependencies:", error)
    }

    // Run the scraper
    console.log("Running Superbet scraper...")
    try {
      const { stdout, stderr } = await execAsync(`python "${scriptPath}"`)

      if (stdout) console.log("Scraper output:", stdout)
      if (stderr) console.error("Scraper stderr:", stderr)
    } catch (error) {
      console.error("Scraper execution error:", error)
      throw new Error("Failed to execute scraper")
    }

    // Process the CSV output
    let matches = []
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf8")
      const csvResults = parse(content, { columns: true })

      // Take only the first 100 matches
      matches = csvResults.slice(0, 100).map((match: any) => ({
        team1: match.team1,
        team2: match.team2,
        match_date: match.date,
        league: match.league || "Unknown"
      }))

      // Clean up the file
      fs.unlinkSync(outputFile)

      console.log(`Scraped ${matches.length} matches`)
    } else {
      throw new Error("Scraper did not generate output file")
    }

    // Update database
    await updateDatabase(matches)

    return NextResponse.json({
      success: true,
      matches,
      message: `Successfully refreshed data. Found ${matches.length} matches.`,
    })
  } catch (error: any) {
    console.error("Refresh API error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to refresh data",
      message: error.message
    }, { status: 500 })
  }
}

async function updateDatabase(matches: any[]) {
  // Clear existing matches
  const { error: deleteError } = await supabase
    .from("scraped_matches")
    .delete()
    .not("id", "is", null)

  if (deleteError) {
    console.error("Delete error:", deleteError)
    throw deleteError
  }

  // Insert new matches with proper date formatting
  const matchesToInsert = matches.map(match => {
    // Parse date from DD/MM/YYYY HH:MM to YYYY-MM-DD HH:MM:SS
    const [datePart, timePart] = match.match_date.split(' ')
    const [day, month, year] = datePart.split('/')
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}:00`

    return {
      team1: match.team1,
      team2: match.team2,
      match_date: formattedDate,
      league: match.league
    }
  })

  const { error: insertError } = await supabase
    .from("scraped_matches")
    .insert(matchesToInsert)

  if (insertError) {
    console.error("Insert error:", insertError)
    throw insertError
  }

  // Update metadata
  const { error: metadataError } = await supabase
    .from("scraper_metadata")
    .insert({
      last_updated: new Date().toISOString(),
      match_count: matches.length
    })

  if (metadataError) {
    console.error("Metadata error:", metadataError)
    throw metadataError
  }

  console.log(`Database updated with ${matches.length} matches`)
}