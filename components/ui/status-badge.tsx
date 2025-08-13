"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"

interface StatusBadgeProps {
  status: string
  type?: "request" | "donation" | "general"
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  // Request statuses
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  // Donation statuses
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  // General statuses
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: AlertCircle,
  },
}

export default function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: AlertCircle,
  }
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("font-medium border", config.color, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
