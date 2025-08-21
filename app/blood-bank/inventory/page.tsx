import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import StatsCard from "@/components/ui/stats-card"
import InventoryModal from "@/components/blood-management/inventory-modal"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, Clock, CheckCircle } from "lucide-react"

export default async function BloodBankInventoryPage() {
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

  // Get inventory data
  const { data: inventory = [] } = await supabase
    .from("blood_inventory")
    .select("*")
    .eq("blood_bank_id", bloodBank.id)
    .order("created_at", { ascending: false })

  // Get inventory statistics
  const totalUnits = (inventory || []).reduce((sum, item) => sum + item.quantity, 0)
  const availableUnits = (inventory || [])
    .filter(item => item.status === 'available')
    .reduce((sum, item) => sum + item.quantity, 0)
  const expiredUnits = (inventory || [])
    .filter(item => item.status === 'expired')
    .reduce((sum, item) => sum + item.quantity, 0)
  const reservedUnits = (inventory || [])
    .filter(item => item.status === 'reserved')
    .reduce((sum, item) => sum + item.quantity, 0)

  // Group inventory by blood group
  const inventoryByGroup = (inventory || []).reduce((acc, item) => {
    if (!acc[item.blood_group]) {
      acc[item.blood_group] = { available: 0, expired: 0, reserved: 0, total: 0 }
    }
    acc[item.blood_group][item.status] += item.quantity
    acc[item.blood_group].total += item.quantity
    return acc
  }, {} as any)

  // Get expiring soon items (within 7 days)
  const expiringSoon = (inventory || []).filter(item => {
    const expiryDate = new Date(item.expiry_date)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    return expiryDate <= sevenDaysFromNow && item.status === 'available'
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return 'secondary'
      case 'reserved': return 'default'
      case 'expired': return 'destructive'
      case 'used': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'reserved': return <Clock className="h-4 w-4 text-blue-500" />
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'used': return <CheckCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Manage blood inventory for {bloodBank.name}</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>

        {/* Inventory Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Units"
            value={totalUnits}
            icon="package"
            className="border-blue-200"
          />
          <StatsCard
            title="Available"
            value={availableUnits}
            description="Ready for use"
            icon="checkCircle"
            className="border-green-200"
          />
          <StatsCard
            title="Reserved"
            value={reservedUnits}
            description="Allocated to requests"
            icon="clock"
            className="border-yellow-200"
          />
          <StatsCard
            title="Expired"
            value={expiredUnits}
            description="Need disposal"
            icon="alertTriangle"
            className="border-red-200"
          />
        </div>

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Expiring Soon ({expiringSoon.length} items)
              </CardTitle>
              <CardDescription className="text-orange-700">
                Items that will expire within the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiringSoon.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <BloodTypeBadge bloodType={item.blood_group} />
                      <span className="text-sm font-medium">{item.quantity} units</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Expires: {new Date(item.expiry_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Batch: {item.batch_number}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blood Group Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inventory by Blood Group</CardTitle>
            <CardDescription>
              Current stock levels organized by blood type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(inventoryByGroup).map(([bloodGroup, data]: [string, any]) => (
                <div key={bloodGroup} className="text-center">
                  <BloodTypeBadge bloodType={bloodGroup} className="mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{data.available}</div>
                  <div className="text-sm text-gray-500">available</div>
                  {data.expired > 0 && (
                    <div className="text-xs text-red-600 mt-1">{data.expired} expired</div>
                  )}
                </div>
              ))}
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
                    placeholder="Search by batch number or donor..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
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
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="expired">Expired</option>
                  <option value="used">Used</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Inventory Details
            </CardTitle>
            <CardDescription>
              Detailed view of all blood inventory items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collection Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(inventory || []).map((item) => {
                    const expiryDate = new Date(item.expiry_date)
                    const isExpiringSoon = new Date() > new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <BloodTypeBadge bloodType={item.blood_group} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.quantity} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {item.batch_number || 'N/A'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.collection_date ? new Date(item.collection_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                            {isExpiringSoon && (
                              <div className="text-xs text-red-500">Expiring soon!</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <Badge variant={getStatusBadge(item.status) as any} className="ml-2">
                              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                            </Badge>
                          </div>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {(inventory || []).length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items</h3>
                <p className="text-gray-500">Start by adding blood stock to your inventory.</p>
                <Button className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Stock
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
