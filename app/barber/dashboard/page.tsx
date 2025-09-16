"use client"

import React, { useEffect, useState, useCallback } from "react"
import { format as formatDate } from "date-fns"
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
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header" // added import
import { toast } from "@/hooks/use-toast"
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
  availability?: { day: string; slots: string[] }[]
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function BarberDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile>({})
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Ensure availability is always treated as an array
  const availability = Array.isArray(profile.availability) ? profile.availability : []

  const [queue, setQueue] = useState<Appointment[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)

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

  // helper: check if an appointment belongs to the current auth user (barber)
  function isAppointmentForUser(data: any, user: User | null, profile: UserProfile) {
    if (!user || !data) return false

    const normalize = (s?: any) => (s ?? "").toString().trim().toLowerCase()

    // appointment barber values
    let apptBarberName = ""
    if (typeof data.barber === "string") {
      apptBarberName = normalize(data.barber)
    } else if (data.barber && typeof data.barber === "object") {
      apptBarberName = normalize(data.barber.name || data.barber.displayName || data.barber.fullName)
    }
    const apptBarberId = data.barberId != null ? String(data.barberId) : ""
    const apptBarberEmail = normalize(data.barberEmail || data.barber_email)

    // build candidate names/emails/ids from signed-in user + profile
    const candidates = new Set<string>()
    if (user.displayName) candidates.add(normalize(user.displayName))
    if (user.email) candidates.add(normalize(user.email))
    // add first-name variants
    if (user.displayName) candidates.add(normalize(user.displayName).split(" ")[0])

    if (profile) {
      if ((profile as any).fullName) candidates.add(normalize((profile as any).fullName))
      if ((profile as any).displayName) candidates.add(normalize((profile as any).displayName))
      if ((profile as any).fullName) candidates.add(normalize((profile as any).fullName).split(" ")[0])
      // allow numeric/alternate ids stored on profile (barberId, employeeId)
      if ((profile as any).barberId != null) candidates.add(String((profile as any).barberId))
      if ((profile as any).employeeId != null) candidates.add(String((profile as any).employeeId))
    }

    const userUid = String(user.uid)

    // direct matches
    if (apptBarberId && (apptBarberId === userUid || candidates.has(apptBarberId))) return true
    if (apptBarberEmail && candidates.has(apptBarberEmail)) return true
    if (apptBarberName && candidates.has(apptBarberName)) return true

    // tolerant matching: compare first names (e.g., "noel", "abel", "jayboy")
    const firstName = normalize((profile as any).fullName || user.displayName || user.email).split(" ")[0]
    if (apptBarberName && firstName && apptBarberName === firstName) return true

    // known nicknames fallback
    const nicknames = ["Noel", "Abel", "JayBoy"]
    if (apptBarberName && nicknames.includes(apptBarberName) && nicknames.includes(firstName)) return true

    return false
  }

  useEffect(() => {
    if (!user) return
    
    // Check if the logged-in user is JayBoy
    const isJayBoy = user.email === "jayboy@gmail.com"
    
    if (isJayBoy) {
      // Queue (queued + in-progress) - query for JayBoy's appointments
      const qQueue = query(
        collection(db, "appointments"),
        where("status", "in", ["queued", "in-progress"]),
        where("barber", "==", "JayBoy")
      )
      const unsubQueue = onSnapshot(qQueue, (snap) => {
        const items = snap.docs
          .map((d) => {
            const data: any = d.data()
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

             // All appointments for JayBoy
       const qAll = query(
         collection(db, "appointments"), 
         where("barber", "==", "JayBoy")
       )
             const unsubAll = onSnapshot(qAll, (snap) => {
         const items = snap.docs
           .map((d) => {
             const data: any = d.data()
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

        const past = sortedItems.filter((i) => i.status === "completed" || (i.scheduledAt && i.scheduledAt.toDate() < new Date()))
        const upcoming = sortedItems.filter((i) => !(i.status === "completed" || (i.scheduledAt && i.scheduledAt.toDate() < new Date())))
        setPastAppointments(past)
        setAppointments(upcoming)
      })

      return () => {
        unsubQueue()
        unsubAll()
      }
    } else {
      // For other barbers, use the original complex filtering logic
      const qQueue = query(
        collection(db, "appointments"),
        where("status", "in", ["queued", "in-progress"])
      )
      const unsubQueue = onSnapshot(qQueue, (snap) => {
        const items = snap.docs
          .map((d) => {
            const data: any = d.data()
            return {
              id: d.id,
              customerName: data.customerName || data.customer || "Customer",
              status: data.status || "queued",
              scheduledAt: data.scheduledAt,
              position: data.position,
              notes: data.notes,
              raw: data,
            }
          })
          .filter((item) => isAppointmentForUser(item.raw, user, profile))

        const sorted = items.sort((a, b) => {
          if (a.position != null && b.position != null) return a.position - b.position
          if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.toDate().getTime() - b.scheduledAt.toDate().getTime()
          return 0
        })
        setQueue(sorted)
      })

      const qAll = query(collection(db, "appointments"), orderBy("scheduledAt", "desc"))
      const unsubAll = onSnapshot(qAll, (snap) => {
        const items = snap.docs
          .map((d) => {
            const data: any = d.data()
            return {
              id: d.id,
              customerName: data.customerName || data.customer || "Customer",
              status: data.status || "queued",
              scheduledAt: data.scheduledAt,
              position: data.position,
              notes: data.notes,
              raw: data,
            }
          })
          .filter((item) => isAppointmentForUser(item.raw, user, profile))

        const past = items.filter((i) => i.status === "completed" || (i.scheduledAt && i.scheduledAt.toDate() < new Date()))
        const upcoming = items.filter((i) => !(i.status === "completed" || (i.scheduledAt && i.scheduledAt.toDate() < new Date())))
        setPastAppointments(past)
        setAppointments(
          upcoming.sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0
            return a.scheduledAt.toDate().getTime() - b.scheduledAt.toDate().getTime()
          })
        )
      })

      return () => {
        unsubQueue()
        unsubAll()
      }
    }
  }, [user, profile]) // include profile so filtering waits for loaded profile

  const saveProfile = useCallback(async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.fullName || "",
        photoURL: profile.photoURL || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
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

  const toggleDayAvailability = async (day: string) => {
    if (!user) return
    // coerce to array copy
    const avail = Array.isArray(profile.availability) ? [...profile.availability] : []
    const exists = avail.find((a) => a.day === day)
    if (exists) {
      const newAvail = avail.filter((a) => a.day !== day)
      setProfile((p) => ({ ...p, availability: newAvail }))
      await updateDoc(doc(db, "users", user.uid), { availability: newAvail })
    } else {
      const newAvail = [...avail, { day, slots: ["09:00", "10:00"] }]
      setProfile((p) => ({ ...p, availability: newAvail }))
      await updateDoc(doc(db, "users", user.uid), { availability: newAvail })
    }
  }

  const addSlot = async (day: string, slot: string) => {
    if (!user) return
    const avail = Array.isArray(profile.availability) ? [...profile.availability] : []
    const target = avail.find((a) => a.day === day)
    if (!target) return
    if (!target.slots.includes(slot)) {
      // mutate the local copy safely
      const updatedTarget = { ...target, slots: [...(target.slots || []), slot] }
      const newAvail = avail.map((a) => (a.day === day ? updatedTarget : a))
      setProfile((p) => ({ ...p, availability: newAvail }))
      setSavingAvailability(true)
      await updateDoc(doc(db, "users", user.uid), { availability: newAvail })
      setSavingAvailability(false)
    }
  }

  const removeSlot = async (day: string, slot: string) => {
    if (!user) return
    const avail = Array.isArray(profile.availability) ? [...profile.availability] : []
    const target = avail.find((a) => a.day === day)
    if (!target) return
    const updatedTarget = { ...target, slots: (target.slots || []).filter((s) => s !== slot) }
    const newAvail = avail.map((a) => (a.day === day ? updatedTarget : a))
    setProfile((p) => ({ ...p, availability: newAvail }))
    setSavingAvailability(true)
    await updateDoc(doc(db, "users", user.uid), { availability: newAvail })
    setSavingAvailability(false)
  }

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
    } catch (err) {
      console.error("Failed to mark completed", err)
    }
  }

  const markCancelled = async (id: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "appointments", id), { status: "cancelled", cancelledAt: Timestamp.fromDate(new Date()) })
    } catch (err) {
      console.error("Failed to cancel appointment", err)
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
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Barber's Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Profile card */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-4">
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
                  <div className="text-sm"><strong>Phone:</strong> {profile.phone || "—"}</div>
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

                <div className="mt-6 flex gap-2 items-center">
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                  <h3 className="text-lg font-medium mb-1">Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your barber profile and availability.</p>
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
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
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

            {/* Availability */}
            <div className="bg-white rounded-lg border p-6 shadow-sm mt-6">
              <h3 className="text-lg font-medium mb-3">Availability</h3>
              <p className="text-sm text-muted-foreground mb-4">Select days you are available and manage time slots.</p>

              <div className="grid grid-cols-4 gap-2">
                {DAYS.map((d) => {
                  const has = availability.some((a) => a.day === d)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDayAvailability(d)}
                      className={`py-2 rounded ${has ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-3">
              </div>
            </div>
          </div>

          {/* Right - Appointments & Queue */}
          <div className="col-span-2 space-y-6">
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
                    <div key={a.id} className="border rounded p-4 flex justify-between items-center">
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
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="text-sm mb-1">{a.status}</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => markCompleted(a.id)}
                            aria-label={`Mark appointment ${a.id} as done`}
                          >
                            Mark done
                          </Button>
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                            onClick={() => markCancelled(a.id)}
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
              <h3 className="text-lg font-medium mb-3">History</h3>
              {pastAppointments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No past appointments.</div>
              ) : (
                <ul className="space-y-2">
                  {pastAppointments.map((a) => (
                    <li key={a.id} className="border rounded-3xl p-3 flex justify-between items-center bg-white shadow-sm">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {a.raw?.email || a.raw?.customerEmail || a.raw?.emailAddress || (a.scheduledAt ? a.scheduledAt.toDate().toLocaleString() : "—")}
                        </div>
                        {/* show service availed below the email */}
                        <div className="text-xs text-muted-foreground mt-1">Service: {a.serviceName || a.raw?.serviceName || "—"}</div>
                      </div>
                      <div className={`text-sm px-2 py-2 rounded ${a.status === 'completed' ? 'bg-green-500 text-white' : a.status === 'cancelled' ? 'bg-red-500 text-white' : ''}`}>
                        {a.status}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
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