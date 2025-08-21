import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import StatsCard from "@/components/ui/stats-card"
import StaffModal from "@/components/blood-management/staff-modal"
import { Users, UserPlus, Crown, Shield, Mail, Phone, Edit, Trash2, Search } from "lucide-react"

export default async function BloodBankStaffPage() {
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

  // Get all staff for this blood bank
  const { data: staff = [] } = await supabase
    .from("blood_bank_staff")
    .select(`
      *,
      user:users(
        full_name,
        email,
        phone,
        address,
        city,
        created_at
      )
    `)
    .eq("blood_bank_id", bloodBank.id)
    .order("created_at", { ascending: false })

  // Get staff statistics
  const totalStaff = (staff || []).length
  const managers = (staff || []).filter(s => s.role === 'manager').length
  const regularStaff = (staff || []).filter(s => s.role === 'staff').length

  // Get admin info
  const { data: adminUser } = await supabase
    .from("users")
    .select("full_name, email, phone, created_at")
    .eq("id", bloodBank.admin_id)
    .single()

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager': return 'default'
      case 'staff': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Crown className="h-4 w-4 text-blue-500" />
      case 'staff': return <Shield className="h-4 w-4 text-green-500" />
      default: return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-2">Manage staff for {bloodBank.name}</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Staff Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Staff"
            value={totalStaff + 1} // +1 for admin
            icon="users"
            className="border-blue-200"
          />
          <StatsCard
            title="Managers"
            value={managers}
            description="Senior staff"
            icon="crown"
            className="border-purple-200"
          />
          <StatsCard
            title="Staff Members"
            value={regularStaff}
            description="Regular staff"
            icon="shield"
            className="border-green-200"
          />
          <StatsCard
            title="Admin"
            value={1}
            description="Blood bank admin"
            icon="user"
            className="border-orange-200"
          />
        </div>

        {/* Admin Info Card */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Crown className="h-5 w-5 mr-2" />
              Blood Bank Administrator
            </CardTitle>
            <CardDescription className="text-orange-700">
              Primary administrator for this blood bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {adminUser?.full_name || 'Not assigned'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {adminUser?.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {adminUser?.phone || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-orange-100 text-orange-800">Administrator</Badge>
                <div className="text-sm text-gray-500 mt-1">
                  Since {adminUser?.created_at ? new Date(adminUser.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search staff by name, email, or phone..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Roles</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Staff Directory
            </CardTitle>
            <CardDescription>
              Manage staff members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(staff || []).map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {staffMember.user?.full_name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {staffMember.user?.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staffMember.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(staffMember.role)}
                          <Badge variant={getRoleBadge(staffMember.role) as any} className="ml-2">
                            {staffMember.role?.charAt(0).toUpperCase() + staffMember.role?.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {staffMember.user?.phone || 'Not provided'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {staffMember.user?.city || 'City not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(staffMember.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(staff || []).length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                <p className="text-gray-500">Start by adding staff members to your blood bank.</p>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Staff Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Permissions</CardTitle>
              <CardDescription>
                Configure staff access levels and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                View Permissions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Training</CardTitle>
              <CardDescription>
                Manage training records and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Training Records
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>
                View staff activity and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                View Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
