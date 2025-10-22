"use client"

import { useState, useEffect, useRef } from "react"
import { Calculator, CreditCard, Minus, Plus, Receipt, Search, ShoppingCart, Trash, User, X, Loader2, MessageSquare, Settings, Edit, PlusCircle, FileSpreadsheet, CalendarIcon } from "lucide-react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
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
  type: 'services';
}
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  type: 'products';
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
          type: 'services' as const,
        }
      })
      setLocalServices(data)
    }
    loadServices()
  }, [])

  // Mock data for products
  const products: Product[] = [
    {
      id: 101,
      name: "Hair Wax",
      price: 250,
      category: "styling",
      stock: 15,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
    },
    {
      id: 102,
      name: "Beard Oil",
      price: 350,
      category: "beard",
      stock: 8,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
    },
    {
      id: 103,
      name: "Shampoo",
      price: 280,
      category: "hair",
      stock: 3,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
    },
    {
      id: 104,
      name: "Hair Spray",
      price: 320,
      category: "styling",
      stock: 12,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
    },
    {
      id: 105,
      name: "Razor Blades",
      price: 150,
      category: "tools",
      stock: 2,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
    },
    {
      id: 106,
      name: "Aftershave",
      price: 300,
      category: "beard",
      stock: 7,
      image: "/placeholder.svg?height=100&width=100",
      type: 'products' as const,
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
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [transactionTime, setTransactionTime] = useState<string>(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [transactionDateTime, setTransactionDateTime] = useState<string>(() => new Date().toISOString().slice(0,16)) // datetime-local value
  const [dateError, setDateError] = useState<string>("")
  const [selectedBarber, setSelectedBarber] = useState("")
  const [barberError, setBarberError] = useState("")
  const [finishedOpen, setFinishedOpen] = useState(false)
  const [finishedAppointments, setFinishedAppointments] = useState<any[]>([])
  const [finishedCount, setFinishedCount] = useState(0)
  const [addedFinishedAppointmentIds, setAddedFinishedAppointmentIds] = useState<string[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState("")
  const [confirmMessage, setConfirmMessage] = useState("")
  const confirmActionRef = useRef<null | (() => void | Promise<void>)>(null)

  const openConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    confirmActionRef.current = onConfirm
    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    const action = confirmActionRef.current
    setIsConfirmOpen(false)
    if (action) {
      await action()
    }
    confirmActionRef.current = null
  }

  // Filter items based on search query and active tab
  const filteredItems: (Service | Product)[] =
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
  const confirmLoadFinishedToCart = (a: any) => {
    openConfirm(
      "Add to cart",
      "Load this finished service into the current cart?",
      () => {
        loadFinishedToCart(a)
        toast({ title: "Added to cart", description: "Finished service loaded into cart." })
      }
    )
  }
  const confirmClearCart = () => {
    openConfirm(
      "Clear cart",
      "Are you sure you want to remove all items from the cart?",
      () => {
        setCart([])
        toast({ title: "Cart cleared", description: "All items have been removed." })
      }
    )
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
  const confirmMarkRecorded = (id: string) => {
    openConfirm(
      "Mark recorded",
      "Are you sure you want to mark this finished appointment as recorded?",
      () => markFinishedRecorded(id)
    )
  }

  // Add item to cart
  const addToCart = (item: Service | Product) => {
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
  const confirmAddToCart = (item: Service | Product) => {
    openConfirm(
      "Add to cart",
      `Add "${item.name}" to the cart?`,
      () => {
        addToCart(item)
        toast({ title: "Added to cart", description: `${item.name} has been added to the cart.` })
      }
    )
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
     // validate selected transaction datetime
     // Combine date and time into a single Date object
     const [hours, minutes] = transactionTime.split(':').map(Number)
     const chosenDate = new Date(transactionDate)
     chosenDate.setHours(hours, minutes, 0, 0)
     
     if (isNaN(chosenDate.getTime())) {
       setDateError("Please select a valid date/time.")
       setIsProcessingPayment(false)
       return
     }
     const now = new Date()
     if (chosenDate.getTime() > now.getTime()) {
       setDateError("Transaction date cannot be in the future.")
       setIsProcessingPayment(false)
       return
     }
     setDateError("")
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
        date: chosenDate,
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
      price: parseFloat(specialRequestPrice) || 0,
      quantity: 1,
      type: "services",
      isSpecialRequest: true,
    }

    setCart([...cart, newItem])
    setSpecialRequest("")
    setSpecialRequestPrice("")
  }

  // Save sale transaction to Firestore
  const saveSaleToFirestore = async (saleData: {
    transactionId: string;
    date: Date;
    customer: { id: number; name: string; phone: string; email: string } | null;
    items: { id: number; name: string; price: number; quantity: number; type: string; image?: string }[];
    subtotal: number;
    total: number;
    paymentMethod: string;
    barber: string;
    barberName: string;
  }) => {
    try {
      await addDoc(collection(db, "sales"), saleData)
    } catch (error) {
      console.error("Error saving sale to Firestore:", error)
      throw error
    }
  }

  const handleServiceSubmit = async () => {
    if (!editingService) return

    try {
      if (editingService.id) {
        // Update existing service
        const serviceRef = doc(db, "services", editingService.id.toString())
        await updateDoc(serviceRef, {
          name: editingService.name,
          price: editingService.price,
          category: editingService.category,
          // image: editingService.image, // handle image upload separately
        })
        toast({ title: "Service updated", description: "The service has been updated successfully." })
      } else {
        // Add new service
        const newService = {
          name: editingService.name,
          price: editingService.price,
          category: editingService.category,
          image: "", // default or placeholder image
        }
        await addDoc(collection(db, "services"), newService)
        toast({ title: "Service added", description: "The new service has been added successfully." })
      }
      setIsServiceDialogOpen(false)
      setEditingService(null)
      // Reload services
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
          type: 'services' as const,
        }
      })
      setLocalServices(data)
    } catch (error) {
      console.error("Error saving service:", error)
      toast({ title: "Error", description: "There was an error saving the service.", variant: "destructive" })
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>

      {/* Search and Tabs */}
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search services or products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 max-w-md">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Services and Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-4 text-muted-foreground">
            No items found.
          </div>
        )}
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {item.type === "services" ? "Service" : "Product"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{formatCurrency(item.price)}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.type === "services" ? `${'duration' in item ? item.duration : 0} mins` : `Stock: ${'stock' in item ? item.stock : 0}`}
                  </div>
                </div>
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => confirmAddToCart(item)}
                className="w-full"
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-lg font-semibold mb-4">Cart Summary</h2>
        {cart.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            Your cart is empty.
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  {item.name} × {item.quantity}
                </div>
                <div className="font-bold">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-4">
        <Button
          onClick={() => setIsCustomerDialogOpen(true)}
          className="flex-1"
          variant={customer ? "default" : "outline"}
        >
          {customer ? `Customer: ${customer.name}` : "Select Customer"}
        </Button>
        <Button
          onClick={() => setIsPaymentDialogOpen(true)}
          className="flex-1"
          disabled={cart.length === 0}
        >
          Proceed to Payment
        </Button>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={open => { 
        setIsPaymentDialogOpen(open); 
        if (!open) {
          setCashAmount("");
          const now = new Date()
          setTransactionDate(now);
          setTransactionTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          setTransactionDateTime(now.toISOString().slice(0,16));
          setDateError("");
        }
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

             {/* Transaction date/time picker */}
             <div className="space-y-2">
               <Label>Transaction Date & Time</Label>
               <div className="flex gap-2">
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "flex-1 justify-start text-left font-normal",
                         !transactionDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={transactionDate}
                       onSelect={(date) => {
                         if (date) {
                           setTransactionDate(date)
                           setDateError("")
                         }
                       }}
                       disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
                 <Input
                   type="time"
                   value={transactionTime}
                   onChange={(e) => {
                     setTransactionTime(e.target.value)
                     setDateError("")
                   }}
                   className="w-32"
                 />
               </div>
               {dateError && <div className="text-red-600 text-sm">{dateError}</div>}
             </div>

              {/* Barber Selection - Only show if cart contains services */}
              {cart.some(item => item.type === "services") && (
                <div className="space-y-2">
                  <Label htmlFor="barber-select">Select Barber</Label>
                  <Select
                    value={selectedBarber}
                    onValueChange={setSelectedBarber}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a barber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Abel">Abel</SelectItem>
                      <SelectItem value="JayBoy">Jayboy</SelectItem>
                      <SelectItem value="Noel">Noel</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Confirm Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

