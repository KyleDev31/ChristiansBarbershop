"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Scissors, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"

interface Appointment {
  id: string
  date: string
  time: string
  service: string
  barber: string
  status: string
  price: string
  location: string
  notes: string
  customer: {
    name: string
    phone: string
    email: string
  }
}

export default function AppointmentDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock appointment data - in a real app, this would be fetched from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock data for the appointment
      const mockAppointment = {
        id: id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        time: "3:00 PM",
        service: "Regular Haircut",
        barber: "John Doe",
        status: "upcoming",
        price: "₱150",
        location: "123 Main Street, Nabunturan, Davao de Oro",
        notes: "Please arrive 10 minutes before your scheduled appointment time.",
        customer: {
          name: "John Doe",
          phone: "+63 912 345 6789",
          email: "john.doe@example.com",
        },
      }

      setAppointment(mockAppointment)
      setLoading(false)
    }, 500)
  }, [id])

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <p>Loading appointment details...</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Appointment Not Found</h1>
        <p className="mb-4">Sorry, we couldn't find the appointment you're looking for.</p>
        <Button asChild>
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
        <div className="sticky top-0 z-50 bg-white shadow">
              <SiteHeader />
            </div>
      <Link href="/profile" className="flex items-center text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Profile
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Appointment Details</CardTitle>
                  <CardDescription>Appointment ID: {appointment.id}</CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === "upcoming" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{appointment.service}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Barber</p>
                      <p className="font-medium">{appointment.barber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">Christian's Barbershop</p>
                      <p className="text-sm text-muted-foreground">{appointment.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">{appointment.notes}</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{appointment.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{appointment.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{appointment.customer.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">{appointment.price}</span>
              </div>

              {appointment.status === "upcoming" && (
                <div className="flex gap-4 w-full">
                  <Button variant="outline" className="w-full">
                    Reschedule
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Cancel
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Show this at the barbershop for quick check-in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=${appointment.id}`}
                  alt="Appointment QR Code"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Scan this QR code or show it to the staff when you arrive
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`https://maps.app.goo.gl/gSPtyUGmvJB7r4cYA`} target="_blank" rel="noopener noreferrer">
                  Get Directions
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {appointment.status === "upcoming" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button variant="outline" className="w-full">
                  Call Barbershop
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
