import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Search, MapPin, Phone, Clock } from "lucide-react"

export default async function BloodBankPage() {
  const supabase = await createClient()

  // Get all verified blood banks with their inventory
  const { data: bloodBanks } = await supabase
    .from("blood_banks")
    .select(`
      *,
      blood_inventory (
        blood_type,
        units_available
      )
    `)
    .eq("is_verified", true)
    .order("name")

  // Process inventory data
  const bloodBanksWithInventory = bloodBanks?.map((bank: any) => {
    const inventory = bank.blood_inventory.reduce((acc: any, item: any) => {
      if (!acc[item.blood_type]) {
        acc[item.blood_type] = 0
      }
      acc[item.blood_type] += item.units_available
      return acc
    }, {})

    return {
      ...bank,
      inventory,
      totalUnits: Object.values(inventory).reduce((sum: number, units: any) => sum + units, 0),
    }
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blood Bank Directory</h1>
            <p className="text-gray-600 mt-2">Find verified blood banks and check blood availability</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Blood Banks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Search by name or location..." className="w-full" />
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Blood Banks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bloodBanksWithInventory?.map((bank: any) => (
            <Card key={bank.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{bank.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {bank.city}, {bank.state}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{bank.totalUnits}</div>
                    <div className="text-sm text-gray-500">Total Units</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{bank.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{bank.phone}</span>
                  </div>
                  {bank.operating_hours && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{bank.operating_hours}</span>
                    </div>
                  )}
                </div>

                {/* Blood Inventory */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Available Blood Types</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bloodType) => (
                      <div key={bloodType} className="text-center p-2 border rounded">
                        <BloodTypeBadge bloodType={bloodType} size="sm" className="mb-1" />
                        <div className="text-sm font-medium">{bank.inventory[bloodType] || 0}</div>
                        <div className="text-xs text-gray-500">units</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700">Contact Bank</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {(!bloodBanksWithInventory || bloodBanksWithInventory.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Blood Banks Found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
