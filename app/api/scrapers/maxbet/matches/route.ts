import { type NextRequest, NextResponse } from "next/server"
import { SAMPLE_MATCHES } from "@/lib/sample-data"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Check if we're in preview mode
    const isPreview = process.env.VERCEL_ENV === "preview" || !process.env.POSTGRES_URL

    // In preview mode, just return sample data
    if (isPreview) {
      return NextResponse.json({
        success: true,
        isPreview: true,
        matches: SAMPLE_MATCHES,
        message: "Using sample data in preview mode",
      })
    }

    // Execute the scraper directly
    const scriptPath = path.join(process.cwd(), "scripts/scraper_toate_meciurile_maxbet.py")
    const outputFile = path.join(process.cwd(), "maxbet_meciuri.csv")

    // First, ensure Python dependencies are installed
    try {
      await execAsync(`python scripts/utils.py`)
    } catch (error) {
      console.error("Failed to ensure dependencies:", error)
    }

    // Run the scraper
    console.log("Executing MaxBet matches scraper")
    const { stdout, stderr } = await execAsync(`python ${scriptPath}`)

    if (stderr) {
      console.error(`Scraper error: ${stderr}`)
    }

    if (stdout) {
      console.log(`Scraper output: ${stdout}`)
    }

    // Process the CSV output
    let matches = []
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf8")
      matches = parse(content, { columns: true })

      // Clean up the file
      fs.unlinkSync(outputFile)
    } else {
      console.warn(`Output file not found: ${outputFile}`)
      // Fall back to sample data if scraper fails
      return NextResponse.json({
        success: false,
        matches: SAMPLE_MATCHES,
        message: "Failed to retrieve matches, using sample data",
      })
    }

    return NextResponse.json({
      success: true,
      matches,
      message: "Successfully retrieved MaxBet matches",
    })
  } catch (error: any) {
    console.error("API error:", error)
    // Fall back to sample data if there's an error
    return NextResponse.json({
      success: false,
      matches: SAMPLE_MATCHES,
      error: error.message || "Failed to get MaxBet matches",
      message: "Error occurred, using sample data",
    })
  }
}
