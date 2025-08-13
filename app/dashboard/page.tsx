import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DonorDashboard from "@/components/dashboard/donor-dashboard"
import RecipientDashboard from "@/components/dashboard/recipient-dashboard"
import BloodBankDashboard from "@/components/dashboard/blood-bank-dashboard"
import AdminDashboard from "@/components/dashboard/admin-dashboard"

export default async function DashboardPage() {
  const supabase = createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "donor":
        return <DonorDashboard user={profile} />
      case "recipient":
        return <RecipientDashboard user={profile} />
      case "blood_bank":
        return <BloodBankDashboard user={profile} />
      case "admin":
        return <AdminDashboard user={profile} />
      default:
        return <DonorDashboard user={profile} />
    }
  }

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>
}
