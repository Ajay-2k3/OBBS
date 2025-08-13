import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const isSupabaseConfigured = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key || url.length === 0 || key.length === 0) {
      return false
    }

    // Validate URL format
    new URL(url)
    return true
  } catch {
    return false
  }
})()

export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not properly configured")
  }

  const cookieStore = await cookies()

  try {
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Failed to initialize Supabase client")
  }
}
