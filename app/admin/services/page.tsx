"use client"

import { useState, useEffect } from "react"
import { Clock, Edit, Plus, Search, Trash, X, Scissors } from "lucide-react"
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
import { toast } from "sonner"

// Firestore imports
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"

// Define the Service interface
interface Service {
  id: string;
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
  const defaultEditForm = { name: "", price: "", description: "", category: "haircut" }
  const [editForm, setEditForm] = useState<{ name: string; price: string; description: string; category: string }>(defaultEditForm)
  const [services, setServices] = useState<Service[]>([])

  // Add Service form state
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    description: "",
    category: "haircut",
    image: "",
  })

  // Fetch services from Firestore
  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "services"))
      const data: Service[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[]
      setServices(data)
    }
    fetchServices()
  }, [])

  // Filter services based on search query and active tab
  const filteredServices = services.filter((service) => {
    const name = service.name ?? "";
    const description = service.description ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && service.active
    if (activeTab === "inactive") return matchesSearch && !service.active
    if (activeTab === service.category) return matchesSearch

    return false
  })

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    // populate edit form with service values
    setEditForm({
      name: service.name || "",
      price: String(service.price || ""),
      description: service.description || "",
      category: service.category || "haircut",
    })
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  // Add Service to Firestore
  const handleAddService = async () => {
    try {
      const docRef = await addDoc(collection(db, "services"), {
        name: newService.name,
        price: Number(newService.price),
        duration: 30, // Default duration to 30 minutes
        description: newService.description,
        category: newService.category,
        active: true, // Default new services to active
        image: newService.image,
      })
      setServices([
        ...services,
        {
          id: docRef.id,
          name: newService.name,
          price: Number(newService.price),
          duration: 30, // Default duration to 30 minutes
          description: newService.description,
          category: newService.category,
          active: true, // Default new services to active
          image: newService.image,
        },
      ])
      setIsAddDialogOpen(false)
      setNewService({
        name: "",
        price: "",
        description: "",
        category: "haircut",
        image: "",
      })
      toast.success("Service added successfully!")
    } catch (error) {
      toast.error("Failed to add service. Please try again.")
    }
  }

  const handleDeleteService = async () => {
    if (!selectedService) return;
    await deleteDoc(doc(db, "services", selectedService.id));
    setServices(services.filter((s) => s.id !== selectedService.id));
    setIsDeleteDialogOpen(false);
    setSelectedService(null);
  };

  // Save edited service to Firestore and update local state
  const handleSaveEditedService = async () => {
    if (!selectedService || !editForm) return;
    try {
      const serviceRef = doc(db, "services", selectedService.id);
      const updated = {
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description,
        category: editForm.category,
      }
      await updateDoc(serviceRef, updated)

      setServices(prev => prev.map(s => s.id === selectedService.id ? { ...s, ...updated } as Service : s))
      setIsEditDialogOpen(false)
      setSelectedService(null)
      setEditForm(defaultEditForm)
      toast.success("Service updated")
    } catch (error) {
      console.error("Failed to update service:", error)
      toast.error("Failed to update service. Please try again.")
    }
  }

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
                  <div className="col-span-5">Service</div>
                  <div className="col-span-3">Price</div>
                  <div className="col-span-3">Category</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <div key={service.id} className="grid grid-cols-12 p-3 text-sm border-t items-center">
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 border">
                            <Scissors className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 font-medium">₱{service.price}</div>
                      <div className="col-span-3">
                        <span className="capitalize">{service.category}</span>
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
                <Input
                  id="name"
                  placeholder="e.g. Premium Haircut"
                  value={newService.name}
                  onChange={e => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newService.category}
                  onChange={e => setNewService({ ...newService, category: e.target.value })}
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
                <Input
                  id="price"
                  type="number"
                  placeholder="150"
                  value={newService.price}
                  onChange={e => setNewService({ ...newService, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newService.category}
                  onChange={e => setNewService({ ...newService, category: e.target.value })}
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the service..."
                value={newService.description}
                onChange={e => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Service Image URL</Label>
              <Input
                id="image"
                placeholder="Paste image URL or leave blank"
                value={newService.image}
                onChange={e => setNewService({ ...newService, image: e.target.value })}
              />
            </div>
            {/* Status is no longer editable from this page */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={!newService.name || !newService.price}>
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setSelectedService(null)
          setEditForm(defaultEditForm)
        }
      }}>
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
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₱)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>  
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedService} disabled={!editForm.name || !editForm.price}>
              Save Changes
            </Button>
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
            <Button variant="destructive" onClick={handleDeleteService}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
