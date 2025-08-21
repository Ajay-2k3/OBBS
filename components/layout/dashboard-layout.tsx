import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"
import { redirect } from "next/navigation"
import Navbar from "./navbar"
import NotificationProvider from "@/components/real-time/notification-provider"

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Use service role client to bypass RLS for user profile lookup
  const serviceClient = createServiceRoleClient()
  
  // Get user profile
  const { data: profile } = await serviceClient.from("users").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get unread notifications count using service role client
  const { count: notificationCount } = await serviceClient
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return (
    <NotificationProvider userId={user.id}>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={profile} notifications={notificationCount || 0} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </NotificationProvider>
  )
}
