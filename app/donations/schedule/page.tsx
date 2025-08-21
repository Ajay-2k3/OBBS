import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ScheduleDonationForm from "@/components/donations/schedule-donation-form"

export default async function ScheduleDonationPage() {
  const supabase = await createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "donor") {
    redirect("/")
  }

  // Check if user can donate (56 days since last donation)
  const daysSinceLastDonation = profile.last_donation_date
    ? Math.floor((new Date().getTime() - new Date(profile.last_donation_date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const canDonate = !daysSinceLastDonation || daysSinceLastDonation >= 56

  if (!canDonate) {
    redirect("/")
  }

  // Get available blood banks
  const { data: bloodBanks } = await supabase.from("blood_banks").select("*").eq("is_verified", true)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Blood Donation</h1>
          <p className="text-gray-600 mt-2">Choose a convenient time and location for your donation.</p>
        </div>
        <ScheduleDonationForm user={profile} bloodBanks={bloodBanks || []} />
      </div>
    </DashboardLayout>
  )
}
