import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Calendar, Search, CheckCircle, Clock, Building, Award, TrendingUp } from "lucide-react"

export default async function DonationsHistoryPage() {
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

  if (!profile) {
    redirect("/auth/login")
  }

  let donations = []
  let totalDonations = 0
  let completedDonations = 0
  let totalUnits = 0
  let nextEligibleDate = null

  if (profile.role === 'donor') {
    // Get donations for this donor
    const { data: donorDonations = [] } = await supabase
      .from("donation_history")
      .select(`
        *,
        blood_bank:blood_banks(name, city)
      `)
      .eq("donor_id", user.id)
      .order("scheduled_date", { ascending: false })

    donations = donorDonations || []
    totalDonations = donations.length
    completedDonations = donations.filter(d => d.status === 'completed').length
    totalUnits = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.quantity || 1), 0)

    // Calculate next eligible date (90 days from last donation)
    const lastDonation = donations.find(d => d.status === 'completed')
    if (lastDonation && lastDonation.actual_date) {
      const lastDate = new Date(lastDonation.actual_date)
      nextEligibleDate = new Date(lastDate.setDate(lastDate.getDate() + 90))
    }
  } else if (profile.role === 'admin') {
    // Admins can see all donations
    const { data: allDonations = [] } = await supabase
      .from("donation_history")
      .select(`
        *,
        donor:users(full_name, blood_type),
        blood_bank:blood_banks(name, city)
      `)
      .order("scheduled_date", { ascending: false })
      .limit(100)

    donations = allDonations || []
    totalDonations = donations.length
    completedDonations = donations.filter(d => d.status === 'completed').length
    totalUnits = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.quantity || 1), 0)
  } else if (profile.role === 'blood_bank') {
    // Blood bank sees donations linked to their bank
    const { data: bloodBank } = await supabase
      .from("blood_banks")
      .select("id, name")
      .eq("admin_id", user.id)
      .single()

    if (bloodBank) {
      const { data: bankDonations = [] } = await supabase
        .from("donation_history")
        .select(`
          *,
          donor:users(full_name, blood_type, phone)
        `)
        .eq("blood_bank_id", bloodBank.id)
        .order("scheduled_date", { ascending: false })

      donations = bankDonations || []
      totalDonations = donations.length
      completedDonations = donations.filter(d => d.status === 'completed').length
      totalUnits = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.quantity || 1), 0)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'secondary'
      case 'scheduled': return 'default'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled': return <Calendar className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donation History</h1>
            <p className="text-gray-600 mt-2">
              {profile.role === 'donor' && "Track your donation history and eligibility"}
              {profile.role === 'admin' && "System-wide donation history and analytics"}
              {profile.role === 'blood_bank' && "Donations received by your blood bank"}
            </p>
          </div>
        </div>

        {/* Donation Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Donations"
            value={totalDonations}
            icon="calendar"
            className="border-blue-200"
          />
          <StatsCard
            title="Completed"
            value={completedDonations}
            description="Successfully donated"
            icon="checkCircle"
            className="border-green-200"
          />
          <StatsCard
            title="Blood Units"
            value={totalUnits}
            description="Total units donated"
            icon="droplets"
            className="border-red-200"
          />
          {profile.role === 'donor' && (
            <StatsCard
              title="Donation Score"
              value={completedDonations * 10}
              description="Impact points earned"
              icon="award"
              className="border-yellow-200"
            />
          )}
          {profile.role !== 'donor' && (
            <StatsCard
              title="This Month"
              value={donations.filter(d => {
                const donationDate = new Date(d.scheduled_date || d.actual_date)
                const thisMonth = new Date()
                return donationDate.getMonth() === thisMonth.getMonth() && 
                       donationDate.getFullYear() === thisMonth.getFullYear()
              }).length}
              description="Recent donations"
              icon="trendingUp"
              className="border-purple-200"
            />
          )}
        </div>

        {/* Eligibility Status for Donors */}
        {profile.role === 'donor' && (
          <Card className={`mb-6 ${nextEligibleDate && nextEligibleDate > new Date() ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${nextEligibleDate && nextEligibleDate > new Date() ? 'text-orange-800' : 'text-green-800'}`}>
                <Award className="h-5 w-5 mr-2" />
                Donation Eligibility Status
              </CardTitle>
              <CardDescription className={nextEligibleDate && nextEligibleDate > new Date() ? 'text-orange-700' : 'text-green-700'}>
                {nextEligibleDate && nextEligibleDate > new Date() 
                  ? `You can donate again after ${nextEligibleDate.toLocaleDateString()}`
                  : "You are eligible to donate now!"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Last Donation</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {donations.find(d => d.status === 'completed')?.actual_date 
                        ? new Date(donations.find(d => d.status === 'completed')!.actual_date!).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Contributions</div>
                    <div className="text-lg font-semibold text-gray-900">{totalUnits} units</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Impact Score</div>
                    <div className="text-lg font-semibold text-gray-900">{completedDonations * 10} points</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search by ${profile.role === 'donor' ? 'blood bank' : 'donor name or blood bank'}...`}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {profile.role !== 'donor' && (
                  <select className="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">All Blood Groups</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                )}
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Donation History
            </CardTitle>
            <CardDescription>
              {profile.role === 'donor' && "Your complete donation history"}
              {profile.role === 'admin' && "System-wide donation records"}
              {profile.role === 'blood_bank' && "Donations received by your blood bank"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {profile.role !== 'donor' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donor
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(donations || []).map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      {profile.role !== 'donor' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {donation.donor?.full_name?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {donation.donor?.full_name}
                              </div>
                              <BloodTypeBadge bloodType={donation.donor?.blood_type} />
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {donation.blood_bank?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {donation.blood_bank?.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.scheduled_date ? 
                          new Date(donation.scheduled_date).toLocaleDateString() : 
                          'Not scheduled'
                        }
                        {donation.scheduled_date && (
                          <div className="text-xs text-gray-500">
                            {new Date(donation.scheduled_date).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.actual_date ? 
                          new Date(donation.actual_date).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(donation.status)}
                          <Badge variant={getStatusBadge(donation.status) as any} className="ml-2">
                            {donation.status?.charAt(0).toUpperCase() + donation.status?.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.quantity || 1} unit{(donation.quantity || 1) > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.post_donation_notes ? (
                          <span className="truncate max-w-xs" title={donation.post_donation_notes}>
                            {donation.post_donation_notes.length > 30 
                              ? donation.post_donation_notes.substring(0, 30) + '...'
                              : donation.post_donation_notes
                            }
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(donations || []).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No donation history</h3>
                <p className="text-gray-500">
                  {profile.role === 'donor' 
                    ? "Your donation history will appear here after your first donation."
                    : "Donation records will appear here when donations are made."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
