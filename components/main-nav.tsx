"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Scissors, Menu, X } from "lucide-react"
import { useState } from "react"

export function MainNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="mr-4 flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <Scissors className="h-6 w-6 mr-2 ml-4" />
        <span className="font-bold">Christian's Barbershop</span>
      </Link>
      <nav
        className={cn(
          "flex-col lg:flex-row lg:flex items-center gap-6 text-sm ml-6",
          isMobileMenuOpen ? "flex" : "hidden lg:flex"
        )}
      >
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Home
        </Link>
        <Link
          href="/services"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/services" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Services
        </Link>
        <Link
          href="/recommendations"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/recommendations" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Recommendations
        </Link>
        <Link
          href="/booking"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/book" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Book
        </Link>
        <Link
          href="/queue"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/queue" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Queue Status
        </Link>
        <Link
          href="/feedback"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/feedback" ? "text-brown-500 font-medium" : "text-black",
          )}
        >
          Feedback
        </Link>
      </nav>
    </div>
  )
}
