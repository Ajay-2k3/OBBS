import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Calendar, Search, CheckCircle, XCircle, Clock, Edit, User, Phone, MapPin } from "lucide-react"

export default async function BloodBankDonationsPage() {
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

  if (!profile || profile.role !== "blood_bank") {
    redirect("/dashboard")
  }

  // Get blood bank for this user
  const { data: bloodBank } = await supabase
    .from("blood_banks")
    .select("*")
    .eq("admin_id", user.id)
    .single()

  if (!bloodBank) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blood Bank Not Found</h1>
            <p className="text-gray-600">You are not associated with any blood bank.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Get donation history for this blood bank
  const { data: donations = [] } = await supabase
    .from("donation_history")
    .select(`
      *,
      donor:users(full_name, email, phone, address, blood_type, city)
    `)
    .eq("blood_bank_id", bloodBank.id)
    .order("scheduled_date", { ascending: false })

  // Get donation statistics
  const totalDonations = (donations || []).length
  const completedDonations = (donations || []).filter(d => d.status === 'completed').length
  const scheduledDonations = (donations || []).filter(d => d.status === 'scheduled').length
  const pendingDonations = (donations || []).filter(d => d.status === 'pending').length

  // Get today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = (donations || []).filter(d => 
    d.scheduled_date && new Date(d.scheduled_date).toISOString().split('T')[0] === today
  )

  // Get upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingAppointments = (donations || []).filter(d => 
    d.scheduled_date && 
    new Date(d.scheduled_date) > new Date() && 
    new Date(d.scheduled_date) <= nextWeek
  )

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
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donation Management</h1>
            <p className="text-gray-600 mt-2">Manage donations for {bloodBank.name}</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Donation
          </Button>
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
            description="Successfully collected"
            icon="checkCircle"
            className="border-green-200"
          />
          <StatsCard
            title="Scheduled"
            value={scheduledDonations}
            description="Confirmed appointments"
            icon="clock"
            className="border-yellow-200"
          />
          <StatsCard
            title="Pending"
            value={pendingDonations}
            description="Awaiting confirmation"
            icon="alertTriangle"
            className="border-orange-200"
          />
        </div>

        {/* Today's Appointments */}
        {todayAppointments.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Calendar className="h-5 w-5 mr-2" />
                Today's Appointments ({todayAppointments.length})
              </CardTitle>
              <CardDescription className="text-blue-700">
                Donations scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((donation) => (
                  <div key={donation.id} className="bg-white p-4 rounded border flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {donation.donor?.full_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {donation.donor?.phone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {donation.scheduled_date ? 
                            new Date(donation.scheduled_date).toLocaleTimeString() : 
                            'Time not set'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BloodTypeBadge bloodType={donation.donor?.blood_type} />
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Complete
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Appointments (Next 7 Days)
              </CardTitle>
              <CardDescription>
                Scheduled donations for the coming week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        {donation.donor?.full_name}
                      </div>
                      <BloodTypeBadge bloodType={donation.donor?.blood_type} />
                    </div>
                    <div className="text-sm text-gray-600">
                      {donation.scheduled_date ? 
                        new Date(donation.scheduled_date).toLocaleDateString() : 
                        'Date not set'
                      }
                    </div>
                  </div>
                ))}
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
                    placeholder="Search by donor name, phone, or email..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
              All Donations
            </CardTitle>
            <CardDescription>
              Complete donation history and management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(donations || []).map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {donation.donor?.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {donation.donor?.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {donation.donor?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BloodTypeBadge bloodType={donation.donor?.blood_type} />
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {donation.status === 'scheduled' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Complete
                            </Button>
                          )}
                          {donation.status === 'pending' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Approve
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(donations || []).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                <p className="text-gray-500">Donation appointments will appear here when scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
