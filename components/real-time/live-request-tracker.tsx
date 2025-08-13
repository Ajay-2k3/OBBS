"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BloodTypeBadge from "@/components/ui/blood-type-badge"
import UrgencyBadge from "@/components/ui/urgency-badge"
import StatusBadge from "@/components/ui/status-badge"
import { supabase } from "@/lib/supabase/client"
import { Clock, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface BloodRequest {
  id: string
  blood_type: string
  units_needed: number
  urgency_level: string
  status: string
  created_at: string
  needed_by_date: string
  hospital_name: string
  recipient_name: string
}

interface LiveRequestTrackerProps {
  bloodBankId?: string
  userId?: string
  className?: string
}

export default function LiveRequestTracker({ bloodBankId, userId, className }: LiveRequestTrackerProps) {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch initial requests
    const fetchRequests = async () => {
      let query = supabase
        .from("blood_requests")
        .select(`
          id,
          blood_type,
          units_needed,
          urgency_level,
          status,
          created_at,
          needed_by_date,
          hospital_name,
          users(full_name)
        `)
        .in("status", ["pending", "approved"])
        .order("urgency_level", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10)

      if (bloodBankId) {
        query = query.eq("blood_bank_id", bloodBankId)
      }

      if (userId) {
        query = query.eq("recipient_id", userId)
      }

      const { data } = await query

      if (data) {
        const processedData = data.map((item: any) => ({
          id: item.id,
          blood_type: item.blood_type,
          units_needed: item.units_needed,
          urgency_level: item.urgency_level,
          status: item.status,
          created_at: item.created_at,
          needed_by_date: item.needed_by_date,
          hospital_name: item.hospital_name,
          recipient_name: item.users?.full_name || "Unknown",
        }))
        setRequests(processedData)
      }
    }

    fetchRequests()

    // Subscribe to real-time request changes
    const channel = supabase
      .channel("request_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blood_requests",
          ...(bloodBankId && { filter: `blood_bank_id=eq.${bloodBankId}` }),
          ...(userId && { filter: `recipient_id=eq.${userId}` }),
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === "INSERT" && newRecord) {
            // Add new request
            const newRequest = {
              id: newRecord.id,
              blood_type: newRecord.blood_type,
              units_needed: newRecord.units_needed,
              urgency_level: newRecord.urgency_level,
              status: newRecord.status,
              created_at: newRecord.created_at,
              needed_by_date: newRecord.needed_by_date,
              hospital_name: newRecord.hospital_name,
              recipient_name: "Loading...",
            }

            setRequests((prev) => [newRequest, ...prev.slice(0, 9)])
            setNewRequestIds((prev) => new Set([...prev, newRecord.id]))

            // Remove highlight after 5 seconds
            setTimeout(() => {
              setNewRequestIds((prev) => {
                const updated = new Set(prev)
                updated.delete(newRecord.id)
                return updated
              })
            }, 5000)
          } else if (eventType === "UPDATE" && newRecord) {
            // Update existing request
            setRequests((prev) =>
              prev.map((request) =>
                request.id === newRecord.id
                  ? {
                      ...request,
                      status: newRecord.status,
                      urgency_level: newRecord.urgency_level,
                      units_needed: newRecord.units_needed,
                    }
                  : request,
              ),
            )
          } else if (eventType === "DELETE" && oldRecord) {
            // Remove request
            setRequests((prev) => prev.filter((request) => request.id !== oldRecord.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bloodBankId, userId])

  const getUrgencyPriority = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return 4
      case "high":
        return 3
      case "medium":
        return 2
      case "low":
        return 1
      default:
        return 0
    }
  }

  // Sort requests by urgency and creation date
  const sortedRequests = [...requests].sort((a, b) => {
    const urgencyDiff = getUrgencyPriority(b.urgency_level) - getUrgencyPriority(a.urgency_level)
    if (urgencyDiff !== 0) return urgencyDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          <span>Live Blood Requests</span>
        </CardTitle>
        <CardDescription>
          Real-time blood requests {bloodBankId ? "for your blood bank" : userId ? "from you" : "system-wide"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedRequests.length > 0 ? (
            sortedRequests.map((request) => {
              const isNew = newRequestIds.has(request.id)
              const isUrgent = ["critical", "high"].includes(request.urgency_level)
              const daysUntilNeeded = Math.ceil(
                (new Date(request.needed_by_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
              )

              return (
                <div
                  key={request.id}
                  className={cn(
                    "p-4 border rounded-lg transition-all duration-300",
                    isNew && "border-blue-300 bg-blue-50 animate-pulse",
                    isUrgent && !isNew && "border-red-200 bg-red-50",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <BloodTypeBadge bloodType={request.blood_type} size="sm" />
                      <UrgencyBadge urgency={request.urgency_level as any} />
                      <StatusBadge status={request.status} />
                      {isNew && <Badge className="bg-blue-600 text-white text-xs">NEW</Badge>}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium">{request.units_needed} units needed</p>
                      <p className="text-gray-600">Patient: {request.recipient_name}</p>
                      <p className="text-gray-600">Hospital: {request.hospital_name}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Needed by: {new Date(request.needed_by_date).toLocaleDateString()}</span>
                      </div>
                      {daysUntilNeeded <= 3 && (
                        <div className="flex items-center space-x-1 text-red-600 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            {daysUntilNeeded <= 0 ? "Overdue" : `${daysUntilNeeded} days left`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No active blood requests</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
