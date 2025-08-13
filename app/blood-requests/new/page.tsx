import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateBloodRequestForm from "@/components/blood-requests/create-blood-request-form"

export default async function NewBloodRequestPage() {
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

  if (!profile || profile.role !== "recipient") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Blood Request</h1>
          <p className="text-gray-600 mt-2">
            Submit a request for blood units. Our system will automatically match you with available inventory.
          </p>
        </div>
        <CreateBloodRequestForm user={profile} />
      </div>
    </DashboardLayout>
  )
}
