import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Scissors, SprayCanIcon as Spray, CombineIcon as Comb } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Services | Christian's Barbershop",
  description: "Explore our range of professional barbering services",
}

// Mock data for services
const services = {
  haircuts: [
    {
      id: 1,
      name: "Christian's Haircut + Hair Blow Dry",
      price: 120,
      duration: "30 min",
      description: "A traditional haircut with scissors and clippers, includes styling.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
    {
      id: 2,
      name: "Christian's + Haircut + Shampoo",
      price: 160,
      duration: "45 min",
      description: "Precision fade haircut with detailed edges and styling.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
    {
      id: 3,
      name: "Christian's Haircut + Hair Color",
      price: 350,
      duration: "20 min",
      description: "Quick and clean all-over short cut with clippers.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
    {
      id: 4,
      name: "Christian's Haircut + Hair Relax",
      price: 390,
      duration: "30 min",
      description: "Haircut service for children under 12 years old.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
  ],
  beardAndShave: [
    {
      id: 5,
      name: "Christian's Shave",
      price: 80,
      duration: "20 min",
      description: "Precise beard trimming and shaping to maintain your style.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
    {
      id: 6,
      name: "Shave + Hot Towel",
      price: 130,
      duration: "30 min",
      description: "Traditional hot towel straight razor shave with moisturizing treatment.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Scissors,
    },
  ],
  packages: [
    {
      id: 11,
      name: "Haircut + Shampoo + Hair Blow Dry + Light Massage + Hot Towel",
      price: 270,
      duration: "75 min",
      description: "Haircut, beard trim, and facial treatment for the complete experience.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Comb,
    },
    {
      id: 12,
      name: "Christian's Haircut + Hair Bleaching + Hair Color",
      price: 550,
      duration: "60 min",
      description: "Haircuts for father and son in one appointment.",
      image: "/placeholder.svg?height=200&width=300",
      icon: Comb,
    },
  ],
}

export default function ServicesPage() {
  return (
    <div className="container py-10 px-4 sm:px-8">
      <SiteHeader/>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Our Services</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional barbering services tailored to your style and needs
        </p>
      </div>

      <Tabs defaultValue="haircuts" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="haircuts">Haircuts</TabsTrigger>
            <TabsTrigger value="beardAndShave">Beard & Shave</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
          </TabsList>
        </div>

        {Object.entries(services).map(([category, items]) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready for a fresh look?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Book your appointment today and experience the best barbering service in town.
        </p>
        <Button asChild size="lg">
          <Link href="/booking">Book an Appointment</Link>
        </Button>
      </div>
    </div>
  )
}

interface ServiceProps {
  service: {
    id: number
    name: string
    price: number
    duration: string
    description: string
    image: string
    icon: React.ElementType
  }
}

function ServiceCard({ service }: ServiceProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full border border-gray-200 shadow-sm transition-transform hover:scale-[1.025] hover:shadow-lg">
      <div className="aspect-[4/3] relative bg-gray-50">
        <img
          src={service.image || "/placeholder.svg"}
          alt={service.name}
          className="object-cover w-full h-full rounded-t-md"
          style={{ maxHeight: 160 }}
        />
      </div>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
          <service.icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow px-4 pb-0 pt-0">
        <p className="text-muted-foreground text-sm line-clamp-2">{service.description}</p>
        <div className="flex justify-between items-center mt-3">
          <p className="font-bold text-base text-primary">₱{service.price}</p>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-2">
      </CardFooter>
    </Card>
  )
}
