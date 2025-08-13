"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, Clock, Zap, AlertCircle } from "lucide-react"

interface UrgencyBadgeProps {
  urgency: "low" | "medium" | "high" | "critical"
  showIcon?: boolean
  className?: string
}

const urgencyConfig = {
  low: {
    label: "Low",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Clock,
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Zap,
  },
}

export default function UrgencyBadge({ urgency, showIcon = true, className }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("font-medium border", config.color, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
