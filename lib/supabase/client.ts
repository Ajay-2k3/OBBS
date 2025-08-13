import { createBrowserClient } from "@supabase/ssr"

function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings.",
    )
  }

  try {
    new URL(url)
  } catch {
    throw new Error("Invalid Supabase URL format")
  }

  return { url, key }
}

export function createClient() {
  try {
    const { url, key } = validateSupabaseConfig()
    return createBrowserClient(url, key)
  } catch (error) {
    console.error("Supabase client creation failed:", error)
    throw error
  }
}

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

try {
  const { url, key } = validateSupabaseConfig()
  supabaseClient = createBrowserClient(url, key)
} catch (error) {
  console.error("Failed to initialize Supabase client:", error)
}

export const supabase = supabaseClient
