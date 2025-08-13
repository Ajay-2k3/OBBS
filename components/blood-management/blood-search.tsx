"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import LoadingSpinner from "@/components/ui/loading-spinner"
import EmptyState from "@/components/ui/empty-state"
import { Search, MapPin, Droplets } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface BloodSearchResult {
  blood_bank_id: string
  blood_bank_name: string
  city: string
  available_units: number
  distance_priority: number
}

export default function BloodSearch() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BloodSearchResult[]>([])
  const [searchParams, setSearchParams] = useState({
    bloodType: "",
    unitsNeeded: "",
    city: "",
  })

  const handleSearch = async () => {
    if (!searchParams.bloodType || !searchParams.unitsNeeded) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("check_blood_availability", {
        required_blood_type: searchParams.bloodType,
        required_units: Number.parseInt(searchParams.unitsNeeded),
        preferred_city: searchParams.city || null,
      })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error("Error searching blood:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Blood Availability</span>
          </CardTitle>
          <CardDescription>Find available blood units across verified blood banks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Type *</label>
              <Select
                value={searchParams.bloodType}
                onValueChange={(value) => setSearchParams({ ...searchParams, bloodType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Units Needed *</label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 2"
                value={searchParams.unitsNeeded}
                onChange={(e) => setSearchParams({ ...searchParams, unitsNeeded: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred City</label>
              <Input
                placeholder="e.g., New York"
                value={searchParams.city}
                onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!searchParams.bloodType || !searchParams.unitsNeeded || loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && <LoadingSpinner text="Searching blood banks..." />}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({results.length} found)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{result.blood_bank_name}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{result.city}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">{result.available_units}</div>
                      <div className="text-sm text-gray-500">units available</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <BloodTypeBadge bloodType={searchParams.bloodType} />
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Contact Bank
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && searchParams.bloodType && searchParams.unitsNeeded && (
        <EmptyState
          icon={Droplets}
          title="No Blood Available"
          description={`No blood banks currently have ${searchParams.unitsNeeded} units of ${searchParams.bloodType} blood available. Try reducing the number of units or check back later.`}
          action={{
            label: "Create Blood Request",
            onClick: () => (window.location.href = "/blood-requests/new"),
          }}
        />
      )}
    </div>
  )
}
