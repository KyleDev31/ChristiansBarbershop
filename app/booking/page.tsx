"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, ChevronLeft, Scissors } from "lucide-react"
import { format, parse, isBefore, isSameDay } from "date-fns"
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase"; 
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Stepper, Step, StepDescription, StepTitle } from "@/components/stepper"
import { toast } from "react-hot-toast"
import { getAuth } from "firebase/auth";

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM",
]

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [date, setDate] = useState<Date>()
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [barbers, setBarbers] = useState<{ id: number; name: string; specialty: string; avatar: string }[]>([])
  const [services, setServices] = useState<{ id: number; name: string; description: string; price: number; }[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [addonNote, setAddonNote] = useState(""); // <-- Add this state

  useEffect(() => {
    const serviceParam = searchParams.get("service")
    const styleParam = searchParams.get("style")
    const barberParam = searchParams.get("barber")

    if (serviceParam) {
      const serviceId = Number.parseInt(serviceParam)
      if (!isNaN(serviceId)) {
        setSelectedService(serviceId)
      } else {
        const service = services.find((s) => s.name.toLowerCase() === serviceParam.toLowerCase())
        if (service) setSelectedService(service.id)
      }
    }
    if (styleParam) setSelectedStyle(styleParam)
    if (barberParam) {
      const barberId = Number.parseInt(barberParam)
      if (!isNaN(barberId)) {
        setSelectedBarber(barberId)
      } else {
        const barber = barbers.find((b) => b.name.toLowerCase().includes(barberParam.toLowerCase()))
        if (barber) setSelectedBarber(barber.id)
      }
    }
  }, [searchParams, barbers, services])

  useEffect(() => {
    const mockBarbers = [
      { id: 1, name: "JayBoy", specialty: "Classic Cuts & Hot Towel Shaves", avatar: "/jayboy.jpg?height=100&width=100" },
      { id: 2, name: "Abel", specialty: "Fades & Beard Styling", avatar: "/abel.jpg?height=100&width=100" },
      { id: 3, name: "Noel", specialty: "Textured Cuts & Color", avatar: "/noel.jpg?height=100&width=100" },
    ]
    setBarbers(mockBarbers)

    // Load services from Firestore to keep in sync with POS
    const loadServices = async () => {
      const snap = await getDocs(collection(db, "services"))
      const data = snap.docs.map((d, idx) => {
        const s: any = d.data()
        return {
          id: idx + 1,
          name: s.name || "Service",
          description: s.description || "",
          price: typeof s.price === "number" ? s.price : parseFloat(s.price) || 0,
        }
      })
      setServices(data)
    }
    loadServices()
  }, [])

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3))
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0))

  const handleBooking = async () => {
    setIsLoading(true);
    setBookingError(null);
    try {
      // validate selected date/time are in the future
      if (!date || !selectedTime) {
        setBookingError("Please select date and time.");
        setIsLoading(false);
        return;
      }
      const parsed = parse(selectedTime, "h:mm a", new Date())
      const slotDate = new Date(date)
      slotDate.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0)
      const now = new Date()
      if (!isBefore(now, slotDate) && !isSameDay(slotDate, now)) {
        // slotDate is not after now and not a same-day future slot
      }
      if (!isBefore(now, slotDate)) {
        setBookingError("Selected time is in the past. Please choose a future time.");
        setIsLoading(false);
        return;
      }

      const selectedServiceData = services.find((s) => s.id === selectedService);
      const selectedBarberData = barbers.find((b) => b.id === selectedBarber);
      const formattedDate = date ? format(date, "MMMM d, yyyy") : "";
      const appointmentsRef = collection(db, "appointments");
      const q = query(
        appointmentsRef,
        where("barberId", "==", selectedBarberData?.id),
        where("date", "==", formattedDate),
        where("time", "==", selectedTime)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setBookingError("This barber is already booked at the selected date and time. Please choose another slot.");
        toast.error("This barber is already booked at the selected date and time.");
        setIsLoading(false);
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      const userEmail = user?.email || "";
      await addDoc(collection(db, "appointments"), {
        barberId: selectedBarberData?.id,
        barber: selectedBarberData?.name,
        serviceName: selectedServiceData?.name,
        price: selectedServiceData?.price,
        style: selectedStyle || null,
        date: formattedDate,
        time: selectedTime,
        status: "waiting",
        estimatedWait: 10,
        timestamp: serverTimestamp(),
        email: userEmail,
      });
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        router.push("/")
      }, 20000)
      const confirmationUrl =
        `/booking/confirmation?` +
        `service=${encodeURIComponent(selectedServiceData?.name || "")}` +
        `&barber=${encodeURIComponent(selectedBarberData?.name || "")}` +
        `&date=${encodeURIComponent(formattedDate)}` +
        `&time=${encodeURIComponent(selectedTime || "")}` +
        `&price=${encodeURIComponent(selectedServiceData?.price.toString() || "")}`;
      router.push(confirmationUrl);
    } catch (error) {
      setBookingError("There was an error booking your appointment. Please try again.");
      toast.error("There was an error booking your appointment. Please try again.");
      console.error("Error during booking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 0 && !selectedService) return true
    if (step === 1 && !selectedBarber) return true
    if (step === 2 && (!date || !selectedTime)) return true
    return false
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          <span className="font-semibold">Christian's Barbershop</span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Book Your Appointment</h1>
        <p className="text-muted-foreground">Select your service, barber, and preferred time</p>
      </div>

      {/* Stepper */}
      <div className="flex justify-center mb-8">
        <Stepper value={step} className="w-full max-w-2xl">
          <Step>
            <StepTitle>Service</StepTitle>
            <StepDescription>Choose a service</StepDescription>
          </Step>
          <Step>
            <StepTitle>Barber</StepTitle>
            <StepDescription>Select your barber</StepDescription>
          </Step>
          <Step>
            <StepTitle>Date & Time</StepTitle>
            <StepDescription>Pick a slot</StepDescription>
          </Step>
          <Step>
            <StepTitle>Confirm</StepTitle>
            <StepDescription>Review details</StepDescription>
          </Step>
        </Stepper>
      </div>

      {/* Success/Error Messages */}
      {showSuccess && (
        <div className="mb-6 p-4 rounded bg-green-100 text-green-800 text-center font-semibold transition-all">
          Appointment booked successfully!
        </div>
      )}
      {bookingError && (
        <div className="mb-6 p-4 rounded bg-red-100 text-red-800 text-center font-semibold transition-all">
          {bookingError}
        </div>
      )}

      {/* Main Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Service</CardTitle>
                <CardDescription>Choose the service you want to book</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStyle && (
                  <div className="mb-6 rounded-lg bg-muted p-4">
                    <h3 className="font-medium">Selected Style: {selectedStyle}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've selected a specific haircut style. Choose a service type below to continue.
                    </p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        selectedService === service.id ? "border-primary bg-muted/50" : ""
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="mt-2 font-medium">Php {service.price}</div>
                    </div>
                  ))}
                </div>
                {/* Add-ons/Note input */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-1" htmlFor="addon-note">
                    Add-ons / Note <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="addon-note"
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30"
                    rows={2}
                    placeholder="Add a note or specify add-ons (e.g. 'Include scalp massage', 'No razor', etc.)"
                    value={addonNote}
                    onChange={e => setAddonNote(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/")}>
                  Cancel
                </Button>
                <Button onClick={handleNext} disabled={isNextDisabled()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Barber</CardTitle>
                <CardDescription>Select the barber you prefer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        selectedBarber === barber.id ? "border-primary bg-muted/50" : ""
                      }`}
                      onClick={() => setSelectedBarber(barber.id)}
                    >
                      <img
                        src={barber.avatar || "/placeholder.svg"}
                        alt={barber.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{barber.name}</div>
                        <div className="text-sm text-muted-foreground">{barber.specialty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isNextDisabled()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>Choose your preferred appointment time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 font-medium">Date</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const selectedDate = new Date(date)
                            selectedDate.setHours(0, 0, 0, 0)
                            return selectedDate.getTime() < today.getTime() || date.getDay() === 0
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <div className="mb-2 font-medium">Time</div>
                    <Select onValueChange={setSelectedTime} value={selectedTime || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => {
                          // compute slot datetime using selected date
                          let disabled = false
                          if (date) {
                            try {
                              const parsed = parse(time, "h:mm a", new Date())
                              const slotDate = new Date(date)
                              slotDate.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0)
                              const now = new Date()
                              if (isSameDay(slotDate, now) && !isBefore(now, slotDate)) {
                                // slot is earlier than or equal to now on the same day -> disable
                                disabled = true
                              }
                            } catch (e) {
                              // leave enabled if parse fails
                            }
                          }
                          return (
                            <SelectItem key={time} value={time} disabled={disabled}>
                              {time}{disabled ? " — unavailable" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isNextDisabled()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Appointment</CardTitle>
                <CardDescription>Review your appointment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Service</div>
                    <div className="font-medium">{services.find((s) => s.id === selectedService)?.name || ""}</div>
                  </div>
                  {selectedStyle && (
                    <>
                      <Separator />
                      <div className="grid gap-1">
                        <div className="text-sm font-medium text-muted-foreground">Requested Style</div>
                        <div className="font-medium">{selectedStyle}</div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="grid gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Barber</div>
                    <div className="font-medium">{barbers.find((b) => b.id === selectedBarber)?.name || ""}</div>
                  </div>
                  <Separator />
                  <div className="grid gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Date & Time</div>
                    <div className="font-medium">
                      {date ? format(date, "PPP") : ""} at {selectedTime}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Price</div>
                    <div className="font-medium">Php {services.find((s) => s.id === selectedService)?.price || 0}</div>
                  </div>
                  <Separator />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleBooking} disabled={isLoading}>
                  {isLoading ? "Booking..." : "Confirm Booking"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

