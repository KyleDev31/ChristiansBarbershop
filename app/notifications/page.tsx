"use client"

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query, where, doc, updateDoc } from 'firebase/firestore'
import { Bell, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react'

type NotificationItem = {
  id: string
  title: string
  body: string
  type: 'upcoming' | 'completed' | 'cancelled' | 'reminder'
  createdAt?: any
  read?: boolean
  userId?: string | null
  targetEmail?: string | null
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = auth.currentUser
    if (!u) {
      setLoading(false)
      setItems([])
      return
    }

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const next: NotificationItem[] = []
      snap.forEach((d) => {
        const data: any = d.data()
        // filter for current user by id or email
        const isMine = (data.userId && data.userId === u.uid) || (data.targetEmail && data.targetEmail === u.email)
        if (!isMine) return
        next.push({ id: d.id, ...data })
      })
      setItems(next)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const markAllRead = async () => {
    const u = auth.currentUser
    if (!u) return
    const toMark = items.filter(it => !it.read)
    for (const it of toMark) {
      try { await updateDoc(doc(db, 'notifications', it.id), { read: true }) } catch {}
    }
  }

  const iconFor = (type: NotificationItem['type']) => {
    if (type === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (type === 'cancelled') return <XCircle className="h-5 w-5 text-red-600" />
    if (type === 'reminder') return <Calendar className="h-5 w-5 text-blue-600" />
    return <Clock className="h-5 w-5 text-amber-600" />
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Notifications</h1>
        <button onClick={markAllRead} className="text-sm border rounded px-3 py-1">Mark all as read</button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">No notifications yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-3 rounded border ${n.read ? 'bg-white' : 'bg-amber-50'}`}>
              <div className="mt-0.5">{iconFor(n.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{n.title}</div>
                <div className="text-sm text-muted-foreground break-words">{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


