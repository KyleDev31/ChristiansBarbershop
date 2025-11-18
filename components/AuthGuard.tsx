"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // not signed in -> redirect to login
        router.replace("/login")
      } else {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [router])

  if (loading) return null // or a spinner component
  return <>{children}</>
}