"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"


import { signIn as authSignIn, signUp as authSignUp, getCurrentUser as authGetCurrentUser } from "@/lib/auth-actions"

export async function signIn(formData) {
  return await authSignIn(formData)
}

export async function signUp(formData) {
  return await authSignUp(formData)
}

export async function getCurrentUser() {
  return await authGetCurrentUser()
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
