import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Step 1: Run the scraper to get fresh data
    console.log("Running scraper to get fresh data...")
    const scriptPath = path.join(process.cwd(), "scripts/scraper_pagina_principala+date_scaper.py")
    const { stdout, stderr } = await execAsync(`python "${scriptPath}"`) // Add quotes around the path

    if (stderr) {
      console.warn("Scraper warning:", stderr)
    }

    // Step 2: Read the CSV file with the scraped data
    const csvPath = path.join(process.cwd(), "all_football_matches.csv")

    if (!fs.existsSync(csvPath)) {
      throw new Error("Scraper did not generate the expected CSV file")
    }

    const content = fs.readFileSync(csvPath, "utf8")
    const csvResults = parse(content, { columns: true, skip_empty_lines: true })

    // Step 3: Delete all existing records from the matches table
    console.log("Clearing existing matches data...")
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .not("id", "is", null) // This deletes all records

    if (deleteError) {
      throw deleteError
    }

    // Step 4: Insert new records from the scraper data
    console.log("Inserting fresh match data...")
    interface CsvMatch {
      team1: string;
      team2: string;
      date: string;
      league: string;
    }

    interface Match {
      team1: string;
      team2: string;
      match_date: string;
      league: string;
    }

    const matchesToInsert: Match[] = csvResults.map((match: CsvMatch) => {
      // Convert DD/MM/YYYY HH:MM to YYYY-MM-DD HH:MM:SS
      const [datePart, timePart] = match.date.split(' ');
      const [day, month, year] = datePart.split('/');
      const isoDate = `${year}-${month}-${day}T${timePart}:00`;

      return {
        team1: match.team1,
        team2: match.team2,
        match_date: isoDate,
        league: match.league || "Unknown"
      };
    }).slice(0, 100);

    const { error: insertError } = await supabase
      .from("matches")
      .insert(matchesToInsert)

    if (insertError) {
      throw insertError
    }

    // Step 5: Fetch and return the updated matches
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })
      .limit(100)

    if (error) {
      throw error
    }

    // Clean up the CSV file to avoid conflicts with future runs
    try {
      fs.unlinkSync(csvPath)
    } catch (error) {
      console.warn("Could not delete CSV file:", error)
    }

    return NextResponse.json({
      success: true,
      matches: matches,
      refreshed: true
    })

  } catch (error) {
    console.error("Match API Error:", error)
    return NextResponse.json(
      { error: String(error), success: false, matches: [], refreshed: false },
      { status: 500 }
    )
  }
}