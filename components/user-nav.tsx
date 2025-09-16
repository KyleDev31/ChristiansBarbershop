"use client"

import { UserCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/firebase"
import { useAdmin } from "@/hooks/useAdmin"
import { useBarber } from "@/hooks/useBarber"

export function UserNav() {
  const user = auth.currentUser
  const { isAdmin } = useAdmin()
  const { isBarber, loading } = useBarber()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors">
          <Avatar className="h-10 w-10 border-2 border-gray-200 hover:border-gray-300 transition-colors">
            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
            <AvatarFallback className="bg-gray-100 text-gray-600">
              <UserCircle2 className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* wait for hook to finish to avoid flicker/incorrect item */}
          {!loading && isBarber ? (
            <DropdownMenuItem asChild>
              <Link href="/barber/dashboard">Barber Panel</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
          )}

          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">Admin Panel</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => auth.signOut()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
