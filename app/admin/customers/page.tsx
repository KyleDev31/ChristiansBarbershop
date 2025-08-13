"use client"

import { useState } from "react"
import { Calendar, Edit, Plus, Search, Trash, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Mock data for customers
  const customers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+63 912 345 6789",
      joinDate: "2023-01-15",
      visits: 12,
      lastVisit: "2023-05-20",
      preferredBarber: "Mike Smith",
      favoriteService: "Regular Haircut",
      status: "active",
    },
    {
      id: 2,
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      phone: "+63 923 456 7890",
      joinDate: "2023-02-10",
      visits: 8,
      lastVisit: "2023-05-15",
      preferredBarber: "John Doe",
      favoriteService: "Beard Trim",
      status: "active",
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@example.com",
      phone: "+63 934 567 8901",
      joinDate: "2023-03-05",
      visits: 5,
      lastVisit: "2023-04-30",
      preferredBarber: "Alex Johnson",
      favoriteService: "Hair & Beard Combo",
      status: "active",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.wilson@example.com",
      phone: "+63 945 678 9012",
      joinDate: "2023-03-20",
      visits: 3,
      lastVisit: "2023-05-10",
      preferredBarber: "Mike Smith",
      favoriteService: "Kids Haircut",
      status: "active",
    },
    {
      id: 5,
      name: "Robert Taylor",
      email: "robert.taylor@example.com",
      phone: "+63 956 789 0123",
      joinDate: "2023-04-12",
      visits: 2,
      lastVisit: "2023-05-05",
      preferredBarber: "John Doe",
      favoriteService: "Regular Haircut",
      status: "inactive",
    },
    {
      id: 6,
      name: "James Anderson",
      email: "james.anderson@example.com",
      phone: "+63 967 890 1234",
      joinDate: "2023-04-25",
      visits: 1,
      lastVisit: "2023-04-25",
      preferredBarber: "Alex Johnson",
      favoriteService: "Hair Coloring",
      status: "active",
    },
  ]

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      customerId: 1,
      date: "2023-05-20",
      time: "10:00 AM",
      service: "Regular Haircut",
      barber: "Mike Smith",
      status: "Completed",
      price: "₱150",
    },
    {
      id: 2,
      customerId: 1,
      date: "2023-04-15",
      time: "2:30 PM",
      service: "Hair & Beard Combo",
      barber: "John Doe",
      status: "Completed",
      price: "₱200",
    },
    {
      id: 3,
      customerId: 1,
      date: "2023-03-10",
      time: "11:00 AM",
      service: "Regular Haircut",
      barber: "Mike Smith",
      status: "Completed",
      price: "₱150",
    },
    {
      id: 4,
      customerId: 2,
      date: "2023-05-15",
      time: "3:00 PM",
      service: "Beard Trim",
      barber: "John Doe",
      status: "Completed",
      price: "₱100",
    },
    {
      id: 5,
      customerId: 3,
      date: "2023-04-30",
      time: "1:00 PM",
      service: "Hair & Beard Combo",
      barber: "Alex Johnson",
      status: "Completed",
      price: "₱200",
    },
  ]

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    )
  })

  // Get customer appointments
  const getCustomerAppointments = (customerId) => {
    return appointments.filter((appointment) => appointment.customerId === customerId)
  }

  // Handle customer selection for details view
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer)
  }

  // Handle delete dialog
  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  // Handle edit dialog
  const handleEditClick = (customer) => {
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            customer.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Visits: {customer.visits}</span>
                        <span>Last: {new Date(customer.lastVisit).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No customers found matching your search.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedCustomer.name}</CardTitle>
                    <CardDescription>Customer ID: {selectedCustomer.id}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(selectedCustomer)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit customer</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteClick(selectedCustomer)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete customer</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="appointments">Appointment History</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-muted-foreground">Contact Information</Label>
                          <div className="mt-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedCustomer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 text-muted-foreground"
                              >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span>{selectedCustomer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 text-muted-foreground"
                              >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              <span>{selectedCustomer.email}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Customer Since</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(selectedCustomer.joinDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-muted-foreground">Visit Statistics</Label>
                          <div className="mt-1 space-y-2">
                            <div className="flex justify-between">
                              <span>Total Visits</span>
                              <span className="font-medium">{selectedCustomer.visits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last Visit</span>
                              <span className="font-medium">
                                {new Date(selectedCustomer.lastVisit).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  selectedCustomer.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Preferences</Label>
                          <div className="mt-1 space-y-2">
                            <div className="flex justify-between">
                              <span>Preferred Barber</span>
                              <span className="font-medium">{selectedCustomer.preferredBarber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Favorite Service</span>
                              <span className="font-medium">{selectedCustomer.favoriteService}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="appointments">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-5 bg-muted p-3 text-sm font-medium">
                        <div className="col-span-1">Date</div>
                        <div className="col-span-1">Service</div>
                        <div className="col-span-1">Barber</div>
                        <div className="col-span-1">Price</div>
                        <div className="col-span-1">Status</div>
                      </div>
                      {getCustomerAppointments(selectedCustomer.id).length > 0 ? (
                        getCustomerAppointments(selectedCustomer.id).map((appointment) => (
                          <div key={appointment.id} className="grid grid-cols-5 p-3 text-sm border-t">
                            <div className="col-span-1">
                              {new Date(appointment.date).toLocaleDateString()} {appointment.time}
                            </div>
                            <div className="col-span-1">{appointment.service}</div>
                            <div className="col-span-1">{appointment.barber}</div>
                            <div className="col-span-1">{appointment.price}</div>
                            <div className="col-span-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  appointment.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : appointment.status === "Upcoming"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No appointment history found for this customer.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="preferred-barber">Preferred Barber</Label>
                        <Select defaultValue={selectedCustomer.preferredBarber}>
                          <SelectTrigger id="preferred-barber" className="mt-1">
                            <SelectValue placeholder="Select barber" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="John Doe">John Doe</SelectItem>
                            <SelectItem value="Mike Smith">Mike Smith</SelectItem>
                            <SelectItem value="Alex Johnson">Alex Johnson</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="favorite-service">Favorite Service</Label>
                        <Select defaultValue={selectedCustomer.favoriteService}>
                          <SelectTrigger id="favorite-service" className="mt-1">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular Haircut">Regular Haircut</SelectItem>
                            <SelectItem value="Beard Trim">Beard Trim</SelectItem>
                            <SelectItem value="Hair & Beard Combo">Hair & Beard Combo</SelectItem>
                            <SelectItem value="Kids Haircut">Kids Haircut</SelectItem>
                            <SelectItem value="Hair Coloring">Hair Coloring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="communication-preference">Communication Preference</Label>
                        <Select defaultValue="sms">
                          <SelectTrigger id="communication-preference" className="mt-1">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="both">Both SMS & Email</SelectItem>
                            <SelectItem value="none">No Communications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="reminder-time">Appointment Reminder Time</Label>
                        <Select defaultValue="1day">
                          <SelectTrigger id="reminder-time" className="mt-1">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1hour">1 Hour Before</SelectItem>
                            <SelectItem value="3hours">3 Hours Before</SelectItem>
                            <SelectItem value="1day">1 Day Before</SelectItem>
                            <SelectItem value="2days">2 Days Before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end">
                        <Button>Save Preferences</Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <a href={`tel:${selectedCustomer.phone}`}>Call Customer</a>
                </Button>
                <Button>Book New Appointment</Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Customer Selected</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Select a customer from the list to view their details and appointment history.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Make changes to customer information.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" defaultValue={selectedCustomer.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" defaultValue={selectedCustomer.email} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input id="phone" defaultValue={selectedCustomer.phone} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select defaultValue={selectedCustomer.status}>
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
