"use client"

import { useState } from "react"
import { Clock, Edit, Plus, Search, Trash, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

// Define the Service interface
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  category: string;
  active: boolean;
  image: string;
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Mock data for services
  const services = [
    {
      id: 1,
      name: "Christian's Haircut + Hair Blow Dry",
      price: 120,
      duration: 30,
      description: "Classic haircut with scissors and clippers, includes styling.",
      category: "haircut",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 2,
      name: "Christian's Shave",
      price: 80,
      duration: 20,
      description: "Precision beard trimming and shaping with razor finish.",
      category: "beard",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 3,
      name: "Christian's Haircut + Shampoo",
      price: 160,
      duration: 45,
      description: "Complete haircut and beard trim package for a full refresh.",
      category: "combo",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 4,
      name: "Shave + Hot Towel",
      price: 130,
      duration: 25,
      description: "Gentle haircut service for children under 12 years old.",
      category: "haircut",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 5,
      name: "Haircut + Shampoo + Hair Blow Dry + Light Massage + Hot Towel",
      price: 270,
      duration: 60,
      description: "Professional hair coloring service with premium products.",
      category: "color",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 6,
      name: "Christian's Haircut + Hair Color",
      price: 350,
      duration: 30,
      description: "Relaxing facial treatment to cleanse and rejuvenate skin.",
      category: "facial",
      active: false,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 7,
      name: "Christian's Haircut + Hair Relax",
      price: 390,
      duration: 35,
      description: "Traditional hot towel shave with straight razor.",
      category: "beard",
      active: true,
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 8,
      name: "Christian's Haircut + Hair Bleaching + Hair Color",
      price: 550,
      duration: 20,
      description: "Relaxing scalp massage to relieve stress and tension.",
      category: "addon",
      active: false,
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  // Filter services based on search query and active tab
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && service.active
    if (activeTab === "inactive") return matchesSearch && !service.active
    if (activeTab === service.category) return matchesSearch

    return false
  })

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };
  

  return (
    <div className="container py-10 ml-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Service Management</CardTitle>
                <CardDescription>Manage your barbershop services and pricing</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Services</TabsTrigger>
              </TabsList>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                  <div className="col-span-4">Service</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <div key={service.id} className="grid grid-cols-12 p-3 text-sm border-t items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={service.image || "/placeholder.svg"}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 font-medium">₱{service.price}</div>
                      <div className="col-span-2 flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="col-span-2">
                        <span className="capitalize">{service.category}</span>
                      </div>
                      <div className="col-span-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {service.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="col-span-1 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(service)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteClick(service)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No services found matching your criteria.</div>
                )}
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredServices.length} of {services.length} services
            </div>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new service for your barbershop.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input id="name" placeholder="e.g. Premium Haircut" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="haircut">Haircut</option>
                  <option value="beard">Beard</option>
                  <option value="combo">Combo</option>
                  <option value="color">Color</option>
                  <option value="facial">Facial</option>
                  <option value="addon">Add-on</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱)</Label>
                <Input id="price" type="number" placeholder="150" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" placeholder="30" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the service..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Service Image</Label>
              <Input id="image" type="file" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="active" defaultChecked />
              <Label htmlFor="active">Active Service</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service details.</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Service Name</Label>
                  <Input id="edit-name" defaultValue={selectedService.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={selectedService.category}
                  >
                    <option value="haircut">Haircut</option>
                    <option value="beard">Beard</option>
                    <option value="combo">Combo</option>
                    <option value="color">Color</option>
                    <option value="facial">Facial</option>
                    <option value="addon">Add-on</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₱)</Label>
                  <Input id="edit-price" type="number" defaultValue={selectedService.price} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input id="edit-duration" type="number" defaultValue={selectedService.duration} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" defaultValue={selectedService.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Service Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-md overflow-hidden">
                    <img
                      src={selectedService.image || "/placeholder.svg"}
                      alt={selectedService.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Input id="edit-image" type="file" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-active" defaultChecked={selectedService.active} />
                <Label htmlFor="edit-active">Active Service</Label>
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

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedService?.name}? This action cannot be undone.
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
    </div>
  )
}
