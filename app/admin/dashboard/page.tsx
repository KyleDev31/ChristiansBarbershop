"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, Package, Users, Star, Check, X, Trash } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, getWeek, parseISO } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("week")
  const [appointments, setAppointments] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [appointmentsCount, setAppointmentsCount] = useState(0)
  const [customersCount, setCustomersCount] = useState(0)
  const [productsCount, setProductsCount] = useState(0)
  const [weeklyData, setWeeklyData] = useState<{ day: string, revenue: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ day: string, revenue: number }[]>([])
  const [feedbackOpen, setFeedbackOpen] = useState(true)

  // Feedback states
  interface Feedback {
    id: string
    user: string
    comment: string
    rating: number
    featured?: boolean
    category?: string
  }
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchAppointments = async () => {
      const today = format(new Date(), "MMMM d, yyyy")
      const appointmentsRef = collection(db, "appointments")
      const q = query(appointmentsRef, where("date", "==", today))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAppointments(data)
      setAppointmentsCount(data.length)
    }
    fetchAppointments()
  }, [])

  useEffect(() => {
    const fetchCustomers = async () => {
      const usersRef = collection(db, "users")
      const querySnapshot = await getDocs(usersRef)
      setCustomersCount(querySnapshot.size)
    }
    fetchCustomers()
  }, [])

  // Fetch revenue + sales data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
      const sales = snapshot.docs.map(doc => doc.data())
      const total = sales.reduce((sum, sale) => {
        const t = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
        return sum + (isNaN(t) ? 0 : t)
      }, 0)
      setTotalRevenue(total)

      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

      const weekData = days.map((day, idx) => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + idx)
        const total = sales.reduce((sum, sale) => {
          let saleDate = sale.date
          if (typeof saleDate === "string") saleDate = parseISO(saleDate)
          else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
          if (saleDate && isSameDay(saleDate, date)) {
            const t = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
            return sum + (isNaN(t) ? 0 : t)
          }
          return sum
        }, 0)
        return { day, revenue: total }
      })
      setWeeklyData(weekData)

      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const weekNumbers: number[] = []
      let d = new Date(monthStart)
      while (d <= monthEnd) {
        const w = getWeek(d, { weekStartsOn: 1 })
        if (!weekNumbers.includes(w)) weekNumbers.push(w)
        d.setDate(d.getDate() + 1)
      }
      const monthData = weekNumbers.map((w, idx) => {
        const label = `Week ${idx + 1}`
        const total = sales.reduce((sum, sale) => {
          let saleDate = sale.date
          if (typeof saleDate === "string") saleDate = parseISO(saleDate)
          else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
          if (saleDate && getWeek(saleDate, { weekStartsOn: 1 }) === w && saleDate >= monthStart && saleDate <= monthEnd) {
            const t = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
            return sum + (isNaN(t) ? 0 : t)
          }
          return sum
        }, 0)
        return { day: label, revenue: total }
      })
      setMonthlyData(monthData)
    })
    return () => unsubscribe()
  }, [])

  // Fetch feedbacks
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "feedback"), (snapshot) => {
      let feedbackList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[]
      // sort by rating instead of stars
      feedbackList = feedbackList.sort((a, b) => 
        sortOrder === "asc" ? a.rating - b.rating : b.rating - a.rating
      )
      setFeedbacks(feedbackList)
    })
    return () => unsubscribe()
  }, [sortOrder])

// Toggle featured — limit to 3 featured feedbacks
const toggleFeatured = async (id: string, current: boolean | undefined) => {
  const isCurrentlyFeatured = !!current
  // if trying to feature (currently false), enforce limit
  if (!isCurrentlyFeatured) {
    const featuredCount = feedbacks.filter((f) => f.featured).length
    if (featuredCount >= 3) {
      toast({ title: "Limit reached", description: "You can only feature up to 3 feedbacks.", variant: "destructive" })
      return
    }
  }

  try {
    const feedbackRef = doc(db, "feedback", id)
    await updateDoc(feedbackRef, { featured: !isCurrentlyFeatured })
  } catch (err) {
    console.error("Failed to update featured", err)
    toast({ title: "Update failed", description: "Could not update featured status.", variant: "destructive" })
  }
}

// compute featured count for UI disabling
const featuredCount = feedbacks.filter((f) => f.featured).length

// Initiate delete flow
const confirmDelete = (id: string) => {
  setDeletingId(id)
  setDeleteDialogOpen(true)
}

const handleConfirmDelete = async () => {
  if (!deletingId) return
  setDeleting(true)
  try {
    await deleteDoc(doc(db, "feedback", deletingId))
    toast({ title: "Deleted", description: "Feedback deleted successfully." })
    setDeleteDialogOpen(false)
    setDeletingId(null)
  } catch (err) {
    console.error("Failed to delete feedback", err)
    toast({ title: "Delete failed", description: "Could not delete feedback.", variant: "destructive" })
  } finally {
    setDeleting(false)
  }
}

  // group feedbacks by category for rendering
  const CATEGORY_ORDER = ["barbershop", "barber_service", "system_bug"]
  const CATEGORY_LABELS: Record<string, string> = {
    barbershop: "Barbershop",
    barber_service: "Barber's Service",
    system_bug: "System Bug",
  }

  const groupedFeedbacks = feedbacks.reduce((acc, fb) => {
    const cat = fb.category || "uncategorized"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(fb)
    return acc
  }, {} as Record<string, Feedback[]>)

  // gather any categories not in the preferred order so we can render them afterwards
  const otherCategories = Object.keys(groupedFeedbacks).filter((k) => !CATEGORY_ORDER.includes(k))

  return (
    <div className="container py-10 ml-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentsCount}</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersCount}</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <Tabs defaultValue="week" onValueChange={setDateRange}>
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              {dateRange === "week" ? "Daily revenue for this week" : "Weekly revenue for this month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="aspect-[4/3]"
            >
              <ReBarChart
                data={dateRange === "week" ? weeklyData : monthlyData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </ReBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Manage today's schedule and appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center p-3 border rounded-lg">
                  <div className="mr-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        appointment.status === "completed"
                          ? "bg-green-500"
                          : appointment.status === "cancelled"
                            ? "bg-red-500"
                            : appointment.status === "waiting"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{appointment.email}</p>
                    <p className="text-sm text-muted-foreground">{appointment.serviceName} {appointment.barber && `with ${appointment.barber}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.time}</p>
                    <p className="text-sm text-muted-foreground capitalize">{appointment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
        <Card>
  <CardHeader className="flex items-center justify-between">
    <CardTitle>Feedback Management</CardTitle>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="text-sm px-3 py-1 border rounded-md"
      >
        Sort: {sortOrder === "asc" ? "Ascending" : "Descending"}
      </button>
      <button
        onClick={() => setFeedbackOpen(!feedbackOpen)}
        className="text-sm px-3 py-1 border rounded-md bg-green-500 text-white"
      >
        {feedbackOpen ? "Hide" : "Show"}
      </button>
    </div>
  </CardHeader>

  {feedbackOpen && (
    <CardContent>
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = (groupedFeedbacks[cat] || [])
            .slice()
            .sort((a, b) => (sortOrder === "asc" ? a.rating - b.rating : b.rating - a.rating))
          if (items.length === 0) return null
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{CATEGORY_LABELS[cat]} ({items.length})</h4>
              </div>
              <div className="space-y-2">
                {items.map((fb) => (
                  <div key={fb.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="font-medium">{fb.user}</p>
                      <p className="text-sm text-muted-foreground">{fb.comment}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(fb.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{fb.featured ? "Featured" : "Not Featured"}</span>
                      <button
                        onClick={() => toggleFeatured(fb.id, fb.featured)}
                        className="p-1 rounded-md border hover:bg-muted"
                        title={fb.featured ? "Unfeature" : "Feature"}
                        disabled={!fb.featured && featuredCount >= 3}
                        aria-disabled={!fb.featured && featuredCount >= 3}
                      >
                        {fb.featured ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                      </button>
                      <button
                        onClick={() => confirmDelete(fb.id)}
                        className="p-1 rounded-md border hover:bg-red-50 text-red-600"
                        title="Delete feedback"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {otherCategories.map((cat) => {
          const items = (groupedFeedbacks[cat] || []).slice().sort((a, b) => (sortOrder === "asc" ? a.rating - b.rating : b.rating - a.rating))
          if (items.length === 0) return null
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{cat.charAt(0).toUpperCase() + cat.slice(1)} ({items.length})</h4>
              </div>
              <div className="space-y-2">
                {items.map((fb) => (
                  <div key={fb.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="font-medium">{fb.user}</p>
                      <p className="text-sm text-muted-foreground">{fb.comment}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(fb.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{fb.featured ? "Featured" : "Not Featured"}</span>
                      <button
                        onClick={() => toggleFeatured(fb.id, fb.featured)}
                        className="p-1 rounded-md border hover:bg-muted"
                        title={fb.featured ? "Unfeature" : "Feature"}
                        disabled={!fb.featured && featuredCount >= 3}
                        aria-disabled={!fb.featured && featuredCount >= 3}
                      >
                        {fb.featured ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                      </button>
                      <button
                        onClick={() => confirmDelete(fb.id)}
                        className="p-1 rounded-md border hover:bg-red-50 text-red-600"
                        title="Delete feedback"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Confirmation dialog for deletion */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete feedback?</DialogTitle>
              <DialogDescription>Are you sure you want to delete this feedback? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600" onClick={handleConfirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CardContent>
  )}
</Card>
    </div>
    
  )
}