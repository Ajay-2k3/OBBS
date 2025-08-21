"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Heart, Menu, X, User, Settings, LogOut, Home, Calendar, Droplets, Users } from "lucide-react"
import { signOut } from "@/lib/actions"
import { cn } from "@/lib/utils"
import NotificationPanel from "@/components/real-time/notification-panel"

interface NavbarProps {
  user: {
    id: string
    email: string
    full_name: string
    role: string
    blood_type?: string
  }
  notifications?: number
}

const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Community", href: "/community", icon: Users },
  ]

  switch (role) {
    case "admin":
      return [
        ...baseNavigation,
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Blood Banks", href: "/admin/blood-banks", icon: Droplets },
        { name: "Audit Logs", href: "/admin/audit-logs", icon: Settings },
      ]
    case "blood_bank":
      return [
        ...baseNavigation,
        { name: "Inventory", href: "/blood-bank/inventory", icon: Droplets },
        { name: "Donations", href: "/blood-bank/donations", icon: Calendar },
        { name: "Requests", href: "/blood-bank/requests", icon: Heart },
        { name: "Staff", href: "/blood-bank/staff", icon: Users },
      ]
    case "donor":
      return [
        ...baseNavigation,
        { name: "Schedule Donation", href: "/donations/schedule", icon: Calendar },
        { name: "Donation History", href: "/donations/history", icon: Calendar },
      ]
    case "recipient":
      return [
        ...baseNavigation,
        { name: "New Request", href: "/blood-requests/new", icon: Heart },
        { name: "Request History", href: "/blood-requests/history", icon: Heart },
      ]
    default:
      return baseNavigation
  }
}

export default function Navbar({ user, notifications = 0 }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  const navigation = getNavigationForRole(user.role)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "donor":
        return "bg-green-100 text-green-800"
      case "recipient":
        return "bg-blue-100 text-blue-800"
      case "blood_bank":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-red-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">BloodBank</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-red-100 text-red-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <NotificationPanel />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={user.full_name} />
                    <AvatarFallback className="bg-red-100 text-red-700">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("text-xs", getRoleColor(user.role))}>
                        {user.role.replace("_", " ").toUpperCase()}
                      </Badge>
                      {user.blood_type && (
                        <Badge variant="outline" className="text-xs">
                          {user.blood_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut}>
                    <button type="submit" className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors",
                      isActive ? "bg-red-100 text-red-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
