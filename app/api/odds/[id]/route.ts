import { type NextRequest, NextResponse } from "next/server"
import { SAMPLE_ODDS } from "@/lib/sample-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // In preview mode or when database tables don't exist,
  // we'll just return sample data without trying to access the database
  return NextResponse.json({
    success: true,
    odds: SAMPLE_ODDS,
    isPreview: true,
    note: "Using sample odds data for preview. In production, this would fetch from a database.",
  })
}
