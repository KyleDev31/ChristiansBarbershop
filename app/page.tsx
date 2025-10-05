import Link from "next/link"
import { ChevronRight, Icon, MapPin, StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import HeroSection from "@/components/hero-section"
import ServiceCard from "@/components/service-card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { collection, getDocs, query, where, limit } from "firebase/firestore"
import { Suspense } from "react"
import { db } from "@/lib/firebase"

export async function getRecentFeedbacks(limitCount: number = 3): Promise<Feedback[]> {
  try {
    const feedbacksRef = collection(db, "feedback")
    // Only featured feedbacks; sort client-side to avoid composite index requirement
    const q = query(feedbacksRef, where("featured", "==", true), limit(20))
    const querySnapshot = await getDocs(q)
    
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[]

    // Server-side diagnostic logging to help debug stale/missing data
    try {
      // eslint-disable-next-line no-console
      console.log('[getRecentFeedbacks] fetched feedback ids:', items.map(i => ({ id: i.id, name: i.name })))
    } catch (e) {}

    // Sort by date desc on client and enforce limit
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limitCount)
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return []
  }
}

// Ensure this page is dynamically rendered so Firestore changes show immediately
export const dynamic = 'force-dynamic'

export interface Feedback {
  id: string
  name: string
  rating: number
  comment: string
  date: string
  featured?: boolean
}

async function FeedbackSection() {
  const feedbacks = await getRecentFeedbacks()

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Featured Feedback</h2>
        <p className="text-muted-foreground">What our customers love the most</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id}>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  {feedback.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{feedback.name}</h3>
                  <div className="flex text-yellow-400">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-2">{feedback.comment}</p>
              <span className="text-sm text-muted-foreground">
                {new Date(feedback.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button asChild size="lg">
          <Link href="/feedback">Leave Feedback</Link>
        </Button>
      </div>
    </section>
  )
}

export default function HomePage() {
  const services = [
    {
      id: 1,
      name: "👑 Christian's Haircut w/ Blow Dry",
      price: 120,
      image: "/placeholder.svg?height=100&width=100",
      description: "Get a fresh haircut styled to perfection with a professional blow dry finish for a polished look.",
    },
    {
      id: 2,
      name: "👑 Christian's Shave",
      price: 80,
      image: "/placeholder.svg?height=100&width=100",
      description: "Experience a classic shave with precision and care, leaving your skin smooth and refreshed",
    },
    {
      id: 3,
      name: "👑 Christian's Haircut w/ Shampoo",
      price: 160,
      image: "/placeholder.svg?height=100&width=100",
      description: "Get a stylish haircut with a refreshing shampoo wash included, leaving you looking sharp",
    },
    {
      id: 4,
      name: "👑 Shave + Towel",
      price: 130,
      image: "/placeholder.svg?height=100&width=100",
      description: "Experience the ultimate grooming with our Shave + Towel service, featuring a precision shave followed by a soothing hot towel treatment for refreshed skin.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
    <div className="sticky top-0 z-50 bg-white bg-opacity-30 backdrop-blur-md  rounded-lg">
              <SiteHeader />
        </div>
      <HeroSection />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
       <section className="mb-16">
    {/* Header */}
    <div className="text-center mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
        ✨ Our Services
      </h2>
      <p className="text-gray-500 text-sm mb-4">
        Fresh cuts, sharp styles, and vibes made for you
      </p>
      <Link
        href="/services"
        className="inline-flex items-center text-sm text-primary hover:underline hover:text-primary/80 transition"
      >
        View all <ChevronRight className="h-4 w-4 ml-1" />
      </Link>
    </div>

    {/* Services Grid */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {services.map((service) => (
    <div
      key={service.id}
      className="group relative rounded-2xl border-2 border-yellow-500 bg-white p-6 
                 shadow-sm hover:shadow-lg hover:border-yellow-600 
                 transition-all duration-200 cursor-pointer"
    >
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition">
        {service.name}
      </h3>

      {/* Short Description */}
      <p className="text-sm text-gray-600 mt-2">
        {service.description}
      </p>
    </div>
  ))}
</div>

  </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">💇🏻 Our Senior Barbers</h2>
            <p className="text-gray-500 text-sm">Meet our experienced team of professional barbers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="aspect-square relative overflow-hidden">
                <img
                  src="/jayboy.jpg"
                  alt="JayBoy"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">JayBoy</h3>
                  <p className="text-muted-foreground mb-3">
                    Master Barber with 10+ years of experience specializing in classic cuts and hot towel shaves.
                  </p>
                  <div className="flex justify-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="aspect-square relative overflow-hidden">
                <img
                  src="/abel.jpg?height=300&width=300"
                  alt="Abel"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">Abel</h3>
                  <p className="text-muted-foreground mb-3">
                    Style specialist with expertise in modern fades, designs, and trending hairstyles for all ages.
                  </p>
                  <div className="flex justify-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary/40"></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="aspect-square relative overflow-hidden">
                <img
                  src="/noel.jpg"
                  alt="Noel"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">Noel</h3>
                  <p className="text-muted-foreground mb-3">
                    Beard grooming expert who specializes in precision beard shaping, styling, and maintenance.
                  </p>
                  <div className="flex justify-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary/40"></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16 rounded-lg overflow-hidden border">
          <div className="bg-background p-6 text-center">
            <div className="flex justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Find Us</h2>
              <p className="text-muted-foreground mb-1">Purok 12 Poblacion, Nabunturan, Davao de Oro</p>
              <p className="text-muted-foreground">Open 8am to 7pm, Monday to Saturday</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button asChild size="sm" variant="outline">
                <a href="https://maps.app.goo.gl/gSPtyUGmvJB7r4cYA" target="_blank" rel="noopener noreferrer">
                  Get Directions
                </a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3954.7565794177467!2d125.9655472!3d7.6014485999999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32fc03795dfccc81%3A0x3f3fd0228bd48c17!2sChristian%E2%80%99s%20Barbershop%20Est.%202011!5e0!3m2!1sen!2sph!4v1745675298591!5m2!1sen!2sph" 
              className="w-full h-[450px] border-0" 
              loading="lazy"
              title="Christian's Barbershop Location"
            >
            </iframe>
          </div>
        </section>

        <FeedbackSection />
      </main>
      <SiteFooter />
    </div>
  )
}
function FeedbackSkeleton() {
  return (
    <section className="mb-10">
      <div className="text-center mb-8">
        <div className="h-8 w-48 bg-muted rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-muted rounded mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-muted mr-4" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
