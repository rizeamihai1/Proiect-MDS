import { createClient } from "@supabase/supabase-js"
import type { Database } from "./schema"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseUrl = "https://uudllcrnlrqyvykfjovi.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZGxsY3JubHJxeXZ5a2Zqb3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjU2NjUsImV4cCI6MjA2MTk0MTY2NX0.B7BmEZ77HURJEkUDp8v830U6MjwRvxDrIFCV27GSc1U"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)