import Link from "next/link"
import { LogOut, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminHeader() {
  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-sm">
          <UserCircle className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
    </div>
  )
}
