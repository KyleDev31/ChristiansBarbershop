"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "admin"))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          // No admin exists, redirect to register
          router.push("/admin/register")
        } else {
          // Admin exists, redirect to dashboard
          router.push("/admin/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin:", error)
        router.push("/admin/register")
      }
    }

    checkAdmin()
  }, [router])

  if (isChecking) {
    return (
      <div className="container py-10 flex justify-center">
        <div>Checking admin status...</div>
      </div>
    )
  }

  return null
} 