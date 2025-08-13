"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export { signIn, signUp, getCurrentUser } from "@/lib/auth-actions"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
