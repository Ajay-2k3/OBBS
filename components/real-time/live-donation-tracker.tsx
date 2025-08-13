"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/ui/status-badge"
import { supabase } from "@/lib/supabase/client"
import { Calendar, Heart, Clock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Donation {
  id: string
  donor_name: string
  scheduled_date: string
  scheduled_time: string
  status: string
  blood_bank_name: string
  units_donated?: number
  created_at: string
}

interface LiveDonationTrackerProps {
  bloodBankId?: string
  userId?: string
  className?: string
}

export default function LiveDonationTracker({ bloodBankId, userId, className }: LiveDonationTrackerProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [recentUpdates, setRecentUpdates] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch initial donations
    const fetchDonations = async () => {
      let query = supabase
        .from("donations")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          units_donated,
          created_at,
          users(full_name),
          blood_banks(name)
        `)
        .in("status", ["scheduled", "completed"])
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(10)

      if (bloodBankId) {
        query = query.eq("blood_bank_id", bloodBankId)
      }

      if (userId) {
        query = query.eq("donor_id", userId)
      }

      const { data } = await query

      if (data) {
        const processedData = data.map((item: any) => ({
          id: item.id,
          donor_name: item.users?.full_name || "Unknown",
          scheduled_date: item.scheduled_date,
          scheduled_time: item.scheduled_time,
          status: item.status,
          blood_bank_name: item.blood_banks?.name || "Unknown",
          units_donated: item.units_donated,
          created_at: item.created_at,
        }))
        setDonations(processedData)
      }
    }

    fetchDonations()

    // Subscribe to real-time donation changes
    const channel = supabase
      .channel("donation_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
          ...(bloodBankId && { filter: `blood_bank_id=eq.${bloodBankId}` }),
          ...(userId && { filter: `donor_id=eq.${userId}` }),
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === "INSERT" && newRecord) {
            // Add new donation
            const newDonation = {
              id: newRecord.id,
              donor_name: "Loading...",
              scheduled_date: newRecord.scheduled_date,
              scheduled_time: newRecord.scheduled_time,
              status: newRecord.status,
              blood_bank_name: "Loading...",
              units_donated: newRecord.units_donated,
              created_at: newRecord.created_at,
            }

            setDonations((prev) => {
              const updated = [newDonation, ...prev].slice(0, 10)
              return updated.sort((a, b) => {
                const dateA = new Date(`${a.scheduled_date} ${a.scheduled_time}`)
                const dateB = new Date(`${b.scheduled_date} ${b.scheduled_time}`)
                return dateA.getTime() - dateB.getTime()
              })
            })

            setRecentUpdates((prev) => new Set([...prev, newRecord.id]))
          } else if (eventType === "UPDATE" && newRecord) {
            // Update existing donation
            setDonations((prev) =>
              prev.map((donation) =>
                donation.id === newRecord.id
                  ? {
                      ...donation,
                      status: newRecord.status,
                      units_donated: newRecord.units_donated,
                      scheduled_date: newRecord.scheduled_date,
                      scheduled_time: newRecord.scheduled_time,
                    }
                  : donation,
              ),
            )

            setRecentUpdates((prev) => new Set([...prev, newRecord.id]))
          } else if (eventType === "DELETE" && oldRecord) {
            // Remove donation
            setDonations((prev) => prev.filter((donation) => donation.id !== oldRecord.id))
          }

          // Clear update highlights after 3 seconds
          setTimeout(() => {
            setRecentUpdates((prev) => {
              const updated = new Set(prev)
              if (newRecord) {
                updated.delete(newRecord.id)
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
  }, [bloodBankId, userId])

  // Separate today's donations from future ones
  const today = new Date().toISOString().split("T")[0]
  const todayDonations = donations.filter((d) => d.scheduled_date === today)
  const upcomingDonations = donations.filter((d) => d.scheduled_date > today)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span>Live Donation Schedule</span>
        </CardTitle>
        <CardDescription>
          Real-time donation appointments {bloodBankId ? "at your blood bank" : userId ? "for you" : "system-wide"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Today's Donations */}
          {todayDonations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Today's Appointments</span>
                <Badge variant="outline">{todayDonations.length}</Badge>
              </h4>
              <div className="space-y-2">
                {todayDonations.map((donation) => {
                  const isRecentUpdate = recentUpdates.has(donation.id)
                  const isCompleted = donation.status === "completed"

                  return (
                    <div
                      key={donation.id}
                      className={cn(
                        "p-3 border rounded-lg transition-all duration-300",
                        isRecentUpdate && "border-green-300 bg-green-50",
                        isCompleted && !isRecentUpdate && "border-green-200 bg-green-50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Heart className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{donation.donor_name}</span>
                            <StatusBadge status={donation.status} />
                            {isRecentUpdate && <Badge className="bg-green-600 text-white text-xs">UPDATED</Badge>}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{donation.scheduled_time}</span>
                            </div>
                            {donation.units_donated && (
                              <span className="text-green-600 font-medium">{donation.units_donated} units donated</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {!userId && <div>{donation.blood_bank_name}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming Donations */}
          {upcomingDonations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Upcoming Appointments</span>
                <Badge variant="outline">{upcomingDonations.length}</Badge>
              </h4>
              <div className="space-y-2">
                {upcomingDonations.map((donation) => {
                  const isRecentUpdate = recentUpdates.has(donation.id)

                  return (
                    <div
                      key={donation.id}
                      className={cn(
                        "p-3 border rounded-lg transition-all duration-300",
                        isRecentUpdate && "border-blue-300 bg-blue-50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Heart className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{donation.donor_name}</span>
                            <StatusBadge status={donation.status} />
                            {isRecentUpdate && <Badge className="bg-blue-600 text-white text-xs">NEW</Badge>}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(donation.scheduled_date), "MMM dd")} at {donation.scheduled_time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {!userId && <div>{donation.blood_bank_name}</div>}
                          <div>
                            {formatDistanceToNow(new Date(`${donation.scheduled_date} ${donation.scheduled_time}`), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Donations */}
          {donations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No scheduled donations</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
