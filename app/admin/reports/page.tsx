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
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchTotalAvailedServices = async () => {
      const querySnapshot = await getDocs(collection(db, "sales"))
      let total = 0
      querySnapshot.forEach(doc => {
        const service = doc.data()
        let serviceDate = service.date
        if (typeof serviceDate === "string") serviceDate = parseISO(serviceDate)
        else if (serviceDate && serviceDate.toDate) serviceDate = serviceDate.toDate()
        if (
          serviceDate &&
          (isEqual(serviceDate, fromDate) || isEqual(serviceDate, toDate) || (isAfter(serviceDate, fromDate) && isBefore(serviceDate, toDate)))
        ) {
          total += 1 // Count each availed service
        }
      })
      setTotalAvailedServices(total)
    }
    fetchTotalAvailedServices()
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
    // Collect your data here (serviceData, productData, etc.)
    const res = await fetch("/api/export-reports", {
      method: "POST",
      body: JSON.stringify({
        serviceData,
        productData,
        appointmentData,
        barberData,
        recentTransactions,
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
                <div className="text-3xl font-bold">₱280.00</div>
                <p className="text-xs text-green-500">+3.5% from previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Best Selling Product</CardTitle>
                <CardDescription>Highest sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">Hair Wax</div>
                <p className="text-xs text-muted-foreground">35 units sold</p>
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
                <div className="text-3xl font-bold">89</div>
                <p className="text-xs text-green-500">+7.2% from previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed Appointments</CardTitle>
                <CardDescription>Successfully fulfilled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">79</div>
                <p className="text-xs text-muted-foreground">88.8% completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cancelled Appointments</CardTitle>
                <CardDescription>No-shows and cancellations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">10</div>
                <p className="text-xs text-amber-500">11.2% cancellation rate</p>
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
                <div className="text-3xl font-bold">28</div>
                <p className="text-xs text-green-500">+5.2% from previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Performer</CardTitle>
                <CardDescription>Highest revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">John Doe</div>
                <p className="text-xs text-muted-foreground">₱5,250 revenue</p>
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
                  <div className="grid grid-cols-5 bg-muted p-3 text-sm font-medium">
                    <div className="col-span-1">Barber</div>
                    <div className="col-span-1">Clients</div>
                    <div className="col-span-1">Rating</div>
                    <div className="col-span-1">Revenue</div>
                    <div className="col-span-1">Performance</div>
                  </div>
                  {barberData.map((barber, index) => (
                    <div key={index} className="grid grid-cols-5 p-3 text-sm border-t">
                      <div className="col-span-1 font-medium">{barber.name}</div>
                      <div className="col-span-1">{barber.clients}</div>
                      <div className="col-span-1">
                        <div className="flex items-center">
                          <span className="mr-1">{barber.rating}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-yellow-500"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
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
                <CardDescription>Monthly performance trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    "John Doe": {
                      label: "John Doe",
                      color: "hsl(var(--chart-1))",
                    },
                    "Mike Smith": {
                      label: "Mike Smith",
                      color: "hsl(var(--chart-2))",
                    },
                    "Alex Johnson": {
                      label: "Alex Johnson",
                      color: "hsl(120, 70%, 50%)",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <LineChart
                    data={[
                      { month: "Jan", "John Doe": 4200, "Mike Smith": 3800, "Alex Johnson": 3100 },
                      { month: "Feb", "John Doe": 4500, "Mike Smith": 4000, "Alex Johnson": 3300 },
                      { month: "Mar", "John Doe": 4800, "Mike Smith": 4200, "Alex Johnson": 3500 },
                      { month: "Apr", "John Doe": 5000, "Mike Smith": 4100, "Alex Johnson": 3400 },
                      { month: "May", "John Doe": 5250, "Mike Smith": 4200, "Alex Johnson": 3300 },
                    ]}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="John Doe" stroke="var(--color-John Doe)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Mike Smith" stroke="var(--color-Mike Smith)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Alex Johnson" stroke="var(--color-Alex Johnson)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
