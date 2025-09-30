"use client"

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query, where, updateDoc, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function NotificationsListener() {
  const { toast } = useToast()

  useEffect(() => {
    let unsubAuth: any
    let unsubNotif: any

    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubNotif) {
        unsubNotif()
        unsubNotif = null
      }
      if (!u) return

      // Listen for recent notifications, filter client-side for user and unread
      const q2 = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      )

      unsubNotif = onSnapshot(q2, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type !== 'added') return
          const data: any = change.doc.data()
          const targets = new Set<string>([u.uid, u.email || ''])
          if (data.userId && !targets.has(String(data.userId))) return
          if (data.targetEmail && !targets.has(String(data.targetEmail))) return
          if (data.read) return

          toast({ title: data.title, description: data.body })
          try {
            await updateDoc(doc(db, 'notifications', change.doc.id), { read: true })
          } catch {}
        })
      })
    })

    return () => {
      if (unsubNotif) unsubNotif()
      if (unsubAuth) unsubAuth()
    }
  }, [toast])

  return null
}


