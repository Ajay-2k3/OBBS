"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryItem {
  blood_type: string
  units_available: number
  units_reserved: number
  blood_bank_name: string
  expiry_date: string
}

interface LiveInventoryTrackerProps {
  bloodBankId?: string
  className?: string
}

export default function LiveInventoryTracker({ bloodBankId, className }: LiveInventoryTrackerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [changes, setChanges] = useState<Record<string, "up" | "down" | "same">>({})

  useEffect(() => {
    // Fetch initial inventory
    const fetchInventory = async () => {
      let query = supabase
        .from("blood_inventory")
        .select(`
          blood_type,
          units_available,
          units_reserved,
          expiry_date,
          blood_banks(name)
        `)
        .eq("is_available", true)
        .gte("expiry_date", new Date().toISOString().split("T")[0])

      if (bloodBankId) {
        query = query.eq("blood_bank_id", bloodBankId)
      }

      const { data } = await query

      if (data) {
        const processedData = data.map((item: any) => ({
          blood_type: item.blood_type,
          units_available: item.units_available,
          units_reserved: item.units_reserved,
          blood_bank_name: item.blood_banks?.name || "Unknown",
          expiry_date: item.expiry_date,
        }))
        setInventory(processedData)
      }
    }

    fetchInventory()

    // Subscribe to real-time inventory changes
    const channel = supabase
      .channel("inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blood_inventory",
          ...(bloodBankId && { filter: `blood_bank_id=eq.${bloodBankId}` }),
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === "INSERT" && newRecord) {
            // Add new inventory item
            setInventory((prev) => {
              const newItem = {
                blood_type: newRecord.blood_type,
                units_available: newRecord.units_available,
                units_reserved: newRecord.units_reserved,
                blood_bank_name: "Loading...",
                expiry_date: newRecord.expiry_date,
              }
              return [...prev, newItem]
            })

            // Show change indicator
            setChanges((prev) => ({ ...prev, [newRecord.blood_type]: "up" }))
          } else if (eventType === "UPDATE" && newRecord && oldRecord) {
            // Update existing inventory item
            setInventory((prev) =>
              prev.map((item) => {
                if (item.blood_type === newRecord.blood_type) {
                  const changeType =
                    newRecord.units_available > oldRecord.units_available
                      ? "up"
                      : newRecord.units_available < oldRecord.units_available
                        ? "down"
                        : "same"

                  setChanges((prevChanges) => ({ ...prevChanges, [newRecord.blood_type]: changeType }))

                  return {
                    ...item,
                    units_available: newRecord.units_available,
                    units_reserved: newRecord.units_reserved,
                  }
                }
                return item
              }),
            )
          } else if (eventType === "DELETE" && oldRecord) {
            // Remove inventory item
            setInventory((prev) => prev.filter((item) => item.blood_type !== oldRecord.blood_type))
          }

          // Clear change indicators after 3 seconds
          setTimeout(() => {
            setChanges((prev) => {
              const updated = { ...prev }
              if (newRecord) {
                delete updated[newRecord.blood_type]
              }
              return updated
            })
          }, 3000)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bloodBankId])

  // Group inventory by blood type
  const groupedInventory = inventory.reduce((acc: Record<string, InventoryItem[]>, item) => {
    if (!acc[item.blood_type]) {
      acc[item.blood_type] = []
    }
    acc[item.blood_type].push(item)
    return acc
  }, {})

  // Calculate totals for each blood type
  const inventoryTotals = Object.entries(groupedInventory).map(([bloodType, items]) => ({
    bloodType,
    totalAvailable: items.reduce((sum, item) => sum + item.units_available, 0),
    totalReserved: items.reduce((sum, item) => sum + item.units_reserved, 0),
    itemCount: items.length,
  }))

  const getChangeIcon = (bloodType: string) => {
    const change = changes[bloodType]
    switch (change) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span>Live Blood Inventory</span>
        </CardTitle>
        <CardDescription>
          Real-time blood availability across {bloodBankId ? "this blood bank" : "all blood banks"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bloodType) => {
            const data = inventoryTotals.find((item) => item.bloodType === bloodType)
            const available = data?.totalAvailable || 0
            const reserved = data?.totalReserved || 0
            const changeIcon = getChangeIcon(bloodType)

            return (
              <div
                key={bloodType}
                className={cn(
                  "text-center p-4 border rounded-lg transition-all duration-300",
                  changes[bloodType] === "up" && "border-green-300 bg-green-50",
                  changes[bloodType] === "down" && "border-red-300 bg-red-50",
                )}
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BloodTypeBadge bloodType={bloodType} size="sm" />
                  {changeIcon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{available}</div>
                <div className="text-sm text-gray-600">available</div>
                {reserved > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {reserved} reserved
                    </Badge>
                  </div>
                )}
                {available < 10 && available > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                      Low Stock
                    </Badge>
                  </div>
                )}
                {available === 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
