"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Award, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

import { FC } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, description, icon, trend, className }: StatsCardProps) => {
  const iconMap: Record<string, FC<{ className?: string }>> = {
    heart: require("lucide-react").Heart,
    award: require("lucide-react").Award,
    clock: require("lucide-react").Clock,
    checkCircle: require("lucide-react").CheckCircle,
    search: require("lucide-react").Search,
    users: require("lucide-react").Users,
    building: require("lucide-react").Building,
    droplets: require("lucide-react").Droplets,
    alertTriangle: require("lucide-react").AlertTriangle,
  };
  const IconComponent = iconMap[icon] || (() => null);
  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {IconComponent && <IconComponent className="h-4 w-4 text-gray-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn("text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}> 
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
