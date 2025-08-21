import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import StatusBadge from "@/components/ui/status-badge"
import AnimatedCounter from "@/components/ui/animated-counter"
import { Calendar, Heart, Award, Clock, Plus, MapPin } from "lucide-react"
import Link from "next/link"

interface DonorDashboardProps {
  user: {
    id: string
    full_name: string
    blood_type?: string
    last_donation_date?: string | null
    role: string
  }
}

export default async function DonorDashboard({ user }: DonorDashboardProps) {
  const supabase = await createClient()

  // Get donation statistics
  const { data: donations } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })

  const { data: upcomingDonations } = await supabase
    .from("donations")
    .select("*, blood_banks(name, address)")
    .eq("donor_id", user.id)
    .eq("status", "scheduled")
    .gte("scheduled_date", new Date().toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true })
    .limit(3)

  const { data: nearbyBloodBanks } = await supabase.from("blood_banks").select("*").eq("is_verified", true).limit(5)

  const totalDonations = donations?.length || 0
  const completedDonations = donations?.filter((d) => d.status === "completed").length || 0
  const totalUnitsContributed = donations?.reduce((sum, d) => sum + (d.units_donated || 0), 0) || 0

  // Calculate days since last donation
  const daysSinceLastDonation = user.last_donation_date
    ? Math.floor((new Date().getTime() - new Date(user.last_donation_date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const canDonate = !daysSinceLastDonation || daysSinceLastDonation >= 56 // 8 weeks between donations

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.full_name.split(" ")[0]}!</h1>
            <p className="text-red-100 mt-2">Thank you for being a life-saving hero in our community.</p>
            <div className="flex items-center space-x-4 mt-4">
              {user.blood_type && (
                <BloodTypeBadge bloodType={user.blood_type} className="bg-white/20 text-white border-white/30" />
              )}
              <div className="text-sm">
                {daysSinceLastDonation ? (
                  <span>Last donation: {daysSinceLastDonation} days ago</span>
                ) : (
                  <span>Ready for your first donation!</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              <AnimatedCounter value={completedDonations} />
            </div>
            <div className="text-red-100">Donations Completed</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Donations"
          value={totalDonations}
          description="Scheduled and completed"
          icon="heart"
          className="border-red-200"
        />
        <StatsCard
          title="Units Contributed"
          value={totalUnitsContributed}
          description="Total blood units donated"
          icon="award"
          className="border-blue-200"
        />
        <StatsCard
          title="Lives Impacted"
          value={totalUnitsContributed * 3}
          description="Each unit can save 3 lives"
          icon="heart"
          className="border-green-200"
        />
        <StatsCard
          title="Next Eligible"
          value={canDonate ? "Now" : `${56 - (daysSinceLastDonation || 0)} days`}
          description="Time until next donation"
          icon="clock"
          className="border-orange-200"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Donation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <span>Schedule Donation</span>
            </CardTitle>
            <CardDescription>
              {canDonate
                ? "You're eligible to donate! Schedule your next appointment."
                : "You'll be eligible to donate again soon."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {canDonate ? (
                <Link href="/donations/schedule">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule New Donation
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Available in {56 - (daysSinceLastDonation || 0)} days
                </Button>
              )}
              <p className="text-sm text-gray-600">
                Regular donors can donate every 8 weeks (56 days). Your health and safety are our priority.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled donation appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDonations && upcomingDonations.length > 0 ? (
                upcomingDonations.map((donation: any) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{donation.blood_banks?.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(donation.scheduled_date).toLocaleDateString()} at {donation.scheduled_time}
                      </p>
                    </div>
                    <StatusBadge status={donation.status} />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No upcoming appointments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nearby Blood Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <span>Nearby Blood Banks</span>
          </CardTitle>
          <CardDescription>Find convenient locations to donate blood</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyBloodBanks?.map((bank: any) => (
              <div key={bank.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold">{bank.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{bank.address}</p>
                <p className="text-sm text-gray-600">
                  {bank.city}, {bank.state}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-green-600">✓ Verified</span>
                  <Link href={`/blood-banks/${bank.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donation History</CardTitle>
          <CardDescription>Your recent donation activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {donations && donations.length > 0 ? (
              donations.slice(0, 5).map((donation: any) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 border-l-4 border-red-200 bg-red-50"
                >
                  <div>
                    <p className="font-medium">
                      {donation.status === "completed" ? "Donation Completed" : "Donation Scheduled"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(donation.scheduled_date).toLocaleDateString()}
                      {donation.units_donated && ` • ${donation.units_donated} units`}
                    </p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Start Your Donation Journey</p>
                <p className="text-sm">Schedule your first donation to begin saving lives!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
