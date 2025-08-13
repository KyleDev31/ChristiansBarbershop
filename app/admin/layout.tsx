"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Calendar,
  ClipboardList,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminHeader } from "@/components/admin-header"
import { AdminGuard } from "@/components/admin-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: "Appointments",
      href: "/admin/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Services",
      href: "/admin/services",
      icon: <Scissors className="h-5 w-5" />,
    },
    {
      title: "Point of Sale",
      href: "/admin/pos",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ]

  return (
    <AdminGuard>
    <div className="flex min-h-screen bg-muted/20 mr-8 ml-4">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="w-full">
            <AdminHeader />
          </div>

          <div className="flex-1 overflow-auto py-8">
            <nav className="px-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href ? "bg-yellow-900 text-primary-foreground" : "hover:bg-yellow-300",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/">
                <LogOut className="h-4 w-4 mr-2" />
                Back to Site
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">{children}</div>
      </div>
    </div>
    </AdminGuard>
  )
}
