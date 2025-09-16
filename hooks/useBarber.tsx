import { useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export function useBarber() {
  const [loading, setLoading] = useState(true)
  const [isBarber, setIsBarber] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(true)
      if (!u) {
        setIsBarber(false)
        setRole(null)
        setLoading(false)
        return
      }
      try {
        const userRef = doc(db, "users", u.uid)
        const snap = await getDoc(userRef)
        const data = snap.exists() ? (snap.data() as any) : null
        const r = data?.role ?? null
        setRole(r)
        setIsBarber(r === "barber")
      } catch (err) {
        console.error("useBarber error:", err)
        setIsBarber(false)
        setRole(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return { user, isBarber, role, loading }
}