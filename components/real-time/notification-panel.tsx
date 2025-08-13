"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, CheckCheck, Heart, AlertTriangle, Info } from "lucide-react"
import { useNotifications } from "./notification-provider"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "donation_completed":
      case "donation_scheduled":
        return Heart
      case "request_approved":
      case "request_fulfilled":
        return Check
      case "request_urgent":
      case "inventory_low":
        return AlertTriangle
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "donation_completed":
      case "donation_scheduled":
        return "text-red-600"
      case "request_approved":
      case "request_fulfilled":
        return "text-green-600"
      case "request_urgent":
      case "inventory_low":
        return "text-yellow-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuHeader className="font-normal">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs">
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuHeader>
        <ScrollArea className="h-80">
          <div className="space-y-1 p-1">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                      !notification.is_read && "bg-blue-50 border-l-2 border-blue-500",
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className={cn("mt-0.5", iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={cn("text-sm font-medium", !notification.is_read && "text-gray-900")}>
                          {notification.title}
                        </p>
                        {!notification.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-2" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
