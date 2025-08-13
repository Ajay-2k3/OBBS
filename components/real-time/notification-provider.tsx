"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Bell, Heart, AlertTriangle, CheckCircle } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  related_id?: string
  related_type?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
  userId: string
}

export default function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (data) {
        setNotifications(data)
      }
    }

    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])

          // Show toast notification
          const getIcon = (type: string) => {
            switch (type) {
              case "donation_completed":
              case "donation_scheduled":
                return Heart
              case "request_approved":
              case "request_fulfilled":
                return CheckCircle
              case "request_urgent":
              case "inventory_low":
                return AlertTriangle
              default:
                return Bell
            }
          }

          const Icon = getIcon(newNotification.type)

          toast({
            title: newNotification.title,
            description: newNotification.message,
            action: (
              <div className="flex items-center">
                <Icon className="h-4 w-4" />
              </div>
            ),
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) =>
            prev.map((notif) => (notif.id === updatedNotification.id ? updatedNotification : notif)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif)))
  }

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
    setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
  }

  const unreadCount = notifications.filter((notif) => !notif.is_read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
