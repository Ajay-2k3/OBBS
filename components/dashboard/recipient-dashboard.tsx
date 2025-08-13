import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import StatusBadge from "@/components/ui/status-badge"
import UrgencyBadge from "@/components/ui/urgency-badge"
import { Search, Plus, AlertCircle, CheckCircle, Clock, Heart } from "lucide-react"
import Link from "next/link"

interface RecipientDashboardProps {
  user: {
    id: string
    full_name: string
    blood_type: string
    role: string
  }
}

export default async function RecipientDashboard({ user }: RecipientDashboardProps) {
  const supabase = createClient()

  // Get blood requests
  const { data: bloodRequests } = await supabase
    .from("blood_requests")
    .select("*, blood_banks(name)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })

  // Get active requests
  const { data: activeRequests } = await supabase
    .from("blood_requests")
    .select("*, blood_banks(name)")
    .eq("recipient_id", user.id)
    .in("status", ["pending", "approved"])
    .order("urgency_level", { ascending: false })

  // Get blood availability for user's blood type
  const { data: availableBlood } = await supabase
    .from("blood_inventory")
    .select("blood_type, units_available, blood_banks(name, city)")
    .eq("blood_type", user.blood_type)
    .eq("is_available", true)
    .gt("units_available", 0)
    .gte("expiry_date", new Date().toISOString().split("T")[0])

  const totalRequests = bloodRequests?.length || 0
  const pendingRequests = bloodRequests?.filter((r) => r.status === "pending").length || 0
  const fulfilledRequests = bloodRequests?.filter((r) => r.status === "fulfilled").length || 0
  const totalUnitsReceived = bloodRequests?.reduce((sum, r) => sum + (r.fulfilled_units || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.full_name.split(" ")[0]}</h1>
            <p className="text-blue-100 mt-2">We're here to help you find the blood you need.</p>
            <div className="flex items-center space-x-4 mt-4">
              <BloodTypeBadge bloodType={user.blood_type} className="bg-white/20 text-white border-white/30" />
              <div className="text-sm">
                <span>Looking for {user.blood_type} blood type</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{totalRequests}</div>
            <div className="text-blue-100">Total Requests</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Active Requests"
          value={pendingRequests}
          description="Currently processing"
          icon={Clock}
          className="border-yellow-200"
        />
        <StatsCard
          title="Fulfilled Requests"
          value={fulfilledRequests}
          description="Successfully completed"
          icon={CheckCircle}
          className="border-green-200"
        />
        <StatsCard
          title="Units Received"
          value={totalUnitsReceived}
          description="Total blood units"
          icon={Heart}
          className="border-red-200"
        />
        <StatsCard
          title="Available Units"
          value={availableBlood?.reduce((sum, b) => sum + b.units_available, 0) || 0}
          description="Your blood type nearby"
          icon={Search}
          className="border-blue-200"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>New Blood Request</span>
            </CardTitle>
            <CardDescription>Submit a new request for blood units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/blood-requests/new">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Blood Request
                </Button>
              </Link>
              <p className="text-sm text-gray-600">
                Our system will automatically match your request with available blood inventory and notify relevant
                blood banks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Blood Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-600" />
              <span>Blood Availability</span>
            </CardTitle>
            <CardDescription>Current availability of your blood type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableBlood && availableBlood.length > 0 ? (
                availableBlood.slice(0, 3).map((blood: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{blood.blood_banks?.name}</p>
                      <p className="text-sm text-gray-600">{blood.blood_banks?.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{blood.units_available} units</p>
                      <BloodTypeBadge bloodType={blood.blood_type} size="sm" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No {user.blood_type} blood currently available</p>
                  <p className="text-sm">Consider creating a request to be notified when available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests */}
      {activeRequests && activeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Blood Requests</CardTitle>
            <CardDescription>Your current pending and approved requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <BloodTypeBadge bloodType={request.blood_type} />
                        <UrgencyBadge urgency={request.urgency_level} />
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="font-medium">{request.units_needed} units needed</p>
                      <p className="text-sm text-gray-600">For: {request.hospital_name}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Needed by: {new Date(request.needed_by_date).toLocaleDateString()}</p>
                      {request.blood_banks && <p>Assigned to: {request.blood_banks.name}</p>}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm">
                      <strong>Medical Reason:</strong> {request.medical_reason}
                    </p>
                    <p className="text-sm mt-1">
                      <strong>Doctor:</strong> {request.doctor_name}
                    </p>
                  </div>
                  {request.fulfilled_units > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-700">
                        Progress: {request.fulfilled_units} of {request.units_needed} units fulfilled
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Your previous blood requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bloodRequests && bloodRequests.length > 0 ? (
              bloodRequests.slice(0, 5).map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border-l-4 border-blue-200 bg-blue-50"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <BloodTypeBadge bloodType={request.blood_type} size="sm" />
                      <span className="font-medium">{request.units_needed} units</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString()} • {request.hospital_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={request.status} />
                    {request.fulfilled_units > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{request.fulfilled_units} units fulfilled</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Requests Yet</p>
                <p className="text-sm">Create your first blood request to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
