"use client"

import { useEffect, useState } from "react"
import { Bell, UserCircle2 } from "lucide-react"
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
import { auth, db } from "@/lib/firebase"
import { useAdmin } from "@/hooks/useAdmin"
import { useBarber } from "@/hooks/useBarber"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"

type Notif = { id: string; title: string; body: string; type: 'upcoming' | 'completed' | 'cancelled' | 'reminder'; read?: boolean; createdAt?: any; userId?: string | null; targetEmail?: string | null }

export function UserNav() {
  const [user] = useState(() => auth.currentUser)
  const { isAdmin } = useAdmin()
  const { isBarber, loading } = useBarber()
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list: Notif[] = []
      snap.forEach((d) => {
        const data: any = d.data()
        const mine = (data.userId && data.userId === user.uid) || (data.targetEmail && data.targetEmail === user.email)
        if (!mine) return
        list.push({ id: d.id, ...data })
      })
      setNotifs(list)
    })
    return () => unsub()
  }, [user])

  const unreadCount = notifs.filter(n => !n.read).length
  const markAllRead = async () => {
    const toMark = notifs.filter(n => !n.read)
    for (const it of toMark) {
      try { await updateDoc(doc(db, 'notifications', it.id), { read: true }) } catch {}
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Notifications popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-medium">Notifications</div>
            <button className="text-xs underline" onClick={markAllRead}>Mark all as read</button>
          </div>
          <div className="max-h-80 overflow-auto">
            {notifs.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notifications</div>
            ) : (
              <ul className="divide-y">
                {notifs.map(n => (
                  <li key={n.id} className={`p-3 text-sm ${n.read ? '' : 'bg-amber-50'}`}>
                    <div className="font-medium truncate">{n.title}</div>
                    <div className="text-muted-foreground break-words">{n.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

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
    </div>
  )
}
