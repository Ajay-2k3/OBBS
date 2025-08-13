import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, Users, Droplets, Shield } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Connect Supabase to get started</h1>
      </div>
    )
  }

  try {
    const supabase = await createClient()

    // Ensure supabase client is valid before calling getUser
    if (supabase && supabase.auth) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If user is logged in, redirect to dashboard
      if (user) {
        redirect("/dashboard")
      }
    }
  } catch (error) {
    console.error("Authentication check failed:", error)
    // Continue to show landing page if auth check fails
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">BloodBank</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-red-600 hover:bg-red-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Save Lives Through
              <span className="text-red-600"> Blood Donation</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect donors with recipients, manage blood inventory, and coordinate life-saving donations through our
              comprehensive blood bank management system.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-8 py-4">
                <Heart className="mr-2 h-5 w-5" />
                Become a Donor
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 text-lg px-8 py-4 bg-transparent"
              >
                <Droplets className="mr-2 h-5 w-5" />
                Find Blood
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Connect Community</h3>
            <p className="text-gray-600">Bridge the gap between blood donors and recipients in your community.</p>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Droplets className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Real-time Inventory</h3>
            <p className="text-gray-600">Track blood availability and manage inventory across multiple blood banks.</p>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Secure & Reliable</h3>
            <p className="text-gray-600">HIPAA-compliant platform ensuring privacy and security of medical data.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
