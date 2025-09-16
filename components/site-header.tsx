"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <div className="container flex h-16 items-center justify-between">
      <div className="flex items-center">
        <MobileNav />
        <MainNav />
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {/* Only show name if user is logged in */}
        {user && (
          <span className="text-sm font-semibold leading-none text-gray-700 hidden sm:block px-3 py-1 bg-gray-50 rounded-full border">
            {user.displayName || user.email || "User"}
          </span>
        )}
        {!user ? (
          <div className="hidden md:flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        ) : (
          <UserNav /> 
        )}
      </div>
    </div>
  )
}
