"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, Package, Scissors, ShoppingBag, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, startOfWeek, endOfWeek, isSameDay, isSameWeek, startOfMonth, endOfMonth, getWeek, parseISO } from "date-fns"

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("week")
  const [appointments, setAppointments] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [appointmentsCount, setAppointmentsCount] = useState(0) // fallback/mock
  const [customersCount, setCustomersCount] = useState(0) // fallback/mock
  const [productsCount, setProductsCount] = useState(0) // fallback/mock
  const [weeklyData, setWeeklyData] = useState<{ day: string, revenue: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ day: string, revenue: number }[]>([])

  // Mock data for inventory
  const inventory = [
    { id: 1, name: "Hair Wax", stock: 15, status: "In Stock" },
    { id: 2, name: "Beard Oil", stock: 8, status: "In Stock" },
    { id: 3, name: "Shampoo", stock: 3, status: "Low Stock" },
    { id: 4, name: "Hair Spray", stock: 12, status: "In Stock" },
    { id: 5, name: "Razor Blades", stock: 2, status: "Low Stock" },
  ]

  useEffect(() => {
    const fetchAppointments = async () => {
      const today = format(new Date(), "MMMM d, yyyy")
      const appointmentsRef = collection(db, "appointments")
      const q = query(
        appointmentsRef,
        where("date", "==", today)
      )
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

  // Fetch total revenue from Firestore sales collection
  useEffect(() => {
    // Fetch and group sales for bar chart
    const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
      const sales = snapshot.docs.map(doc => doc.data())
      // --- Calculate Total Revenue ---
      const total = sales.reduce((sum, sale) => {
        const t = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
        return sum + (isNaN(t) ? 0 : t)
      }, 0)
      setTotalRevenue(total)
      // --- WEEKLY DATA ---
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
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
      // --- MONTHLY DATA ---
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      // Get week numbers in the month
      const weekNumbers: number[] = []
      let d = new Date(monthStart)
      while (d <= monthEnd) {
        const w = getWeek(d, { weekStartsOn: 1 })
        if (!weekNumbers.includes(w)) weekNumbers.push(w)
        d.setDate(d.getDate() + 1)
      }
      const monthData = weekNumbers.map((w, idx) => {
        // Get the label for the week
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

  return (
    <div className="container py-10 ml-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentsCount}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersCount}</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
            <p className="text-xs text-muted-foreground">2 items need reordering</p>
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
    </div>
  )
}