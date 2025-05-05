import { type NextRequest, NextResponse } from "next/server"
import { SAMPLE_ODDS } from "@/lib/sample-data"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check if we're in preview mode
    const isPreview = process.env.VERCEL_ENV === "preview" || !process.env.POSTGRES_URL

    // In preview mode, just return sample data
    if (isPreview) {
      return NextResponse.json({
        success: true,
        isPreview: true,
        odds: SAMPLE_ODDS,
        message: "Using sample data in preview mode",
      })
    }

    const { team1, team2 } = await request.json()

    if (!team1 || !team2) {
      return NextResponse.json(
        {
          error: "Both team1 and team2 parameters are required",
          success: false,
        },
        { status: 400 },
      )
    }

    // Format the date for the scraper (DD/MM/YYYY HH:MM)
    const today = new Date()
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()} ${today.getHours().toString().padStart(2, "0")}:${today.getMinutes().toString().padStart(2, "0")}`

    // Execute the scraper directly
    const scriptPath = path.join(process.cwd(), "scripts", "script_cautare_meci_spin.py");
    const outputFile = path.join(process.cwd(), "odds_spin.csv")

    // First, ensure Python dependencies are installed
    try {
      await execAsync(`python scripts/utils.py`)
    } catch (error) {
      console.error("Failed to ensure dependencies:", error)
    }

    // Run the scraper
    console.log(`Executing Spin.ro odds scraper for ${team1} vs ${team2}`)
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${team1}" "${team2}" "${formattedDate}"`);
    if (stderr) {
      console.error(`Scraper error: ${stderr}`)
    }

    if (stdout) {
      console.log(`Scraper output: ${stdout}`)
    }

    // Process the CSV output
    let odds = []
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf8")
      odds = parse(content, { columns: true })

      // Clean up the file
      fs.unlinkSync(outputFile)
    } else {
      console.warn(`Output file not found: ${outputFile}`)
    }

    return NextResponse.json({
      success: true,
      odds,
      message: "Successfully retrieved Spin.ro odds",
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to get Spin.ro odds",
        success: false,
      },
      { status: 500 },
    )
  }
}
