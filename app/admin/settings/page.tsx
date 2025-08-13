"use client"

import { useState } from "react"
import { Bell, Building, Clock, CreditCard, Mail, MapPin, Phone, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business")
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Mock business data
  const businessData = {
    name: "Christian's Barbershop",
    email: "info@christiansbarbershop.com",
    phone: "(123) 456-7890",
    address: "123 Main Street, Nabunturan, Davao de Oro",
    taxId: "123-456-789",
    businessHours: {
      monday: { open: "08:00", close: "17:00", closed: false },
      tuesday: { open: "08:00", close: "17:00", closed: false },
      wednesday: { open: "08:00", close: "17:00", closed: false },
      thursday: { open: "08:00", close: "17:00", closed: false },
      friday: { open: "08:00", close: "17:00", closed: false },
      saturday: { open: "08:00", close: "17:00", closed: false },
      sunday: { open: "08:00", close: "17:00", closed: true },
    },
  }

  // Mock user data
  const users = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@christiansbarbershop.com",
      role: "admin",
      active: true,
    },
    {
      id: 2,
      name: "John Doe",
      email: "john.doe@christiansbarbershop.com",
      role: "barber",
      active: true,
    },
    {
      id: 3,
      name: "Mike Smith",
      email: "mike.smith@christiansbarbershop.com",
      role: "barber",
      active: true,
    },
    {
      id: 4,
      name: "Alex Johnson",
      email: "alex.johnson@christiansbarbershop.com",
      role: "barber",
      active: true,
    },
    {
      id: 5,
      name: "Reception Staff",
      email: "reception@christiansbarbershop.com",
      role: "staff",
      active: true,
    },
  ]

  // Handle save settings
  const handleSave = () => {
    // In a real app, this would save the settings to the database
    setSaveSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Your settings have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="business" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="business">Business Information</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
</Tabs>
        {/* Business Information Tab */}
        <TabsContent value="business">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input id="business-name" defaultValue={businessData.name} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-email">Email</Label>
                    <div className="flex">
                      <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-3" />
                      <Input id="business-email" defaultValue={businessData.email} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-phone">Phone</Label>
                    <div className="flex">
                      <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-3" />
                      <Input id="business-phone" defaultValue={businessData.phone} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Address</Label>
                  <div className="flex">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-3" />
                    <Textarea id="business-address" defaultValue={businessData.address} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-tax">Tax ID / Business Registration</Label>
                  <div className="flex">
                    <Building className="h-4 w-4 text-muted-foreground mr-2 mt-3" />
                    <Input id="business-tax" defaultValue={businessData.taxId} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(businessData.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="w-1/4 font-medium capitalize">{day}</div>
                    <div className="flex items-center gap-2 w-3/4">
                      <div className="flex items-center gap-2 w-2/3">
                        <Select defaultValue={hours.open} disabled={hours.closed}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Opening time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="08:00">8:00 AM</SelectItem>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>to</span>
                        <Select defaultValue={hours.close} disabled={hours.closed}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Closing time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="17:00">5:00 PM</SelectItem>
                            <SelectItem value="18:00">6:00 PM</SelectItem>
                            <SelectItem value="19:00">7:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 w-1/3">
                        <Switch id={`closed-${day}`} checked={hours.closed} />
                        <Label htmlFor={`closed-${day}`}>Closed</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Set Special Holiday Hours
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage staff accounts and permissions</CardDescription>
              </div>
              <Button>
                <User className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {users.map((user) => (
                  <div key={user.id} className="grid grid-cols-12 p-3 text-sm border-t items-center">
                    <div className="col-span-4 font-medium">{user.name}</div>
                    <div className="col-span-4">{user.email}</div>
                    <div className="col-span-2 capitalize">{user.role}</div>
                    <div className="col-span-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Configure access levels for each role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Admin</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Full access to all features and settings
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-appointments" defaultChecked disabled />
                      <Label htmlFor="admin-appointments">Appointments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-customers" defaultChecked disabled />
                      <Label htmlFor="admin-customers">Customers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-services" defaultChecked disabled />
                      <Label htmlFor="admin-services">Services</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-inventory" defaultChecked disabled />
                      <Label htmlFor="admin-inventory">Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-pos" defaultChecked disabled />
                      <Label htmlFor="admin-pos">Point of Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-reports" defaultChecked disabled />
                      <Label htmlFor="admin-reports">Reports</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-settings" defaultChecked disabled />
                      <Label htmlFor="admin-settings">Settings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-users" defaultChecked disabled />
                      <Label htmlFor="admin-users">User Management</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Barber</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Access to appointments and customer information
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-appointments" defaultChecked />
                      <Label htmlFor="barber-appointments">Appointments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-customers" defaultChecked />
                      <Label htmlFor="barber-customers">Customers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-services" defaultChecked />
                      <Label htmlFor="barber-services">Services</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-inventory" />
                      <Label htmlFor="barber-inventory">Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-pos" defaultChecked />
                      <Label htmlFor="barber-pos">Point of Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-reports" />
                      <Label htmlFor="barber-reports">Reports</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-settings" />
                      <Label htmlFor="barber-settings">Settings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="barber-users" />
                      <Label htmlFor="barber-users">User Management</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Staff</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Front desk and reception staff access
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-appointments" defaultChecked />
                      <Label htmlFor="staff-appointments">Appointments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-customers" defaultChecked />
                      <Label htmlFor="staff-customers">Customers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-services" defaultChecked />
                      <Label htmlFor="staff-services">Services</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-inventory" />
                      <Label htmlFor="staff-inventory">Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-pos" defaultChecked />
                      <Label htmlFor="staff-pos">Point of Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-reports" />
                      <Label htmlFor="staff-reports">Reports</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-settings" />
                      <Label htmlFor="staff-settings">Settings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="staff-users" />
                      <Label htmlFor="staff-users">User Management</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Appointment Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-new-appointment" className="font-medium">New Appointment</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a new appointment is booked
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-new-appointment-email" defaultChecked />
                        <Label htmlFor="notify-new-appointment-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-new-appointment-sms" defaultChecked />
                        <Label htmlFor="notify-new-appointment-sms">SMS</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-cancelled-appointment" className="font-medium">Cancelled Appointment</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when an appointment is cancelled
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-cancelled-appointment-email" defaultChecked />
                        <Label htmlFor="notify-cancelled-appointment-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-cancelled-appointment-sms" defaultChecked />
                        <Label htmlFor="notify-cancelled-appointment-sms">SMS</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-reminder" className="font-medium">Appointment Reminder</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders before scheduled appointments
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-reminder-email" defaultChecked />
                        <Label htmlFor="notify-reminder-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-reminder-sms" defaultChecked />
                        <Label htmlFor="notify-reminder-sms">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Inventory Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-low-stock" className="font-medium">Low Stock Alert</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when inventory items are running low
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-low-stock-email" defaultChecked />
                        <Label htmlFor="notify-low-stock-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-low-stock-sms" />
                        <Label htmlFor="notify-low-stock-sms">SMS</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-out-of-stock" className="font-medium">Out of Stock Alert</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when inventory items are out of stock
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-out-of-stock-email" defaultChecked />
                        <Label htmlFor="notify-out-of-stock-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-out-of-stock-sms" defaultChecked />
                        <Label htmlFor="notify-out-of-stock-sms">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Customer Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-customer-reminder" className="font-medium">Appointment Reminder</Label>
                      <p className="text-sm text-muted-foreground">
                        Send customers reminders before their appointments
                      </p>
                    </div>
                    <Select defaultValue="1day">
                      <SelectTrigger className="w-[180px]">
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

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-customer-thank-you" className="font-medium">Thank You Message</Label>
                      <p className="text-sm text-muted-foreground">
                        Send thank you message after appointment
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-customer-thank-you-email" defaultChecked />
                        <Label htmlFor="notify-customer-thank-you-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-customer-thank-you-sms" defaultChecked />
                        <Label htmlFor="notify-customer-thank-you-sms">SMS</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-customer-marketing" className="font-medium">Marketing Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Send promotional offers and updates
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-customer-marketing-email" defaultChecked />
                        <Label htmlFor="notify-customer-marketing-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify-customer-marketing-sms" />
                        <Label htmlFor="notify-customer-marketing-sms">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Configure accepted payment methods and processors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Accepted Payment Methods</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-cash" defaultChecked />
                    <Label htmlFor="payment-cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-card" defaultChecked />
                    <Label htmlFor="payment-card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-gcash" defaultChecked />
                    <Label htmlFor="payment-gcash">GCash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-maya" defaultChecked />
                    <Label htmlFor="payment-maya">Maya</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-bank" />
                    <Label htmlFor="payment-bank">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-check" />
                    <Label htmlFor="payment-check">Check</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Payment Processor</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-processor">Default Payment Processor</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger id="payment-processor">
                          <SelectValue placeholder="Select processor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Processing</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="paymongo">PayMongo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment-currency">Currency</Label>
                      <Select defaultValue="php">
                        <SelectTrigger id="payment-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="php">Philippine Peso (₱)</SelectItem>
                          <SelectItem value="usd">US Dollar ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-api-key">API Key</Label>
                    <Input id="payment-api-key" type="password" value="••••••••••••••••" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-webhook">Webhook URL</Label>
                    <Input id="payment-webhook" value="https://christiansbarbershop.com/api/webhook" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Receipt Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="receipt-auto-send" className="font-medium">Automatic Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically send receipts after payment
                      </p>
                    </div>
                    <Switch id="receipt-auto-send" defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                    <Textarea 
                      id="receipt-footer" 
                      defaultValue="Thank you for your business! Please come again. For inquiries, call (123) 456-7890."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="receipt-logo" className="font-medium">Show Logo on Receipt</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your business logo on receipts
                      </p>
                    </div>
                    <Switch id="receipt-logo" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* System Preferences Card */}
    <Card>
      <CardHeader>
        <CardTitle>System Preferences</CardTitle>
        <CardDescription>Configure general system settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-language">Language</Label>
          <Select defaultValue="en">
            <SelectTrigger id="system-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fil">Filipino</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-timezone">Time Zone</Label>
          <Select defaultValue="asia-manila">
            <SelectTrigger id="system-timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
              <SelectItem value="america-los_angeles">America/Los Angeles (GMT-7)</SelectItem>
              <SelectItem value="america-new_york">America/New York (GMT-4)</SelectItem>
              <SelectItem value="europe-london">Europe/London (GMT+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-date-format">Date Format</Label>
          <Select defaultValue="mm-dd-yyyy">
            <SelectTrigger id="system-date-format">
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
              <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
              <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-time-format">Time Format</Label>
          <Select defaultValue="12h">
            <SelectTrigger id="system-time-format">
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
              <SelectItem value="24h">24-hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="system-dark-mode" className="font-medium">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Use dark theme for the admin interface
            </p>
          </div>
          <Switch id="system-dark-mode" />
        </div>
      </CardContent>
    </Card>

    {/* Data Management Card */}
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Backup and restore system data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Automatic Backups</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure automatic backup schedule
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="backup-enabled" className="font-medium">
                Enable Automatic Backups
              </Label>
            </div>
            <Switch id="backup-enabled" defaultChecked />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="backup-frequency">Backup Frequency</Label>
          <Select defaultValue="daily">
            <SelectTrigger id="backup-frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>
</div>
  );
};  
