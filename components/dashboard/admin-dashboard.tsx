import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import StatsCard from "@/components/ui/stats-card"
import { Users, Building, Droplets, AlertTriangle, TrendingUp, Shield } from "lucide-react"
import { UserWithPermissions } from "@/lib/permissions"
import DashboardHeader from "./common/dashboard-header"
import PermissionGate from "./common/permission-gate"

interface AdminDashboardProps {
  user: UserWithPermissions
}

export default async function AdminDashboard({ user }: AdminDashboardProps) {
  const supabase = await createClient()

  // Get system-wide statistics
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

  const { count: totalBloodBanks } = await supabase.from("blood_banks").select("*", { count: "exact", head: true })

  const { count: verifiedBloodBanks } = await supabase
    .from("blood_banks")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)

  const { count: pendingRequests } = await supabase
    .from("blood_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { data: totalInventory } = await supabase.from("blood_inventory").select("units_available")

  const { data: recentActivity } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  const totalUnits = totalInventory?.reduce((sum, item) => sum + item.units_available, 0) || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-300 mt-2">System overview and management</p>
            <div className="flex items-center space-x-4 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Administrator
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{totalUsers || 0}</div>
            <div className="text-gray-300">Total Users</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={totalUsers || 0}
          description="Registered users"
          icon="users"
          className="border-blue-200"
        />
        <StatsCard
          title="Blood Banks"
          value={`${verifiedBloodBanks || 0}/${totalBloodBanks || 0}`}
          description="Verified/Total"
          icon="building"
          className="border-green-200"
        />
        <StatsCard
          title="Blood Inventory"
          value={totalUnits}
          description="Total units available"
          icon="droplets"
          className="border-red-200"
        />
        <StatsCard
          title="Pending Requests"
          value={pendingRequests || 0}
          description="Awaiting processing"
          icon="alertTriangle"
          className="border-yellow-200"
        />
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Manage user accounts and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Donors</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Recipients</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Blood Bank Staff</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-600" />
              <span>Blood Bank Verification</span>
            </CardTitle>
            <CardDescription>Review and verify blood banks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Verified</span>
                <span className="text-sm font-medium text-green-600">{verifiedBloodBanks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium text-yellow-600">
                  {(totalBloodBanks || 0) - (verifiedBloodBanks || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>System Analytics</span>
            </CardTitle>
            <CardDescription>View system performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active Sessions</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Daily Requests</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest actions and events in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">
                      {activity.table_name} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">{activity.ip_address}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Recent Activity</p>
                <p className="text-sm">System activity will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
