"use client";

import StatsCard from "@/components/ui/stats-card";
import { Package, AlertTriangle, Calendar, Users } from "lucide-react";

const iconMap = {
  package: Package,
  alertTriangle: AlertTriangle,
  calendar: Calendar,
  users: Users,
};

interface BloodBankStatsCardsProps {
  totalInventory: number;
  lowStockItems: number;
  expiringItems: number;
  todayDonations: number;
}

export default function BloodBankStatsCards({
  totalInventory,
  lowStockItems,
  expiringItems,
  todayDonations,
}: BloodBankStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard
        title="Total Inventory"
        value={totalInventory}
        description="Units available"
        icon={iconMap.package}
        className="border-blue-200"
      />
      <StatsCard
        title="Low Stock Alerts"
        value={lowStockItems}
        description="Blood types < 10 units"
        icon={iconMap.alertTriangle}
        className="border-yellow-200"
      />
      <StatsCard
        title="Expiring Soon"
        value={expiringItems}
        description="Within 7 days"
        icon={iconMap.calendar}
        className="border-red-200"
      />
      <StatsCard
        title="Today's Donations"
        value={todayDonations}
        description="Scheduled appointments"
        icon={iconMap.users}
        className="border-green-200"
      />
    </div>
  );
}
