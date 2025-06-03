"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client" // Try this import path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check if Supabase client exists
        if (!supabase) {
          throw new Error("Supabase client is not initialized")
        }

        // Try to get the Supabase URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        setDetails((prev: any) => ({ ...prev, supabaseUrl }))

        // Try a simple query
        const { data, error } = await supabase.from("bets").select("count()", { count: "exact" })

        if (error) throw error

        setStatus("success")
        setMessage(`Successfully connected to Supabase! Found ${data[0].count} bets.`)
        setDetails((prev: any) => ({ ...prev, data }))
      } catch (error: any) {
        console.error("Supabase connection test failed:", error)
        setStatus("error")
        setMessage(`Connection failed: ${error.message}`)
        setDetails((prev: any) => ({ ...prev, error: error.message }))
      }
    }

    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <p>Testing connection to Supabase...</p>}

        {status === "success" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{message}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
          <div className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
            <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
          </div>

          <h3 className="text-sm font-medium mt-4 mb-2">Import Paths:</h3>
          <div className="bg-gray-100 p-3 rounded">
            <code className="text-xs">
              import {"{"} supabase {"}"} from "@/lib/supabase-client"
            </code>
          </div>

          <p className="mt-4 text-sm">
            Check your project for both <code>supabase.ts</code> and <code>supabase-client.ts</code> files. Make sure
            you're importing from the correct one.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
