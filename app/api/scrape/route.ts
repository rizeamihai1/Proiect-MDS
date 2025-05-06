import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import { supabase } from "@/lib/supabase/client"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { team1, team2 } = await request.json()

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: "Both team1 and team2 parameters are required", success: false },
        { status: 400 }
      )
    }

    // Create empty CSV files with headers for each scraper
    const outputFiles = [
      {
        path: path.join(process.cwd(), "odds_superbet.csv"),
        header: "bookmaker,team1,team2,odd_1,odd_X,odd_2,updated_at\n"
      },
      // {
      //   path: path.join(process.cwd(), "odds_maxbet.csv"),
      //   header: "Data,team1,team2,odd_1,odd_X,odd_2\n"
      // },
      // {
      //   path: path.join(process.cwd(), "odds_spin.csv"),
      //   header: "Data,team1,team2,odd_1,odd_X,odd_2\n"
      // }
    ];

    // Create all CSV files with headers
    outputFiles.forEach(file => {
      if (!fs.existsSync(file.path)) {
        fs.writeFileSync(file.path, file.header, "utf8");
      }
    });

    // Call all three odds scrapers sequentially
    const endpoints = [
      "/api/scrapers/superbet/odds",
      "/api/scrapers/maxbet/odds",
      "/api/scrapers/spin/odds"
    ]


    // const outputFiles = [
    //   path.join(process.cwd(), "odds_superbet.csv"),
    //   path.join(process.cwd(), "odds_maxbet.csv"),
    //   path.join(process.cwd(), "odds_spin.csv"),
    // ];

    // // Combined output file
    const combinedFile = path.join(process.cwd(), "odds.csv");

    // // Create combined file with header
    fs.writeFileSync(combinedFile, "Data,team1,team2,odd_1,odd_X,odd_2,bookmaker\n");

    // // Append data from each file with bookmaker info
    // outputFiles.forEach((file, index) => {
    //   if (fs.existsSync(file)) {
    //     const content = fs.readFileSync(file, "utf8");
    //     const bookmaker = ["superbet", "maxbet", "spin"][index];

    //     // Skip header line, add bookmaker column
    //     const lines = content.split("\n").slice(1).filter(Boolean);
    //     lines.forEach(line => {
    //       fs.appendFileSync(combinedFile, `${line},${bookmaker}\n`);
    //     });

    //     // Delete the temporary file
    //     fs.unlinkSync(file);
    //   }
    // });

    // Read the combined odds file
    let odds = [];
    if (fs.existsSync(combinedFile)) {
      const content = fs.readFileSync(combinedFile, "utf8");
      odds = parse(content, { columns: true });
    }

    const supabase = createServerSupabaseClient()

    // Verify admin user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { scraper, params } = await request.json()

    if (!scraper) {
      return NextResponse.json({ error: "Missing scraper parameter" }, { status: 400 })
    }

    // Map of allowed scrapers and their file paths
    const scrapers: Record<string, string> = {
      superbet_main: "./scripts/scraper_pagina_principala+date_scaper.py",
      superbet_odds: "./scripts/scraper_cota_eveniment_superbet.py",
      maxbet_main: "./scripts/scraper_toate_meciurile_maxbet.py",
      maxbet_odds: "./scripts/scraper_cota_eveniment_maxbet.py",
      spin_odds: "./scripts/script_cautare_meci_spin.py",
    }

    if (!scrapers[scraper]) {
      return NextResponse.json({ error: "Invalid scraper" }, { status: 400 })
    }

    // Execute the scraper
    const scriptPath = scrapers[scraper]
    let command = `python ${scriptPath}`

    // Add parameters if provided
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        command += ` --${key} "${value}"`
      }
    }

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error(`Scraper error: ${stderr}`)
    }

    // Process the CSV output if it exists
    let results = []
    const outputFile = path.join(process.cwd(), scraper.includes("odds") ? "odds.csv" : "all_football_matches.csv")

    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf8")
      results = parse(content, { columns: true })

      // Store results in database
      if (scraper.includes("main")) {
        // Store matches
        for (const match of results) {
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("id")
            .eq("team1", match.team1)
            .eq("team2", match.team2)
            .eq("match_date", match.date)
            .single()

          if (!existingMatch) {
            await supabase.from("matches").insert({
              team1: match.team1,
              team2: match.team2,
              match_date: match.date,
              league: match.league || "Unknown",
            })
          }
        }
      } else if (scraper.includes("odds")) {
        // Store odds
        for (const odd of results) {
          const { data: match } = await supabase
            .from("matches")
            .select("id")
            .eq("team1", odd.team1)
            .eq("team2", odd.team2)
            .single()

          if (match) {
            const bookmaker = scraper.split("_")[0]

            const { data: existingOdd } = await supabase
              .from("odds")
              .select("id")
              .eq("match_id", match.id)
              .eq("bookmaker", bookmaker)
              .single()

            if (existingOdd) {
              await supabase
                .from("odds")
                .update({
                  home_win: Number.parseFloat(odd.odd_1) || 0,
                  draw: Number.parseFloat(odd.odd_X) || 0,
                  away_win: Number.parseFloat(odd.odd_2) || 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingOdd.id)
            } else {
              await supabase.from("odds").insert({
                match_id: match.id,
                bookmaker: bookmaker,
                home_win: Number.parseFloat(odd.odd_1) || 0,
                draw: Number.parseFloat(odd.odd_X) || 0,
                away_win: Number.parseFloat(odd.odd_2) || 0,
              })
            }
          }
        }
      }

      // Clean up the file
      fs.unlinkSync(outputFile)
    }

    return NextResponse.json({
      success: true,
      message: `Scraper ${scraper} executed successfully`,
      results,
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
