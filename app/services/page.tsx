"use client"
import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Scissors, SprayCanIcon as Spray, CombineIcon as Comb, Zap, Sparkles, Crown, Star } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import AuthGuard from "@/components/AuthGuard"

// Firestore imports
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

interface Service {
  id: string
  name: string
  price: number
  duration: string | number
  description: string
  image: string
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  haircut: "Haircuts",
  beard: "Beard & Shave",
  combo: "Packages",
  color: "Color",
  facial: "Facial",
  addon: "Add-ons",
}

const CATEGORY_TABS = [
  { value: "haircut", label: "Haircuts" },
  { value: "beard", label: "Beard & Shave" },
  { value: "combo", label: "Packages" },
  // Add more categories if needed
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "services"))
      const data: Service[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[]
      setServices(data)
      setLoading(false)
    }
    fetchServices()
  }, [])

  // Group services by category
  const grouped: Record<string, Service[]> = {}
  services.forEach(service => {
    const cat = service.category || "other"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(service)
  })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-gray-900">Our Services</h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Professional barbering services tailored to your style and needs
            </p>
          </div>

          <Tabs defaultValue="haircut" className="w-full">
            <div className="flex justify-center mb-6 sm:mb-10">
              <div className="w-full max-w-3xl">
                {/* Make tabs horizontally scrollable on small screens */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <TabsList className="inline-flex gap-2 px-4 sm:px-0 bg-white shadow-sm rounded-lg">
                    {CATEGORY_TABS.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap px-4 py-2 sm:px-6 sm:py-3 font-medium">{tab.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
            </div>

            {CATEGORY_TABS.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                {loading ? (
                  <div className="text-center py-10 text-muted-foreground">Loading...</div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
                    {(grouped[tab.value] || []).length > 0 ? (
                      grouped[tab.value].map(service => (
                        <ServiceCard key={service.id} service={service} />
                      ))
                    ) : (
                      <div className="col-span-full text-center text-gray-500 py-12">
                        <div className="text-5xl sm:text-6xl mb-4">✂️</div>
                        <p className="text-base sm:text-lg">No services found in this category.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-12 sm:mt-20 text-center bg-white rounded-2xl p-6 sm:p-8 shadow-sm border">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">Ready for a fresh look?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Book your appointment today and experience the best barbering service in town.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-semibold rounded-md">
                <Link href="/booking">Book an Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

interface ServiceProps {
  service: Service
}

function ServiceCard({ service }: ServiceProps) {
  // Enhanced icon mapping with more specific icons
  const iconMap: Record<string, React.ElementType> = {
    haircut: Scissors,
    beard: Crown,
    combo: Star,
    color: Sparkles,
    facial: Zap,
    addon: Comb,
  }
  const Icon = iconMap[service.category] || Scissors

  // Color mapping for different categories
  const colorMap: Record<string, string> = {
    haircut: "bg-blue-100 text-blue-600",
    beard: "bg-amber-100 text-amber-600", 
    combo: "bg-purple-100 text-purple-600",
    color: "bg-pink-100 text-pink-600",
    facial: "bg-green-100 text-green-600",
    addon: "bg-gray-100 text-gray-600",
  }
  const iconColor = colorMap[service.category] || "bg-gray-100 text-gray-600"

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-gray-200 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white w-full max-w-xs sm:max-w-sm">
      <CardHeader className="pb-3 pt-5 px-4 sm:px-6 text-center">
        <div className="flex justify-center mb-3">
          <div className={`p-3 sm:p-4 rounded-full ${iconColor} transition-transform hover:scale-110`}>
            <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        </div>
        <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{service.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow px-4 sm:px-6 pb-3 pt-0 text-center">
        <p className="text-gray-600 text-sm sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-3">{service.description}</p>
        <div className="flex justify-center items-center">
          <span className="text-xl sm:text-2xl font-bold text-yellow-600">₱{service.price}</span>
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-6 pb-4 pt-0">
      </CardFooter>
    </Card>
  )
}
