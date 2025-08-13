import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatsCard from "@/components/ui/stats-card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import StatusBadge from "@/components/ui/status-badge"
import UrgencyBadge from "@/components/ui/urgency-badge"
import { Package, Users, Calendar, AlertTriangle, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"

interface BloodBankDashboardProps {
  user: {
    id: string
    full_name: string
    role: string
  }
}

export default async function BloodBankDashboard({ user }: BloodBankDashboardProps) {
  const supabase = createClient()

  // Get blood bank info
  const { data: bloodBank } = await supabase.from("blood_banks").select("*").eq("manager_id", user.id).single()

  if (!bloodBank) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold mb-2">Blood Bank Not Found</h2>
        <p className="text-gray-600 mb-4">You don't seem to be associated with a blood bank.</p>
        <Button>Contact Administrator</Button>
      </div>
    )
  }

  // Get inventory data
  const { data: inventory } = await supabase.from("blood_inventory").select("*").eq("blood_bank_id", bloodBank.id)

  // Get pending requests
  const { data: pendingRequests } = await supabase
    .from("blood_requests")
    .select("*, users(full_name)")
    .eq("blood_bank_id", bloodBank.id)
    .eq("status", "pending")
    .order("urgency_level", { ascending: false })

  // Get today's donations
  const { data: todayDonations } = await supabase
    .from("donations")
    .select("*, users(full_name)")
    .eq("blood_bank_id", bloodBank.id)
    .eq("scheduled_date", new Date().toISOString().split("T")[0])
    .order("scheduled_time", { ascending: true })

  // Calculate stats
  const totalInventory = inventory?.reduce((sum, item) => sum + item.units_available, 0) || 0
  const lowStockItems = inventory?.filter((item) => item.units_available < 10).length || 0
  const expiringItems =
    inventory?.filter((item) => {
      const expiryDate = new Date(item.expiry_date)
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return expiryDate <= weekFromNow
    }).length || 0

  // Group inventory by blood type
  const inventoryByType =
    inventory?.reduce((acc: any, item) => {
      if (!acc[item.blood_type]) {
        acc[item.blood_type] = 0
      }
      acc[item.blood_type] += item.units_available
      return acc
    }, {}) || {}

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{bloodBank.name}</h1>
            <p className="text-purple-100 mt-2">Managing blood inventory and donations</p>
            <div className="flex items-center space-x-4 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {bloodBank.is_verified ? "✓ Verified" : "⚠ Pending Verification"}
              </span>
              <span className="text-sm">Capacity: {bloodBank.capacity} units</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{totalInventory}</div>
            <div className="text-purple-100">Units in Stock</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Inventory"
          value={totalInventory}
          description="Units available"
          icon={Package}
          className="border-blue-200"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={lowStockItems}
          description="Blood types < 10 units"
          icon={AlertTriangle}
          className="border-yellow-200"
        />
        <StatsCard
          title="Expiring Soon"
          value={expiringItems}
          description="Within 7 days"
          icon={Calendar}
          className="border-red-200"
        />
        <StatsCard
          title="Today's Donations"
          value={todayDonations?.length || 0}
          description="Scheduled appointments"
          icon={Users}
          className="border-green-200"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-600" />
              <span>Add Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/inventory/add">
              <Button className="w-full bg-green-600 hover:bg-green-700">Add Blood Units</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Manage Donations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/donations/manage">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">View Appointments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>View Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/reports">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Generate Reports</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Blood Inventory Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Inventory by Type</CardTitle>
          <CardDescription>Current stock levels for each blood type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bloodType) => (
              <div key={bloodType} className="text-center p-4 border rounded-lg">
                <BloodTypeBadge bloodType={bloodType} size="lg" className="mb-2" />
                <div className="text-2xl font-bold text-gray-900">{inventoryByType[bloodType] || 0}</div>
                <div className="text-sm text-gray-600">units</div>
                {(inventoryByType[bloodType] || 0) < 10 && <div className="text-xs text-red-600 mt-1">Low Stock</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Blood Requests</CardTitle>
            <CardDescription>Requests awaiting your response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <BloodTypeBadge bloodType={request.blood_type} />
                        <UrgencyBadge urgency={request.urgency_level} />
                      </div>
                      <p className="font-medium">{request.units_needed} units needed</p>
                      <p className="text-sm text-gray-600">Patient: {request.users?.full_name}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Needed by: {new Date(request.needed_by_date).toLocaleDateString()}</p>
                      <Button size="sm" className="mt-2">
                        Review Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Donations */}
      {todayDonations && todayDonations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Donation Schedule</CardTitle>
            <CardDescription>Appointments scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayDonations.map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{donation.users?.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {donation.scheduled_time} • {donation.status}
                    </p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
