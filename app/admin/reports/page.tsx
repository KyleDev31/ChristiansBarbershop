"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, Download, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { parseISO, isAfter, isBefore, isEqual } from "date-fns"


export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [dateRange, setDateRange] = useState("week")
  const [fromDate, setFromDate] = useState(subDays(new Date(), 7))
  const [toDate, setToDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [rangePopoverOpen, setRangePopoverOpen] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [serviceRevenue, setServiceRevenue] = useState(0)
  const [productRevenue, setProductRevenue] = useState(0)
  const [barChartData, setBarChartData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [totalAvailedServices, setTotalAvailedServices] = useState(0)
  const [serviceData, setServiceData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [appointmentData, setAppointmentData] = useState<any[]>([])
  const [barberData, setBarberData] = useState<any[]>([])
  const [productSales, setProductSales] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [completedAppointments, setCompletedAppointments] = useState(0)
  const [cancelledAppointments, setCancelledAppointments] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    // Services popularity and totals by service name
    const fetchServiceAggregates = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      const nameToCount: Record<string, number> = {}
      let totalServices = 0
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              if (item.type === "services" || item.type === "service") {
                const qty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity)
                const count = isNaN(qty) ? 1 : qty
                const name = item.name || "Service"
                nameToCount[name] = (nameToCount[name] || 0) + count
                totalServices += count
              }
            })
          }
        }
      })
      setTotalAvailedServices(totalServices)
      const list = Object.entries(nameToCount).map(([name, value]) => ({ name, value }))
      list.sort((a, b) => b.value - a.value)
      setServiceData(list)
    }
    fetchServiceAggregates()
  }, [fromDate, toDate])

  useEffect(() => {
    // Product totals and breakdown by product name
    const fetchProductAggregates = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      const productToUnits: Record<string, number> = {}
      let totalProductsRevenue = 0
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              if (item.type === "products" || item.type === "product") {
                const price = typeof item.price === "number" ? item.price : parseFloat(item.price)
                const qty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity)
                const units = isNaN(qty) ? 1 : qty
                totalProductsRevenue += (isNaN(price) ? 0 : price) * units
                const name = item.name || "Product"
                productToUnits[name] = (productToUnits[name] || 0) + units
              }
            })
          }
        }
      })
      setProductSales(totalProductsRevenue)
      const list = Object.entries(productToUnits).map(([name, value]) => ({ name, value }))
      list.sort((a, b) => b.value - a.value)
      setProductData(list)
    }
    fetchProductAggregates()
  }, [fromDate, toDate])

  useEffect(() => {
    // Appointments stats and daily distribution
    const fetchAppointments = async () => {
      const apptSnap = await getDocs(collection(db, "appointments"))
      let total = 0, completed = 0, cancelled = 0
      const dayMap: Record<string, { date: string; completed: number; cancelled: number }> = {}
      apptSnap.forEach(d => {
        const a: any = d.data()
        let when: any = a.scheduledAt || a.completedAt || a.createdAt || a.date
        if (typeof when === "string") when = parseISO(when)
        else if (when && when.toDate) when = when.toDate()
        if (
          when &&
          (isEqual(when, fromDate) || isEqual(when, toDate) || (isAfter(when, fromDate) && isBefore(when, toDate)))
        ) {
          total += 1
          const dateKey = when.toLocaleDateString()
          if (!dayMap[dateKey]) dayMap[dateKey] = { date: dateKey, completed: 0, cancelled: 0 }
          if ((a.status || "").toLowerCase() === "completed") {
            completed += 1
            dayMap[dateKey].completed += 1
          } else if ((a.status || "").toLowerCase() === "cancelled") {
            cancelled += 1
            dayMap[dateKey].cancelled += 1
          }
        }
      })
      setTotalAppointments(total)
      setCompletedAppointments(completed)
      setCancelledAppointments(cancelled)
      const list = Object.values(dayMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setAppointmentData(list)
    }
    fetchAppointments()
  }, [fromDate, toDate])

  useEffect(() => {
    // Barber metrics: clients count and revenue by barber inferred from sales items
    const fetchBarberMetrics = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      const map: Record<string, { name: string; clients: number; rating: number; revenue: number }> = {}
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          const barber = (sale.barber || sale.barberName || "Unknown").toString()
          if (!map[barber]) map[barber] = { name: barber, clients: 0, rating: 0, revenue: 0 }
          map[barber].clients += 1
          const total = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
          map[barber].revenue += isNaN(total) ? 0 : total
        }
      })
      const list = Object.values(map).sort((a, b) => b.revenue - a.revenue)
      setBarberData(list)
    }
    fetchBarberMetrics()
  }, [fromDate, toDate])

  useEffect(() => {
    const fetchTotalRevenue = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      let total = 0
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          const t = typeof sale.total === "number" ? sale.total : parseFloat(sale.total)
          total += isNaN(t) ? 0 : t
        }
      })
      setTotalRevenue(total)
    }
    fetchTotalRevenue()
  }, [fromDate, toDate])

  useEffect(() => {
    const fetchServiceRevenue = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      let total = 0
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              if (item.type === "services" || item.type === "service") {
                const t = typeof item.price === "number" ? item.price : parseFloat(item.price)
                const qty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity)
                total += (isNaN(t) ? 0 : t) * (isNaN(qty) ? 1 : qty)
              }
            })
          }
        }
      })
      setServiceRevenue(total)
    }
    fetchServiceRevenue()
  }, [fromDate, toDate])

  useEffect(() => {
    const fetchProductRevenue = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      let total = 0
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              if (item.type === "products" || item.type === "product") {
                const t = typeof item.price === "number" ? item.price : parseFloat(item.price)
                const qty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity)
                total += (isNaN(t) ? 0 : t) * (isNaN(qty) ? 1 : qty)
              }
            })
          }
        }
      })
      setProductRevenue(total)
    }
    fetchProductRevenue()
  }, [fromDate, toDate])

  useEffect(() => {
    const fetchBarChartData = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      // Group by date
      const dataMap: Record<string, { date: string, services: number, products: number }> = {}
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          const dateKey = saleDate.toLocaleDateString()
          if (!dataMap[dateKey]) {
            dataMap[dateKey] = { date: dateKey, services: 0, products: 0 }
          }
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              const t = typeof item.price === "number" ? item.price : parseFloat(item.price)
              const qty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity)
              if (item.type === "services" || item.type === "service") {
                dataMap[dateKey].services += (isNaN(t) ? 0 : t) * (isNaN(qty) ? 1 : qty)
              } else if (item.type === "products" || item.type === "product") {
                dataMap[dateKey].products += (isNaN(t) ? 0 : t) * (isNaN(qty) ? 1 : qty)
              }
            })
          }
        }
      })
      // Sort by date
      const sorted = Object.values(dataMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setBarChartData(sorted)
    }
    fetchBarChartData()
  }, [fromDate, toDate])

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)
      const transactions: any[] = []
      querySnapshot.forEach(doc => {
        const sale = doc.data()
        let saleDate = sale.date
        if (typeof saleDate === "string") saleDate = parseISO(saleDate)
        else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
        if (
          saleDate &&
          (isEqual(saleDate, fromDate) || isEqual(saleDate, toDate) || (isAfter(saleDate, fromDate) && isBefore(saleDate, toDate)))
        ) {
          // For each item in the sale, create a transaction entry
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              transactions.push({
                id: doc.id,
                date: saleDate,
                customer: sale.customer?.name || sale.customer?.email || "",
                amount: (typeof item.price === "number" ? item.price : parseFloat(item.price)) * (item.quantity || 1),
                type: item.type || "Unknown",
                name: item.name || "Item"
              })
            })
          } else {
            // fallback: treat the whole sale as one transaction
            transactions.push({
              id: doc.id,
              date: saleDate,
              customer: sale.customer?.name || sale.customer?.email || "Walk-in",
              amount: typeof sale.total === "number" ? sale.total : parseFloat(sale.total),
              type: "Unknown",
              name: "Sale"
            })
          }
        }
      })
      // Sort by date descending
      transactions.sort((a, b) => b.date - a.date)
      setRecentTransactions(transactions.slice(0, 10)) // Show only the 10 most recent
    }
    fetchRecentTransactions()
  }, [fromDate, toDate])

  // Handle date range selection
  const handleDateRangeChange = (value:string) => {
    setDateRange(value)

    const today = new Date()

    switch (value) {
      case "today":
        setFromDate(today)
        setToDate(today)
        break
      case "week":
        setFromDate(subDays(today, 7))
        setToDate(today)
        break
      case "month":
        setFromDate(startOfMonth(today))
        setToDate(endOfMonth(today))
        break
      case "year":
        setFromDate(startOfYear(today))
        setToDate(endOfYear(today))
        break
      case "custom":
        setIsCalendarOpen(true)
        break
      default:
        break
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const handleExportClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmExport = async () => {
    setIsExporting(true)
    setShowConfirm(false)
    // Ask server to generate the report for the currently selected date range
    const res = await fetch("/api/export-reports", {
      method: "POST",
      body: JSON.stringify({
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "reports.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    setIsExporting(false)
  }

  return (
    <div className="container py-10 ml-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange === "custom"
                  ? `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`
                  : dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <div className="p-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium mb-1">From</p>
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={(date) => date && setFromDate(date)}
                        disabled={(date) => date > toDate || date > new Date()}
                        initialFocus
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">To</p>
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={(date) => date && setToDate(date)}
                        disabled={(date) => date < fromDate || date > new Date()}
                        initialFocus
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Dedicated calendar popover for quick date range selection */}
          <Popover open={rangePopoverOpen} onOpenChange={setRangePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Select Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium mb-1">From</p>
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => date && setFromDate(date)}
                    disabled={(date) => date > toDate || date > new Date()}
                    initialFocus
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">To</p>
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => date && setToDate(date)}
                    disabled={(date) => date < fromDate || date > new Date()}
                    initialFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => { setRangePopoverOpen(false) }}>Cancel</Button>
                <Button size="sm" onClick={() => { setDateRange('custom'); setRangePopoverOpen(false) }}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={handleExportClick}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="font-bold">Are you sure you want to download the report?</p>
            <div className="mt-4 flex gap-2">
              <button
                className="btn btn-success flex items-center justify-center bg-green-500 rounded p-2"
                onClick={handleConfirmExport}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Confirm Download"}
              </button>
              <button
                className="btn btn-secondary flex items-center justify-center bg-gray-500 rounded p-2 text-white"
                onClick={() => setShowConfirm(false)}
                disabled={isExporting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="barbers">Barbers</TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Revenue</CardTitle>
                <CardDescription>For the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-green-500">+12.5% from previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Service Revenue</CardTitle>
                <CardDescription>From haircuts and treatments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₱{serviceRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-green-500">+8.3% from previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Product Revenue</CardTitle>
                <CardDescription>From retail sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₱{productRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-green-500">+15.2% from previous period</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    services: {
                      label: "Services",
                      color: "hsl(var(--chart-1))",
                    },
                    products: {
                      label: "Products",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="services" fill="var(--color-services)" radius={4} />
                    <Bar dataKey="products" fill="var(--color-products)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id + transaction.date + transaction.name} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{transaction.customer}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()} | {transaction.type} | {transaction.name}
                        </div>
                      </div>
                      <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Services Report Tab */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Services</CardTitle>
                <CardDescription>For the selected period</CardDescription>
              </CardHeader>
              <CardContent>
             <div className="text-3xl font-bold">{totalAvailedServices.toLocaleString(undefined,)}</div>
                <p className="text-xs text-green-500"></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Service Value</CardTitle>
                <CardDescription>Per appointment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₱{(serviceRevenue / totalAvailedServices).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Most Popular Service</CardTitle>
                <CardDescription>Highest demand</CardDescription>
              </CardHeader>
              <CardContent>
               <div className="text-xl font-bold">
                  {serviceData.length > 0
                    ? serviceData.reduce((prev, current) => (prev.value > current.value ? prev : current)).name
                    : "No data"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {serviceData.length > 0
                    ? `${serviceData.reduce((prev, current) => (prev.value > current.value ? prev : current)).value} appointments`
                    : "No data"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Popularity</CardTitle>
                <CardDescription>Distribution of services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
                <CardDescription>Top performing services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceData.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{service.name}</span>
                        <span>{service.value} appointments</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${(service.value / Math.max(...serviceData.map((s) => s.value))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Report Tab */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Products Sold</CardTitle>
                <CardDescription>For the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">₱{productSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Product Value</CardTitle>
                <CardDescription>Per sale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{productData.length ? `₱${(productSales / productData.reduce((s, p) => s + p.value, 0)).toFixed(2)}` : "—"}</div>
                <p className="text-xs text-muted-foreground">From Firestore</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Best Selling Product</CardTitle>
                <CardDescription>Highest sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{productData[0]?.name || "No data"}</div>
                <p className="text-xs text-muted-foreground">{productData[0]?.value ? `${productData[0].value} units` : "—"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Sales Distribution</CardTitle>
                <CardDescription>By product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 40 + 120}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Top selling products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productData.map((product, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span>{product.value} units</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${(product.value / Math.max(...productData.map((p) => p.value))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Report Tab */}
        <TabsContent value="appointments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Appointments</CardTitle>
                <CardDescription>For the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">From Firestore</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed Appointments</CardTitle>
                <CardDescription>Successfully fulfilled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAppointments > 0 ? `${((completedAppointments / totalAppointments) * 100).toFixed(1)}% completion` : "—"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cancelled Appointments</CardTitle>
                <CardDescription>No-shows and cancellations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{cancelledAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAppointments > 0 ? `${((cancelledAppointments / totalAppointments) * 100).toFixed(1)}% cancelled` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Status</CardTitle>
                <CardDescription>Completed vs. cancelled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    completed: {
                      label: "Completed",
                      color: "hsl(var(--chart-1))",
                    },
                    cancelled: {
                      label: "Cancelled",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <BarChart data={appointmentData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                    <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Distribution</CardTitle>
                <CardDescription>By day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointmentData.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{day.date}</span>
                        <span>{day.completed + day.cancelled} appointments</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{
                            width: `${((day.completed + day.cancelled) / Math.max(...appointmentData.map((d) => d.completed + d.cancelled))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completed: {day.completed}</span>
                        <span>Cancelled: {day.cancelled}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Barbers Report Tab */}
        <TabsContent value="barbers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Barbers</CardTitle>
                <CardDescription>Active staff members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Clients</CardTitle>
                <CardDescription>Per barber</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold"></div>
                <p className="text-xs text-green-500"></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Performer</CardTitle>
                <CardDescription>Highest revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{barberData[0]?.name || "—"}</div>
                <p className="text-xs text-muted-foreground">
                  {barberData[0]?.revenue != null ? `₱${Number(barberData[0].revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue` : "No data"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Barber Performance</CardTitle>
                <CardDescription>Comparison of barber metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                    <div className="col-span-1">Barber</div>
                    <div className="col-span-1">Clients</div>
                    <div className="col-span-1">Revenue</div>
                    <div className="col-span-1">Performance</div>
                  </div>
                  {barberData.map((barber, index) => (
                    <div key={index} className="grid grid-cols-4 p-3 text-sm border-t">
                      <div className="col-span-1 font-medium">{barber.name}</div>
                      <div className="col-span-1">{barber.clients}</div>
                      <div className="col-span-1">{formatCurrency(barber.revenue)}</div>
                      <div className="col-span-1">
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${(barber.revenue / Math.max(...barberData.map((b) => b.revenue))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Barber</CardTitle>
                <CardDescription>Performance in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                    <div>Barber</div>
                    <div>Clients</div>
                    <div>Revenue</div>
                    <div>Share</div>
                  </div>
                  {barberData.map((b, i) => (
                    <div key={i} className="grid grid-cols-4 p-3 text-sm border-t">
                      <div className="font-medium">{b.name}</div>
                      <div>{b.clients}</div>
                      <div>₱{Number(b.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${(b.revenue / Math.max(1, ...barberData.map(x => x.revenue))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
