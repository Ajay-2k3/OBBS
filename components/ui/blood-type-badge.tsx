"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BloodTypeBadgeProps {
  bloodType: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const bloodTypeColors = {
  "A+": "bg-red-100 text-red-800 border-red-200",
  "A-": "bg-red-50 text-red-700 border-red-100",
  "B+": "bg-blue-100 text-blue-800 border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border-blue-100",
  "AB+": "bg-purple-100 text-purple-800 border-purple-200",
  "AB-": "bg-purple-50 text-purple-700 border-purple-100",
  "O+": "bg-green-100 text-green-800 border-green-200",
  "O-": "bg-orange-100 text-orange-800 border-orange-200",
}

export default function BloodTypeBadge({ bloodType, size = "md", className }: BloodTypeBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold border",
        bloodTypeColors[bloodType as keyof typeof bloodTypeColors] || "bg-gray-100 text-gray-800 border-gray-200",
        sizeClasses[size],
        className,
      )}
    >
      {bloodType}
    </Badge>
  )
}
