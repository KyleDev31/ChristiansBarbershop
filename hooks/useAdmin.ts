import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()
        setIsAdmin(userData?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { isAdmin, loading }
} 