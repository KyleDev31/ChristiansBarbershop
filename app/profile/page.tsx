"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { User, Calendar, Clock, Scissors, MapPin, Mail, Edit, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { collection, doc, getDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { onAuthStateChanged, getAuth } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
// switched profile image upload to local API instead of Firebase Storage

interface Appointment {
  id: string
  barber: string
  barberId: number
  date: string
  email: string
  estimatedWait: number
  price: number
  serviceName: string
  status: 'waiting' | 'completed' | 'cancelled'
  style: string | null
  time: string
  timestamp: string
}

export default function ProfilePage() {
  const [authSession, setAuthSession] = useState<{ user: { email: string | null, uid: string | null } } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthSession({ user: { email: user.email, uid: user.uid } })
      } else {
        setAuthSession(null)
      }
    })
  }, [])

  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointment")

  const [activeTab, setActiveTab] = useState("appointments")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const userEmail = authSession?.user?.email

  const [userData, setUserData] = useState<{
    fullName: string
    email: string
    createdAt: string
    preferredBarber: string
    favoriteService: string
    profileImage: string
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) return
      setLoadingUser(true)
      try {
        const userUid = authSession?.user?.uid
        if (!userUid) return
        const docRef = doc(db, "users", userUid)
        const docSnap = await getDoc(docRef)
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", userEmail))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data()
          setUserData({
            fullName: userDoc.fullName || "",
            email: userDoc.email || "",
            createdAt: userDoc.createdAt
              ? new Date(userDoc.createdAt.seconds ? userDoc.createdAt.seconds * 1000 : userDoc.createdAt).toLocaleString("default", { month: "long", year: "numeric" })
              : "",
            preferredBarber: userDoc.preferredBarber || "",
            favoriteService: userDoc.favoriteService || "",
            profileImage: userDoc.profileImage || "/placeholder.svg?height=200&width=200",
          })
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUserData()
  }, [userEmail])

  // Fetch appointments
  useEffect(() => {
    // Use onSnapshot so the UI updates in real-time when barbers mark appointments done
    if (!userEmail) return
    setIsLoadingAppointments(true)
    const appointmentsRef = collection(db, "appointments")
    const q = query(appointmentsRef, where("email", "==", userEmail))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Appointment[]

      // detect transitions from waiting -> completed
      const prev = prevStatuses.current || {}
      const becameCompleted = appointmentsData.find(a => prev[a.id] === 'waiting' && a.status === 'completed')

      // update the prevStatuses map
      const updatedMap: Record<string, Appointment['status']> = {}
      appointmentsData.forEach(a => { updatedMap[a.id] = a.status })
      prevStatuses.current = updatedMap

      setAppointments(appointmentsData)
      setIsLoadingAppointments(false)

      if (becameCompleted) {
        // switch user to History tab so they can rebook
        setActiveTab('history')
      }
    }, (err) => {
      console.error('Failed to listen for appointments:', err)
      setIsLoadingAppointments(false)
    })

    return () => unsubscribe()
  }, [userEmail])

  // track previous statuses to detect transitions
  const prevStatuses = useRef<Record<string, Appointment['status']>>({})

  // Filter appointments
  const upcomingAppointments = appointments.filter(apt => apt.status === 'waiting')
  const pastAppointments = appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled')

  // Handle QR code dialog
  useEffect(() => {
    if (appointmentId) {
      const appointment = appointments.find((apt) => apt.id === appointmentId)
      if (appointment) {
        setSelectedAppointment(appointment)
        setQrDialogOpen(true)
      }
    }
  }, [appointmentId, appointments])

  // Generate QR code URL for an appointment
  const generateQrCodeUrl = (appointmentId: string) => {
    // In a real app, this would be a proper QR code generation
    // For now, we'll use a placeholder
    return `/placeholder.svg?height=300&width=300&text=${appointmentId}`
  }

  // Handle appointment selection for QR code
  const handleShowQrCode = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setQrDialogOpen(true)
  }

  const getStatusBadgeStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-primary/10 text-primary'
      case 'completed':
        return 'bg-muted text-muted-foreground'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Cancel appointment handler
  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToCancel(appointment)
    setShowCancelDialog(true)
  }

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return
    try {
      await deleteDoc(doc(db, "appointments", appointmentToCancel.id))
      // Optimistically update UI
      setAppointments((prev) => prev.filter(appt => appt.id !== appointmentToCancel.id))
      setShowCancelDialog(false)
      setAppointmentToCancel(null)
      toast({ title: "Appointment cancelled", description: "Your appointment has been cancelled." })
    } catch (err) {
      console.error("Failed to cancel appointment", err)
      toast({ title: "Cancel failed", description: "Could not cancel appointment. Please try again.", variant: "destructive" })
    }
  }

  // Open edit dialog and prefill fields
  const openEditDialog = () => {
    setEditName(userData?.fullName || "");
    setEditProfileImage(userData?.profileImage || "");
    setShowEditDialog(true);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!authSession?.user?.uid) return;
    await updateDoc(doc(db, "users", authSession.user.uid), {
      fullName: editName,
      profileImage: editProfileImage || "",
    });
    setUserData(prev => prev ? { ...prev, fullName: editName, profileImage: editProfileImage ? editProfileImage : "", email: prev.email, createdAt: prev.createdAt, preferredBarber: prev.preferredBarber, favoriteService: prev.favoriteService } : prev);
    setShowEditDialog(false);
  };

  return (
    <div className="container py-10 ml-4">
        <div className="sticky top-0 z-50 bg-white bg-opacity-30 backdrop-blur-md rounded-lg mb-6">
              <SiteHeader />
        </div>
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
     <Card className="lg:col-span-1">
  <CardHeader className="pb-2">
    <div className="flex justify-between items-start">
      <CardTitle>Personal Information</CardTitle>
      <Button variant="ghost" size="icon" onClick={openEditDialog}>
        <Edit className="h-4 w-4" />
        <span className="sr-only">Edit profile</span>
      </Button>
    </div>
  </CardHeader>
  <CardContent className="pt-4">
    {loadingUser ? (
      <div className="flex justify-center items-center h-32">Loading...</div>
    ) : userData ? (
      <>
        {/* Validation Check */}
        {(!userData.fullName) ? (
          <div className="text-center text-red-500 font-medium">
            ⚠ Please update your profile with a valid full name.
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                <Image
                  src={userData.profileImage}
                  alt={userData.fullName}
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-semibold">{userData.fullName}</h2>
              <p className="text-muted-foreground">Member since {userData.createdAt}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{userData.email}</p>
                </div>
              </div>
              
            </div>
          </>
        )}
      </>
    ) : (
      <div className="text-center text-muted-foreground">No user data found.</div>
    )}
  </CardContent>
  <CardFooter>
    <Button asChild variant="outline" className="w-full">
      <Link href="/recommendations">Get Haircut Recommendations</Link>
    </Button>
  </CardFooter>
</Card>
        {/* Appointments and History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
            <CardDescription>View and manage your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="appointments" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="appointments">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="appointments">
                {isLoadingAppointments ? (
                  <div className="text-center py-8">Loading appointments...</div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <Card key={appointment.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-4 md:w-3/4">
                            <div className="flex justify-between mb-2">
                              <h3 className="font-medium">{appointment.serviceName}</h3>
                              <span className={`text-sm px-2 py-1 rounded-full ${getStatusBadgeStyle(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.barber}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-muted/30 p-4 flex flex-col justify-center items-center md:w-1/4 gap-2">
                            <p className="font-bold text-lg mb-2">₱{appointment.price}</p>
                            {appointment.status === 'waiting' && (
                              <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(appointment)}>
                                Cancel Appointment
                            </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You don't have any upcoming appointments</p>
                    <Button asChild>
                      <Link href="/booking">Book an Appointment</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {isLoadingAppointments ? (
                  <div className="text-center py-8">Loading appointments...</div>
                ) : pastAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pastAppointments.map((appointment) => (
                      <Card key={appointment.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-4 md:w-3/4">
                            <div className="flex justify-between mb-2">
                              <h3 className="font-medium">{appointment.serviceName}</h3>
                              <span className={`text-sm px-2 py-1 rounded-full ${getStatusBadgeStyle(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.barber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>Main Branch</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-muted/30 p-4 flex flex-col justify-center items-center md:w-1/4">
                            <p className="font-bold text-lg mb-2">₱{appointment.price}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You don't have any appointment history yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment QR Code</DialogTitle>
            <DialogDescription>Show this QR code at the barbershop for quick check-in</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <Image
                  src={generateQrCodeUrl(selectedAppointment.id) || "/placeholder.svg"}
                  alt="Appointment QR Code"
                  width={200}
                  height={200}
                />
              </div>

              <div className="w-full space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Appointment ID</span>
                  <span className="font-medium">{selectedAppointment.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedAppointment.time}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Barber</span>
                  <span className="font-medium">{selectedAppointment.barber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">₱{selectedAppointment.price}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, keep appointment
            </Button>
            <Button variant="destructive" onClick={confirmCancelAppointment}>
              Yes, cancel it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Profile Image</label>
              <div className="flex items-center gap-4 mt-2">
                <Image
                  src={editProfileImage || "/placeholder.svg?height=200&width=200"}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !authSession?.user?.uid) return
                    setUploading(true)
                    setUploadError(null)
                    try {
                      const form = new FormData()
                      form.append("file", file)
                      form.append("folder", "profiles")
                      const res = await fetch("/api/upload-cloudinary", { method: "POST", body: form })
                      if (!res.ok) throw new Error("Upload failed")
                      const data = await res.json()
                      setEditProfileImage(data.url)
                    } catch (err) {
                      setUploadError("Failed to upload image.")
                    } finally {
                      setUploading(false)
                    }
                  }}
                  disabled={uploading}
                />
                {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                {uploadError && <span className="text-xs text-red-500">{uploadError}</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={uploading}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
