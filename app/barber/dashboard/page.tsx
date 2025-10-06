"use client"

import React, { useEffect, useState, useCallback } from "react"
import { format as formatDate, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SiteHeader } from "@/components/site-header" // added import
import { toast } from "@/hooks/use-toast"
import { createNotification } from '@/lib/notifications'
import { useBarber } from '@/hooks/useBarber'

type Appointment = {
  id: string
  customerName: string
  status: string
  scheduledAt?: Timestamp
  position?: number
  notes?: string
  serviceName?: string
  time?: string
  date?: string
  // optional raw payload or alternate email fields coming from Firestore
  raw?: any
  email?: string
  customerEmail?: string
}

type UserProfile = {
  fullName?: string
  photoURL?: string
  bio?: string
  phone?: string
  skills?: string[]
}

export default function BarberDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile>({})
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [queue, setQueue] = useState<Appointment[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [historyOpen, setHistoryOpen] = useState(true)
  const [historySort, setHistorySort] = useState<'newest' | 'oldest'>('newest')

  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null)
  const [confirmAppointmentId, setConfirmAppointmentId] = useState<string | null>(null)
  // Earnings / salary card state
  const [earnRange, setEarnRange] = useState<'today' | 'week' | 'month'>('today')
  const [earnings, setEarnings] = useState({ totalService: 0, barberShare: 0, shopShare: 0, clients: 0 })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoadingProfile(true)
      if (u) {
        const userRef = doc(db, "users", u.uid)
        try {
          const snap = await getDoc(userRef)
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile)
          } else {
            await setDoc(
              userRef,
              {
                displayName: u.displayName || "",
                photoURL: u.photoURL || "",
                bio: "",
                phone: "",
                skills: [],
                availability: [],
              },
              { merge: true }
            )
            const initSnap = await getDoc(userRef)
            setProfile(initSnap.data() as UserProfile)
          }
        } catch (err) {
          console.error("Failed to load profile", err)
          setProfile({})
        } finally {
          setLoadingProfile(false)
        }
      } else {
        setProfile({})
        setLoadingProfile(false)
      }
    })
    return () => unsub()
  }, [])


  useEffect(() => {
    if (!user) return
    
    // Get barber name from profile or user display name
    let barberName = profile.fullName || user.displayName || user.email?.split('@')[0] || ''
    
    // Map email addresses to the correct barber names used in appointments
    const emailToBarberName: { [key: string]: string } = {
      'noel@gmail.com': 'Noel',
      'abel@gmail.com': 'Abel', 
      'jayboy@gmail.com': 'JayBoy'
    }
    
    // Use the mapped name if available, otherwise use the computed name
    if (user?.email && emailToBarberName[user.email]) {
      barberName = emailToBarberName[user.email]
    }
    
    // Debug logging
    console.log('Barber dashboard - Current user:', user?.email)
    console.log('Barber dashboard - Profile fullName:', profile.fullName)
    console.log('Barber dashboard - User displayName:', user.displayName)
    console.log('Barber dashboard - Computed barberName:', barberName)
    
    // Queue (queued + in-progress) - query for current barber's appointments
    const qQueue = query(
      collection(db, "appointments"),
      where("status", "in", ["queued", "in-progress"]),
      where("barber", "==", barberName)
    )
    const unsubQueue = onSnapshot(qQueue, (snap) => {
      console.log('Queue query - Found', snap.docs.length, 'appointments for barber:', barberName)
      const items = snap.docs
        .map((d) => {
          const data: any = d.data()
          console.log('Queue appointment data:', { id: d.id, barber: data.barber, customerName: data.customerName })
          return {
            id: d.id,
            customerName: data.customerName || data.customer || data.email || "Customer",
            status: data.status || "queued",
            scheduledAt: data.scheduledAt,
            position: data.position,
            notes: data.notes,
            serviceName: data.serviceName || "Service",
            time: data.time || "",
            date: data.date || "",
            raw: data,
          }
        })

      const sorted = items.sort((a, b) => {
        if (a.position != null && b.position != null) return a.position - b.position
        if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.toDate().getTime() - b.scheduledAt.toDate().getTime()
        return 0
      })
      setQueue(sorted)
    })

    // First, let's check what appointments exist for debugging
    const debugQuery = query(collection(db, "appointments"))
    const unsubDebug = onSnapshot(debugQuery, (snap) => {
      console.log('=== ALL APPOINTMENTS DEBUG ===')
      snap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`Appointment ${doc.id}:`, {
          barber: data.barber,
          customerName: data.customerName,
          status: data.status,
          date: data.date,
          time: data.time
        })
      })
      console.log('=== END DEBUG ===')
    })

    // All appointments for current barber
    const qAll = query(
      collection(db, "appointments"), 
      where("barber", "==", barberName)
    )
    const unsubAll = onSnapshot(qAll, (snap) => {
      console.log('All appointments query - Found', snap.docs.length, 'appointments for barber:', barberName)
      const items = snap.docs
        .map((d) => {
          const data: any = d.data()
          console.log('All appointments data:', { id: d.id, barber: data.barber, customerName: data.customerName, status: data.status })
          return {
            id: d.id,
            customerName: data.customerName || data.customer || data.email || "Customer",
            status: data.status || "queued",
            scheduledAt: data.scheduledAt,
            position: data.position,
            notes: data.notes,
            serviceName: data.serviceName || "Service",
            time: data.time || "",
            date: data.date || "",
            raw: data,
          }
        })

      // Sort all items by scheduledAt in descending order first
      const sortedItems = items.sort((a, b) => {
        if (!a.scheduledAt && !b.scheduledAt) return 0
        if (!a.scheduledAt) return 1
        if (!b.scheduledAt) return -1
        return b.scheduledAt.toDate().getTime() - a.scheduledAt.toDate().getTime()
      })

      // Debug: Log all items before filtering
      console.log('All items before filtering:', sortedItems.map(i => ({
        id: i.id,
        status: i.status,
        scheduledAt: i.scheduledAt,
        date: i.date,
        time: i.time,
        customerName: i.customerName
      })))

      // Filter appointments based on status and date
      const now = new Date()
      const past = sortedItems.filter((i) => {
        const isCompleted = i.status === "completed" || i.status === "cancelled"
        const isPastDate = i.scheduledAt && i.scheduledAt.toDate() < now
        const isPastByDateField = i.date && i.time && (() => {
          try {
            const appointmentDate = new Date(`${i.date} ${i.time}`)
            return appointmentDate < now
          } catch {
            return false
          }
        })()
        
        console.log(`Appointment ${i.id}:`, {
          status: i.status,
          isCompleted,
          isPastDate,
          isPastByDateField,
          scheduledAt: i.scheduledAt,
          date: i.date,
          time: i.time
        })
        
        return isCompleted || isPastDate || isPastByDateField
      })
      
      const upcoming = sortedItems.filter((i) => {
        const isCompleted = i.status === "completed" || i.status === "cancelled"
        const isPastDate = i.scheduledAt && i.scheduledAt.toDate() < now
        const isPastByDateField = i.date && i.time && (() => {
          try {
            const appointmentDate = new Date(`${i.date} ${i.time}`)
            return appointmentDate < now
          } catch {
            return false
          }
        })()
        
        // For now, let's show all non-completed appointments in upcoming
        // This will help us see if the issue is with date filtering
        const isUpcoming = !isCompleted
        
        console.log(`Upcoming check for ${i.id}:`, {
          status: i.status,
          isCompleted,
          isUpcoming,
          scheduledAt: i.scheduledAt,
          date: i.date,
          time: i.time
        })
        
        return isUpcoming
      })
      
      console.log('Filtered appointments - Past:', past.length, 'Upcoming:', upcoming.length)
      setPastAppointments(past)
      setAppointments(upcoming)
    })

    return () => {
      unsubQueue()
      unsubAll()
      unsubDebug()
    }
  }, [user, profile]) // include profile so filtering waits for loaded profile

  // Compute barber earnings for selected range (today / week / month)
  useEffect(() => {
    if (!user) return

    let barberName = profile.fullName || user.displayName || user.email?.split('@')[0] || ''
    const emailToBarberName: { [key: string]: string } = {
      'noel@gmail.com': 'Noel',
      'abel@gmail.com': 'Abel',
      'jayboy@gmail.com': 'JayBoy'
    }
    if (user?.email && emailToBarberName[user.email]) barberName = emailToBarberName[user.email]

    const fromTo = (() => {
      const now = new Date()
      if (earnRange === 'today') return { from: startOfDay(now), to: endOfDay(now) }
      if (earnRange === 'week') return { from: subDays(startOfDay(now), 7), to: endOfDay(now) }
      if (earnRange === 'month') return { from: startOfMonth(now), to: endOfMonth(now) }
      return { from: startOfDay(now), to: endOfDay(now) }
    })()

    let cancelled = false
    ;(async () => {
      try {
        const salesRef = collection(db, 'sales')
        const snap = await getDocs(salesRef)
        let totalService = 0
        let clientsSet = new Set<string>()
        snap.forEach(d => {
          if (cancelled) return
          const s: any = d.data()
          let saleDate: any = s.date
          if (typeof saleDate === 'string') saleDate = new Date(saleDate)
          else if (saleDate && typeof saleDate.toDate === 'function') saleDate = saleDate.toDate()
          if (!saleDate) return
          if (saleDate < fromTo.from || saleDate > fromTo.to) return

          const barber = (s.barber || s.barberName || 'Unknown').toString()
          if (barber !== barberName) return

          if (Array.isArray(s.items)) {
            let hasService = false
            let serviceSum = 0
            s.items.forEach((it: any) => {
              if (it.type === 'services' || it.type === 'service') {
                const price = typeof it.price === 'number' ? it.price : parseFloat(it.price)
                const qty = typeof it.quantity === 'number' ? it.quantity : parseInt(it.quantity) || 1
                serviceSum += (isNaN(price) ? 0 : price) * (isNaN(qty) ? 1 : qty)
                hasService = true
              }
            })
            if (hasService) {
              totalService += serviceSum
              clientsSet.add(d.id)
            }
          }
        })

        const barberShare = totalService * 0.5
        const shopShare = totalService - barberShare
        setEarnings({ totalService, barberShare, shopShare, clients: clientsSet.size })
      } catch (err) {
        console.error('Failed to compute earnings', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, profile, earnRange])

  const saveProfile = useCallback(async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.fullName || "",
        photoURL: profile.photoURL || "",
        bio: profile.bio || "",
        skills: profile.skills || [],
      })

      // show small success toast
      toast({ title: "Profile saved", description: "Your profile has been updated." })
    } catch (err) {
      console.error("Failed to save profile", err)
      // show error toast
      toast({ title: "Save failed", description: "Could not save profile. Please try again.", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }, [user, profile])

  const moveQueueItem = async (index: number, direction: "up" | "down") => {
    if (!user) return
    if (index < 0 || index >= queue.length) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= queue.length) return
    const a = queue[index]
    const b = queue[targetIndex]
    const batch = writeBatch(db)
    const refA = doc(db, "appointments", a.id)
    const refB = doc(db, "appointments", b.id)
    const posA = a.position ?? index
    const posB = b.position ?? targetIndex
    batch.update(refA, { position: posB })
    batch.update(refB, { position: posA })
    try {
      await batch.commit()
    } catch (err) {
      console.error("Failed to reorder queue", err)
    }
  }

  const markCompleted = async (id: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "appointments", id), { status: "completed", completedAt: Timestamp.fromDate(new Date()) })
      toast({ title: "Marked completed", description: "Appointment marked as completed." })
      try {
        const appt = appointments.find(a => a.id === id) || queue.find(a => a.id === id)
        await createNotification({
          userId: undefined,
          targetEmail: appt?.raw?.email || appt?.raw?.customerEmail || undefined,
          title: 'Appointment Completed',
          body: `Your appointment ${appt?.serviceName ? `for ${appt?.serviceName}` : ''} has been marked completed.`,
          type: 'completed',
          data: { appointmentId: id }
        })
      } catch {}
    } catch (err) {
      console.error("Failed to mark completed", err)
      toast({ title: "Mark failed", description: "Could not mark appointment as completed.", variant: "destructive" })
    }
  }

  const markCancelled = async (id: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "appointments", id), { status: "cancelled", cancelledAt: Timestamp.fromDate(new Date()) })
      toast({ title: "Appointment cancelled", description: "Appointment has been cancelled." })
      try {
        const appt = appointments.find(a => a.id === id) || queue.find(a => a.id === id)
        await createNotification({
          userId: undefined,
          targetEmail: appt?.raw?.email || appt?.raw?.customerEmail || undefined,
          title: 'Appointment Cancelled',
          body: `Your appointment ${appt?.serviceName ? `for ${appt?.serviceName}` : ''} has been cancelled.`,
          type: 'cancelled',
          data: { appointmentId: id }
        })
      } catch {}
    } catch (err) {
      console.error("Failed to cancel appointment", err)
      toast({ title: "Cancel failed", description: "Could not cancel appointment.", variant: "destructive" })
    }
  }

  const openConfirm = (action: 'complete' | 'cancel', id: string) => {
    setConfirmAction(action)
    setConfirmAppointmentId(id)
    setConfirmDialogOpen(true)
  }

  const handleConfirmYes = async () => {
    if (!confirmAction || !confirmAppointmentId) {
      setConfirmDialogOpen(false)
      return
    }
    try {
      if (confirmAction === 'complete') {
        await markCompleted(confirmAppointmentId)
      } else {
        await markCancelled(confirmAppointmentId)
      }
    } catch (err) {
      // markCompleted/markCancelled already show toasts; just log here
      console.error('Confirmation action failed', err)
    } finally {
      setConfirmDialogOpen(false)
      setConfirmAction(null)
      setConfirmAppointmentId(null)
    }
  }

  // use role-aware hook to determine access
  const { user: roleUser, isBarber, loading: roleLoading } = useBarber()

  if (roleLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded shadow p-6 text-center">Loading...</div>
      </div>
    )
  }

  if (!isBarber) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded shadow p-6 text-center">
          <h3 className="text-lg font-medium mb-4">Access restricted</h3>
          <p className="text-sm text-muted-foreground mb-4">You must be logged in with a barber account to view this page.</p>
          <Button onClick={() => (location.href = "/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <SiteHeader /> {/* navigation added at top of page */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-bold mb-6">Barber's Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Profile card */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img
                  src={profile.photoURL || "/placeholder.svg"}
                  alt={profile.fullName || "Barber"}
                  className="w-28 h-28 rounded-full object-cover border"
                />
                <div>
                  <div className="text-xl font-semibold">{profile.fullName || "Your name"}</div>
                  <div className="text-sm text-muted-foreground">Barber</div>
                  <div className="text-sm text-muted-foreground mt-2">{profile.bio || "Add a short bio about yourself."}</div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="text-sm text-muted-foreground">Contact</div>
                <div className="mt-2">
                  <div className="text-sm"><strong>Email:</strong> {roleUser?.email ?? user?.email ?? '—'}</div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Skills</div>
                    <div className="mt-2">{(profile.skills || []).length ? (profile.skills || []).join(", ") : "No skills added"}</div>
                  </div>
                  <div>
                  </div>
                </div>
              </div>

                <div className="mt-6 flex flex-wrap gap-2 items-center">
                <Button
                  onClick={() => (document.getElementById("profileDialog") as any)?.showModal()}
                  disabled={savingProfile}
                >
                  Edit profile
                </Button>
                <Button variant="ghost" onClick={() => auth.signOut()}>
                  Sign out
                </Button>
                </div>

                {/* Modal dialog for editing profile (uses native <dialog> to avoid adding hooks) */}
                <dialog
                id="profileDialog"
                className="rounded-lg p-6 w-full max-w-2xl"
                style={{
                  border: "none",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                }}
                >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div>
                  <h3 className="text-lg font-medium mb-1">Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your barber profile.</p>
                  </div>
                  <div>
                  <button
                    className="text-sm px-3 py-1 rounded bg-gray-100"
                    onClick={() => (document.getElementById("profileDialog") as any)?.close()}
                  >
                    Close
                  </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                  <label className="block text-sm font-medium mb-1">Display name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={profile.fullName || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium mb-1">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !user) return
                      try {
                      const form = new FormData()
                      form.append("file", file)
                      form.append("folder", "barbers")
                      const res = await fetch("/api/upload-cloudinary", { method: "POST", body: form })
                      if (!res.ok) throw new Error("Upload failed")
                      const data = await res.json()
                      setProfile((p) => ({ ...p, photoURL: data.url }))
                      await updateDoc(doc(db, "users", user.uid), { photoURL: data.url })
                      } catch (err) {
                      console.error("Failed to upload avatar", err)
                      }
                    }}
                    />
                    {profile.photoURL && (
                    <img src={profile.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover border" />
                    )}
                  </div>
                  </div>

                  

                  <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={profile.bio || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={(profile.skills || []).join(", ")}
                    onChange={(e) =>
                    setProfile((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
                    }
                  />
                  </div>

                  <div className="flex gap-2 justify-end">
                  <Button
                    onClick={async () => {
                    await saveProfile()
                    ;(document.getElementById("profileDialog") as any)?.close()
                    }}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => (document.getElementById("profileDialog") as any)?.close()}
                  >
                    Cancel
                  </Button>
                  </div>
                </div>
                </dialog>
              </div>

            {/* Availability section removed */}
          </div>

          {/* Right - Earnings, Appointments & Queue */}
          <div className="col-span-2 space-y-6">
            {/* Earnings / Salary Card */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold">Earnings</h2>
                  <p className="text-sm text-muted-foreground">Your service earnings and share</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1 rounded ${earnRange === 'today' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                    onClick={() => setEarnRange('today')}
                  >Today</button>
                  <button
                    className={`px-3 py-1 rounded ${earnRange === 'week' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                    onClick={() => setEarnRange('week')}
                  >Week</button>
                  <button
                    className={`px-3 py-1 rounded ${earnRange === 'month' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                    onClick={() => setEarnRange('month')}
                  >Month</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-muted-foreground">Service Total</div>
                  <div className="text-lg font-bold">₱{earnings.totalService.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-muted-foreground">Your Share</div>
                  <div className="text-lg font-bold">₱{earnings.barberShare.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-muted-foreground">Clients</div>
                  <div className="text-lg font-bold">{earnings.clients}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">My Appointments</h2>
              <p className="text-sm text-muted-foreground mb-4">Upcoming and past appointments are shown here.</p>

              <div className="mb-4">
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded bg-primary text-white">Upcoming</button>
                </div>
              </div>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No upcoming appointments.</div>
                ) : (
                  appointments.map((a) => (
                    <div key={a.id} className="border rounded p-4 flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div>
                        <div className="font-medium">{a.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {a.serviceName && <span className="font-medium">{a.serviceName}</span>}
                          {a.time && <span> • {a.time}</span>}
                          {a.date && <span> • {a.date}</span>}
                          {a.scheduledAt && <span> • {formatDate(a.scheduledAt.toDate(), 'PPP p')}</span>}
                        </div>
                        {a.notes && <div className="text-xs text-muted-foreground mt-1">Notes: {a.notes}</div>}
                      </div>
                      <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                        <div className="text-sm mb-1">{a.status}</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => openConfirm('complete', a.id)}
                            aria-label={`Mark appointment ${a.id} as done`}
                          >
                            Mark done
                          </Button>
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                            onClick={() => openConfirm('cancel', a.id)}
                            aria-label={`Cancel appointment ${a.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>


            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">History</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Sort</label>
                  <select
                    value={historySort}
                    onChange={(e) => setHistorySort(e.target.value as 'newest' | 'oldest')}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <button
                    className="text-sm px-2 py-1 rounded bg-gray-100"
                    onClick={() => setHistoryOpen((s) => !s)}
                    aria-expanded={historyOpen}
                  >
                    {historyOpen ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              {pastAppointments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No past appointments.</div>
              ) : (
                historyOpen && (
                  <ul className="space-y-2">
                    {([...(pastAppointments || [])]
                      .sort((a, b) => {
                        const da = getCompletedDate(a)?.getTime() || 0
                        const db = getCompletedDate(b)?.getTime() || 0
                        return historySort === 'newest' ? db - da : da - db
                      })
                      .map((a) => {
                        const cd = getCompletedDate(a)
                        return (
                          <li key={a.id} className="border rounded-3xl p-3 flex flex-col sm:flex-row sm:justify-between gap-2 bg-white shadow-sm">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                {a.raw?.email || a.raw?.customerEmail || a.raw?.emailAddress || (cd ? formatDate(cd, 'PPP p') : '—')}
                              </div>
                              {/* show service availed below the email */}
                              <div className="text-xs text-muted-foreground mt-1">Service: {a.serviceName || a.raw?.serviceName || '—'}</div>
                              <div className="text-xs text-muted-foreground mt-1">Completed: {cd ? formatDate(cd, 'PPP p') : '—'}</div>
                            </div>
                            <div className={`text-sm px-2 py-2 rounded ${a.status === 'completed' ? 'bg-green-500 text-white' : a.status === 'cancelled' ? 'bg-red-500 text-white' : ''}`}>
                              {a.status}
                            </div>
                          </li>
                        )
                      }))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>Do you want to confirm this action?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>No</Button>
            <Button variant="destructive" onClick={handleConfirmYes}>Yes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* helper: getCompletedDate - normalize various completedAt representations to a Date */
function getCompletedDate(a: Appointment): Date | null {
  if (!a) return null

  // Try explicit completedAt fields on the appointment or raw payload
  const candidates = [
    (a as any).completedAt,
    a.raw?.completedAt,
    a.raw?.completed_at,
    a.raw?.completedAtTimestamp,
    a.raw?.completedAtDate,
  ]

  for (const c of candidates) {
    if (!c) continue
    // Firestore Timestamp
    if (typeof c === "object" && typeof (c as any).toDate === "function") {
      try {
        return (c as any).toDate()
      } catch (e) {
        continue
      }
    }

    // numeric (epoch ms) or string
    if (typeof c === "number") {
      const d = new Date(c)
      if (!isNaN(d.getTime())) return d
    }
    if (typeof c === "string") {
      const d = new Date(c)
      if (!isNaN(d.getTime())) return d
    }
  }

  // Fallback: if status is completed, use scheduledAt if available
  if (a.status === "completed" && a.scheduledAt && typeof a.scheduledAt.toDate === "function") {
    return a.scheduledAt.toDate()
  }

  return null
}

/* helper: add slot input */
function AddSlotInput({ day, onAdd, disabled }: { day: string; onAdd: (s: string) => void; disabled?: boolean }) {
  const [val, setVal] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!val) return
        onAdd(val)
        setVal("")
      }}
      className="flex items-center gap-2"
    >
      <input
        className="px-2 py-1 border rounded w-24"
        placeholder="HH:MM"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={disabled}
      />
      <button className="px-2 py-1 bg-blue-600 text-white rounded" disabled={disabled || !val}>
        Add
      </button>
    </form>
  )
}