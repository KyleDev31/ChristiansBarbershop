"use client"

import { useState, useEffect } from "react"
import { Calculator, CreditCard, Minus, Plus, Receipt, Search, ShoppingCart, Trash, User, X, Loader2, MessageSquare, Settings, Edit, PlusCircle, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { saveAs } from 'file-saver'
import { db } from "@/lib/firebase"
import { addDoc, collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  category: string;
  image: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

type Item = Service | Product;

interface SalesReportRow {
  'Transaction ID': string;
  'Date': string;
  'Customer': string;
  'Items': string;
  'Subtotal': string;
  'Total': string;
  'Payment Method': string;
}

interface ServiceReportRow {
  'Service Name': string;
  'Times Booked': number;
  'Total Revenue': string;
  'Average Revenue per Booking': string;
}

export default function POSPage() {
  const [localServices, setLocalServices] = useState<Service[]>([])
  useEffect(() => {
    const loadServices = async () => {
      const snap = await getDocs(collection(db, "services"))
      const data: Service[] = snap.docs.map((d, idx) => {
        const s: any = d.data()
        return {
          id: idx + 1,
          name: s.name || "Service",
          price: typeof s.price === "number" ? s.price : parseFloat(s.price) || 0,
          duration: s.duration || 0,
          category: s.category || "",
          image: s.image || "/placeholder.svg?height=100&width=100",
        }
      })
      setLocalServices(data)
    }
    loadServices()
  }, [])

  // Mock data for products
  const products = [
    {
      id: 101,
      name: "Hair Wax",
      price: 250,
      category: "styling",
      stock: 15,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 102,
      name: "Beard Oil",
      price: 350,
      category: "beard",
      stock: 8,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 103,
      name: "Shampoo",
      price: 280,
      category: "hair",
      stock: 3,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 104,
      name: "Hair Spray",
      price: 320,
      category: "styling",
      stock: 12,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 105,
      name: "Razor Blades",
      price: 150,
      category: "tools",
      stock: 2,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 106,
      name: "Aftershave",
      price: 300,
      category: "beard",
      stock: 7,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  // Mock data for customers
  const customers = [
    {
      id: 1,
      name: "John Doe",
      phone: "+63 912 345 6789",
      email: "john.doe@example.com",
    },
    {
      id: 2,
      name: "Alex Johnson",
      phone: "+63 923 456 7890",
      email: "alex.johnson@example.com",
    },
    {
      id: 3,
      name: "Michael Brown",
      phone: "+63 934 567 8901",
      email: "michael.brown@example.com",
    },
  ]

  // State declarations
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("services")
  const [cart, setCart] = useState<{id: number; name: string; price: number; quantity: number; type: string; image?: string; isSpecialRequest: boolean }[]>([])
  const [customer, setCustomer] = useState<{ id: number; name: string; phone: string; email: string } | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [receiptData, setReceiptData] = useState<{
    id: string;
    date: Date;
    customer: { id: number; name: string; phone: string; email: string } | null;
    items: { id: number; name: string; price: number; quantity: number; type: string; image?: string }[];
    subtotal: number;
    total: number;
    paymentMethod: string;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpecialRequestDialogOpen, setIsSpecialRequestDialogOpen] = useState(false)
  const [specialRequest, setSpecialRequest] = useState("")
  const [specialRequestPrice, setSpecialRequestPrice] = useState("")
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  // localServices populated from Firestore
  const [transactions, setTransactions] = useState<{
    id: string;
    date: Date;
    customer: { id: number; name: string; phone: string; email: string } | null;
    items: { id: number; name: string; price: number; quantity: number; type: string; image?: string }[];
    subtotal: number;
    total: number;
    paymentMethod: string;
  }[]>([])
  const [cashAmount, setCashAmount] = useState("")
  const [cashError, setCashError] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState("")
  const [barberError, setBarberError] = useState("")
  const [finishedOpen, setFinishedOpen] = useState(false)
  const [finishedAppointments, setFinishedAppointments] = useState<any[]>([])
  const [finishedCount, setFinishedCount] = useState(0)
  const [addedFinishedAppointmentIds, setAddedFinishedAppointmentIds] = useState<string[]>([])

  // Filter items based on search query and active tab
  const filteredItems =
    activeTab === "services"
      ? localServices.filter(
          (service) =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (activeTab === "services" || service.category === activeTab)
        )
      : products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (activeTab === "products" || product.category === activeTab)
        )

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal 

  // Listen to finished services (appointments marked completed by barbers)
  useEffect(() => {
    const q = query(collection(db, "appointments"), where("status", "==", "completed"))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a: any) => !a.posRecorded)
      // sort by completedAt desc if available, else by any date field
      items.sort((a: any, b: any) => {
        const ad = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
        const bd = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
        return bd - ad
      })
      setFinishedAppointments(items)
      setFinishedCount(items.length)
    })
    return () => unsub()
  }, [])

  // Add finished appointment services to current cart
  const loadFinishedToCart = (a: any) => {
    const newItems: {id: number; name: string; price: number; quantity: number; type: string; image?: string; isSpecialRequest: boolean }[] = []

    // If appointment has an array of items/services
    if (Array.isArray(a.items)) {
      for (const it of a.items) {
        const name = it.name || it.serviceName || "Service"
        const price = typeof it.price === "number" ? it.price : parseFloat(it.price) || 0
        const quantity = typeof it.quantity === "number" ? it.quantity : 1
        newItems.push({ id: Date.now() + Math.floor(Math.random() * 1000), name, price, quantity, type: "services", isSpecialRequest: false })
      }
    } else {
      // Fallback to single service fields on appointment
      const name = a.serviceName || a.service || "Service"
      const price = typeof a.price === "number" ? a.price : parseFloat(a.price) || 0
      const quantity = 1
      newItems.push({ id: Date.now(), name, price, quantity, type: "services", isSpecialRequest: false })
    }

  // Merge into cart (aggregate quantities by name + type)
    setCart((prev) => {
      const updated = [...prev]
      for (const ni of newItems) {
        const idx = updated.findIndex((ci) => ci.name === ni.name && ci.type === ni.type)
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + ni.quantity }
        } else {
          updated.push(ni)
        }
      }
      // Attempt to auto-detect barber from appointment and set selectedBarber
      // Only set if admin hasn't manually selected a barber yet
      const normalizeBarberValue = (n: string) => n.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      try {
        if (!selectedBarber) {
          if (a.barber) {
            const barberName = typeof a.barber === 'string' ? a.barber : (a.barber.name || a.barber.displayName || a.barber.fullName || '')
            if (barberName) setSelectedBarber(normalizeBarberValue(barberName))
          } else if (a.barberName) {
            setSelectedBarber(normalizeBarberValue(a.barberName))
          } else if (a.barberEmail || a.email) {
            const lookupEmail = a.barberEmail || a.email
            ;(async () => {
              try {
                const q = query(collection(db, 'users'), where('email', '==', lookupEmail))
                const snaps = await getDocs(q)
                if (!snaps.empty) {
                  const u = snaps.docs[0].data()
                  const name = u.displayName || u.fullName || u.name || u.email || ''
                  if (name) setSelectedBarber(normalizeBarberValue(name))
                }
              } catch (e) {
                // ignore lookup errors
              }
            })()
          } else if (a.barberId) {
            ;(async () => {
              try {
                const q = query(collection(db, 'users'), where('barberId', '==', a.barberId))
                const snaps = await getDocs(q)
                if (!snaps.empty) {
                  const u = snaps.docs[0].data()
                  const name = u.displayName || u.fullName || u.name || u.email || ''
                  if (name) setSelectedBarber(normalizeBarberValue(name))
                }
              } catch (e) {
                // ignore
              }
            })()
          }
        }
      } catch (e) {
        // ignore any errors during barber detection
      }
      return updated
    })
    // record that this finished appointment was added to the cart so we can mark it recorded on payment
    if (a?.id) {
      setAddedFinishedAppointmentIds((prev) => (prev.includes(a.id) ? prev : [...prev, a.id]))
    }
  }

  // Mark a finished appointment as recorded so it disappears
  const markFinishedRecorded = async (id: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { posRecorded: true })
      toast({ title: "Marked recorded", description: "Appointment removed from Finished Services." })
    } catch (e) {
      console.error("Failed to mark recorded", e)
      toast({ title: "Action failed", description: "Could not mark as recorded.", variant: "destructive" })
    }
  }

  // Add item to cart
  const addToCart = (item: { id: number; name: string; price: number; type?: string; image?: string }) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id && cartItem.type === activeTab)

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id && cartItem.type === activeTab
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      )
    } else {
      setCart([...cart, { ...item, quantity: 1, type: activeTab, isSpecialRequest: false }])
    }
  }

  // Remove item from cart
  const removeFromCart = (index:number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  // Update item quantity
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
  }

  // Handle payment
  const handlePayment = async () => {
    // Prevent double processing
    if (isProcessingPayment) {
      return
    }

    setIsProcessingPayment(true)

    try {
      // Check if cart contains only products (no services)
      const hasServices = cart.some(item => item.type === "services")
      
      // Only require barber selection if cart contains services
      if (hasServices && !selectedBarber) {
        setBarberError("Please select a barber.")
        return
      } else {
        setBarberError("")
      }
      if (paymentMethod === "cash") {
        const cash = parseFloat(cashAmount)
        if (isNaN(cash) || cash <= 0) {
          setCashError("Enter a valid positive amount.")
          return
        }
        if (cash < total) {
          setCashError("Cash amount must be at least the total.")
          return
        }
        setCashError("")
      }
      // Generate receipt data
      const toTitle = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s
      const receipt = {
        id: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date(),
        customer: customer,
        items: cart,
        subtotal: subtotal,
        total: total,
        paymentMethod: paymentMethod,
        barber: hasServices ? (selectedBarber || "") : "Store",
        barberName: hasServices ? toTitle(selectedBarber || "") : "Store"
      }

      // Save to Firestore
      await saveSaleToFirestore({
        transactionId: receipt.id,
        date: receipt.date,
        customer: receipt.customer,
        items: receipt.items,
        subtotal: receipt.subtotal,
        total: receipt.total,
        paymentMethod: receipt.paymentMethod,
        barber: receipt.barber,
        barberName: receipt.barberName,
      })
      
      toast({
        title: "Sale recorded successfully!",
        description: "The transaction has been saved to the sales database."
      })

      // Add to transactions history
      setTransactions([...transactions, receipt])
      setIsPaymentDialogOpen(false)
      setIsReceiptDialogOpen(true)
      setReceiptData(receipt)
      setCashAmount("")
      // Mark any finished appointments that were added to this cart as recorded
      if (addedFinishedAppointmentIds.length > 0) {
        for (const id of addedFinishedAppointmentIds) {
          try {
            await updateDoc(doc(db, 'appointments', id), { posRecorded: true })
          } catch (e) {
            console.error('Failed to mark finished appointment recorded after payment', e)
          }
        }
        // clear tracked ids
        setAddedFinishedAppointmentIds([])
      }
    } catch (error) {
      console.error("Error saving sale to Firestore:", error)
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle new transaction
  const handleNewTransaction = () => {
    setCart([])
    setCustomer(null)
    setIsReceiptDialogOpen(false)
    setReceiptData(null)
  }

  // Format currency
  const formatCurrency = (amount:number) => {
    return `₱${amount.toFixed(2)}`
  }

  // Add special request to cart
  const addSpecialRequest = () => {
    if (!specialRequest.trim()) return

    const newItem = {
      id: Date.now(),
      name: `Special Request: ${specialRequest}`,
      price: Number(specialRequestPrice) || 0,
      quantity: 1,
      type: "special",
      isSpecialRequest: true
    }

    setCart([...cart, newItem])
    setSpecialRequest("")
    setSpecialRequestPrice("")
    setIsSpecialRequestDialogOpen(false)
  }

  // Add or edit service
  const handleServiceSubmit = () => {
    if (!editingService?.name || !editingService?.price) return

    if (editingService.id) {
      // Edit existing service
      setLocalServices(localServices.map(service => 
        service.id === editingService.id ? { ...service, ...editingService } as Service : service
      ))
    } else {
      // Add new service
      const newService: Service = {
        id: Date.now(),
        name: editingService.name,
        price: editingService.price,
        duration: editingService.duration || 30, // Default duration
        category: editingService.category || "haircut",
        image: editingService.image || "/placeholder.svg?height=100&width=100",
      }
      setLocalServices([...localServices, newService])
    }

    setEditingService(null)
    setIsServiceDialogOpen(false)
  }

  // Delete service
  const deleteService = (id: number) => {
    setLocalServices(localServices.filter(service => service.id !== id))
  }

  // Open service dialog for editing
  const editService = (service: Service) => {
    setEditingService(service)
    setIsServiceDialogOpen(true)
  }

  // Open service dialog for new service
  const addNewService = () => {
    setEditingService({
      name: "",
      price: 0,
      duration: 30,
      category: "haircut",
      image: "/placeholder.svg?height=100&width=100",
    })
    setIsServiceDialogOpen(true)
  }

  // Update the card click handler to check type
  const handleCardClick = (item: Item) => {
    if ('duration' in item) {
      // It's a service
      addToCart(item)
    } else {
      // It's a product
      addToCart(item)
    }
  }

  // Export Sales Report
  const exportSalesReport = () => {
    try {
      if (transactions.length === 0) {
        alert('No transactions to export')
        return
      }

      const salesData: SalesReportRow[] = transactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Date': new Date(transaction.date).toLocaleString(),
        'Customer': transaction.customer?.name || 'Walk-in',
        'Items': transaction.items.map(item => `${item.name} (${item.quantity})`).join(', '),
        'Subtotal': `₱${transaction.subtotal.toFixed(2)}`,
        'Total': `₱${transaction.total.toFixed(2)}`,
        'Payment Method': transaction.paymentMethod,
      }))

      // Convert data to CSV
      const headers = Object.keys(salesData[0]) as (keyof SalesReportRow)[]
      const csvRows = [
        headers.join(','),
        ...salesData.map(row => 
          headers.map(header => {
            const value = row[header]
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          }).join(',')
        )
      ]
      const csvContent = csvRows.join('\n')

      // Create and save file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `sales_report_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting sales report:', error)
      alert('Failed to export sales report. Please try again.')
    }
  }

  // Export Service Performance Report
  const exportServiceReport = () => {
    try {
      if (transactions.length === 0) {
        alert('No transactions to export')
        return
      }

      // Calculate service statistics
      const serviceStats = new Map<string, { count: number; revenue: number }>()
      
      transactions.forEach(transaction => {
        transaction.items.forEach(item => {
          if (item.type === 'services') {
            const current = serviceStats.get(item.name) || { count: 0, revenue: 0 }
            serviceStats.set(item.name, {
              count: current.count + item.quantity,
              revenue: current.revenue + (item.price * item.quantity)
            })
          }
        })
      })

      if (serviceStats.size === 0) {
        alert('No service data to export')
        return
      }

      const serviceData: ServiceReportRow[] = Array.from(serviceStats.entries()).map(([name, stats]) => ({
        'Service Name': name,
        'Times Booked': stats.count,
        'Total Revenue': `₱${stats.revenue.toFixed(2)}`,
        'Average Revenue per Booking': `₱${(stats.revenue / stats.count).toFixed(2)}`
      }))

      // Convert data to CSV
      const headers = Object.keys(serviceData[0]) as (keyof ServiceReportRow)[]
      const csvRows = [
        headers.join(','),
        ...serviceData.map(row => 
          headers.map(header => {
            const value = row[header]
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          }).join(',')
        )
      ]
      const csvContent = csvRows.join('\n')

      // Create and save file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `service_performance_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting service report:', error)
      alert('Failed to export service report. Please try again.')
    }
  }

  const saveSaleToFirestore = async (saleData: any) => {
    try {
      await addDoc(collection(db, "sales"), saleData)
    } catch (error) {
      console.error("Error saving sale to Firestore:", error)
    }
  }

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Clear barber selection when cart becomes products-only
  useEffect(() => {
    const hasServices = cart.some(item => item.type === "services")
    if (!hasServices && selectedBarber) {
      setSelectedBarber("")
      setBarberError("")
    }
  }, [cart, selectedBarber])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products/Services Skeleton */}
          <div className="lg:col-span-2">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
          {/* Cart Skeleton */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-24 w-full mt-4" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4 max-w-[1920px] text-sm">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Point of Sale</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <Button className="bg-green-900 w-full sm:w-auto text-xs sm:text-sm" onClick={() => setFinishedOpen((v) => !v)}>
            Finished Services
            {finishedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center text-xs rounded-full bg-red-600 text-white px-2 py-0.5">
                {finishedCount}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={() => setCart([])} className="w-full sm:w-auto text-xs sm:text-sm">
            <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Clear Cart
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Products/Services Section */}
        <div className="lg:col-span-8">
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold">Products & Services</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Add items to the current transaction</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8 sm:pl-10 h-8 sm:h-10 border-gray-200 focus:border-primary text-xs sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 sm:h-8 sm:w-8 hover:bg-gray-100"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {finishedOpen && (
                <div className="mb-4 sm:mb-6 border rounded-lg p-3 sm:p-4 bg-green-50 border-green-200">
                  <div className="font-semibold mb-3 text-green-800 text-sm sm:text-base">Recently Finished Services</div>
                  {finishedAppointments.length === 0 ? (
                    <div className="text-xs sm:text-sm text-green-600">No finished services yet.</div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-64 overflow-auto pr-1">
                      {finishedAppointments.map((a: any) => (
                        <div key={a.id} className="flex flex-col border border-green-200 rounded-lg p-2 sm:p-3 bg-white shadow-sm">
                          <div className="cursor-pointer flex-1 mb-2" onClick={() => loadFinishedToCart(a)} title="Load to current sale">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{a.customerName || a.customer || a.email || "Customer"}</div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {a.serviceName || a.service || "Service"}
                              {a.time ? ` • ${a.time}` : ""}
                              {a.date ? ` • ${a.date}` : ""}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {a.completedAt?.toDate?.() ? new Date(a.completedAt.toDate()).toLocaleString() : ""}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => loadFinishedToCart(a)} 
                              className="text-xs w-full sm:w-auto flex-1 sm:flex-none"
                            >
                              Add to cart
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => markFinishedRecorded(a.id)} 
                              className="text-xs w-full sm:w-auto flex-1 sm:flex-none"
                            >
                              Mark recorded
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Tabs defaultValue="services" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 sm:mb-6 bg-gray-100">
                  <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Services</TabsTrigger>
                  <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Products</TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-lg border border-gray-200 hover:border-primary transition-all duration-200 group rounded-lg p-0 w-full max-w-[180px] sm:max-w-[200px] h-[120px] sm:h-[140px] flex flex-col"
                      onClick={() => handleCardClick(item)}
                    >
                      <CardContent className="flex flex-col justify-between items-center p-2 sm:p-4 h-full">
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                          <div className="font-semibold text-xs sm:text-sm text-center mb-1 sm:mb-2 w-full leading-tight line-clamp-2">{item.name}</div>
                          <div className="flex justify-center items-center w-full">
                            <span className="text-sm sm:text-lg font-bold text-primary">{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                        {'duration' in item && (
                          <div className="flex justify-center gap-1 mt-1 sm:mt-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                editService(item as Service)
                              }}
                            >
                              <Edit className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteService(item.id)
                              }}
                            >
                              <Trash className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col sticky top-4 sm:top-6 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold">Current Sale</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    {cart.length} {cart.length === 1 ? "item" : "items"} in cart
                  </CardDescription>
                </div>
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto px-3 sm:px-4">
              {cart.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs sm:text-sm truncate">{item.name}</div>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div className="flex items-center border border-gray-300 rounded-md bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-none hover:bg-gray-100"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-none hover:bg-gray-100"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-red-500 hover:bg-red-50"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center text-sm">
                    Your cart is empty.<br />
                    Add products or services to begin.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-shrink-0 border-t border-gray-200 pt-3 sm:pt-4 px-3 sm:px-4">
              <div className="w-full space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base sm:text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button 
                  disabled={cart.length === 0} 
                  onClick={() => setIsPaymentDialogOpen(true)}
                  className="w-full h-9 sm:h-11 bg-primary hover:bg-primary/90 text-white font-medium text-xs sm:text-sm"
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Customer Selection Dialog */}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={open => { 
  setIsPaymentDialogOpen(open); 
  if (!open) setCashAmount(""); 
}}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Payment</DialogTitle>
      <DialogDescription>Complete the transaction.</DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Barber Selection - Only show if cart contains services */}
        {cart.some(item => item.type === "services") && (
          <div className="space-y-2">
            <Label htmlFor="barber">Select Barber</Label>
            <Select value={selectedBarber} onValueChange={(v) => { setSelectedBarber(v); setBarberError("") }}>
              <SelectTrigger id="barber">
                <SelectValue placeholder="Choose a barber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jayboy">Jayboy</SelectItem>
                <SelectItem value="noel">Noel</SelectItem>
                <SelectItem value="abel">Abel</SelectItem>
              </SelectContent>
            </Select>
            {selectedBarber && (
              <div className="text-sm text-muted-foreground">Auto-selected: {selectedBarber}</div>
            )}
            {barberError && <div className="text-red-600 text-sm">{barberError}</div>}
          </div>
        )}

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select defaultValue="cash" onValueChange={setPaymentMethod}>
            <SelectTrigger id="payment-method">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="gcash">GCash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === "cash" && (
          <div className="space-y-2">
            <Label htmlFor="cash-amount">Cash Amount</Label>
            <Input
              id="cash-amount"
              type="number"
              placeholder="Enter amount received"
              value={cashAmount}
              onChange={e => {
                const val = e.target.value
                setCashAmount(val)
                const cash = parseFloat(val)
                if (val === "") {
                  setCashError("")
                } else if (isNaN(cash) || cash <= 0) {
                  setCashError("Enter a valid positive amount.")
                } else if (cash < total) {
                  setCashError("Cash amount must be at least the total.")
                } else {
                  setCashError("")
                }
              }}
            />
            {cashError && <div className="text-red-600 text-sm">{cashError}</div>}
          </div>
        )}
      </div>
    </div>
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => setIsPaymentDialogOpen(false)}
        disabled={isProcessingPayment}
      >
        Cancel
      </Button>
      <Button 
        onClick={handlePayment}
        disabled={isProcessingPayment}
        className={isProcessingPayment ? "opacity-50 cursor-not-allowed" : ""}
      >
        {isProcessingPayment ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt</span>
              <Receipt className="h-5 w-5" />
            </DialogTitle>
            <DialogDescription>Transaction completed successfully.</DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="py-4">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">Christian's Barbershop</h3>
                <p className="text-sm text-muted-foreground">Poblacion, Nabunturan, Davao de Oro</p>
                <p className="text-sm text-muted-foreground">Tel: (123) 456-7890</p>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <span>Receipt #: {receiptData.id}</span>
                <span>{new Date(receiptData.date).toLocaleString()}</span>
              </div>

              {receiptData.customer && (
                <div className="mb-4 text-sm">
                  <p>
                    <span className="font-medium">Customer:</span> {receiptData.customer.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {receiptData.customer.phone}
                  </p>
                </div>
              )}

              <Separator className="my-2" />

              <div className="space-y-2 mb-4">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.type === "services" ? "Service" : "Product"})
                      </span>
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-2" />

              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="text-sm mb-4">
                <p>
                  <span className="font-medium">Payment Method:</span>{" "}
                  {receiptData.paymentMethod.charAt(0).toUpperCase() + receiptData.paymentMethod.slice(1)}
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground mt-6">
                <p>Thank you for your business!</p>
                <p>Please come again.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleNewTransaction} className="w-full">
              New Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Special Request Dialog */}
      <Dialog open={isSpecialRequestDialogOpen} onOpenChange={setIsSpecialRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Special Request</DialogTitle>
            <DialogDescription>
              Add any special requests or custom services for the client.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="special-request">Special Request</Label>
              <Input
                id="special-request"
                placeholder="Enter special request details..."
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-price">Additional Price (₱)</Label>
              <Input
                id="special-price"
                type="number"
                placeholder="Enter additional price..."
                value={specialRequestPrice}
                onChange={(e) => setSpecialRequestPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecialRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addSpecialRequest} disabled={!specialRequest.trim()}>
              Add Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Management Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingService?.id ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService?.id ? "Modify the service details below." : "Enter the details for the new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={editingService?.name || ""}
                onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter service name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Price (₱)</Label>
              <Input
                id="service-price"
                type="number"
                value={editingService?.price || ""}
                onChange={(e) => setEditingService(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                placeholder="Enter service price..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-category">Category</Label>
              <Select
                value={editingService?.category || "haircut"}
                onValueChange={(value) => setEditingService(prev => prev ? { ...prev, category: value } : null)}
              >
                <SelectTrigger id="service-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haircut">Haircut</SelectItem>
                  <SelectItem value="beard">Beard</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="facial">Facial</SelectItem>
                  <SelectItem value="addon">Add-on</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleServiceSubmit} disabled={!editingService?.name || !editingService?.price}>
              {editingService?.id ? "Save Changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
