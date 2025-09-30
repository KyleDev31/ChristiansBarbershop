import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { Toaster } from "@/components/ui/toaster"
import NotificationsListener from "@/components/notifications-listener"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Christian's Barbershop",
  description: "Appointment and Management System for Christian's Barbershop",
  icons: {
    icon: "/bg.jpg",
    shortcut: "/bg.jpg",
    apple: "/bg.jpg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className + " overflow-x-hidden mr-2 ml-2"}>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
          <NotificationsListener />
          <Toaster />
      </body>
    </html>
  )
}

