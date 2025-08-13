"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, startOfWeek, addDays, isSameDay, parse } from "date-fns"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM",
]

function getWeekDates(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export default function AdminAppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'day' | 'week'>('day')

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true)
      let datesToFetch: string[] = []
      if (view === 'day') {
        datesToFetch = [format(selectedDate, "MMMM d, yyyy")]
      } else {
        datesToFetch = getWeekDates(selectedDate).map(d => format(d, "MMMM d, yyyy"))
      }
      const appointmentsRef = collection(db, "appointments")
      const q = query(
        appointmentsRef,
        where("date", "in", datesToFetch)
      )
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAppointments(data)
      setIsLoading(false)
    }
    fetchAppointments()
  }, [selectedDate, view])

  // Map appointments by date and time for quick lookup
  const appointmentsByDateTime: Record<string, Record<string, any>> = {}
  appointments.forEach(appt => {
    if (!appointmentsByDateTime[appt.date]) appointmentsByDateTime[appt.date] = {}
    appointmentsByDateTime[appt.date][appt.time] = appt
  })

  const weekDates = getWeekDates(selectedDate)

  return (
    <div className="container py-10 ml-4">
      <h1 className="text-3xl font-bold mb-6">Appointments</h1>
      <div className="mb-4 flex items-center gap-4">
        <button
          className="border rounded px-2 py-1"
          onClick={() => setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000))}
        >
          &lt;
        </button>
        <div className="font-semibold text-lg">
          {view === 'day'
            ? `${format(selectedDate, "MMMM d, yyyy")} `
            : `${format(weekDates[0], "MMM d")} - ${format(weekDates[6], "MMM d, yyyy")}`}
          <span className="ml-2 text-sm text-muted-foreground">{view === 'day' ? format(selectedDate, "EEEE") : 'Week'}</span>
            </div>
        <button
          className="border rounded px-2 py-1"
          onClick={() => setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000))}
              >
          &gt;
        </button>
        <div className="ml-4 flex gap-2">
          <button
            className={`px-3 py-1 rounded ${view === 'day' ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={() => setView('day')}
          >Day</button>
          <button
            className={`px-3 py-1 rounded ${view === 'week' ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={() => setView('week')}
          >Week</button>
              </div>
            </div>
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <div className="text-lg font-medium text-muted-foreground">Loading appointments...</div>
          </div>
        ) : view === 'day' ? (
          <div>
            {timeSlots.map((slot) => {
              const appt = appointmentsByDateTime[format(selectedDate, "MMMM d, yyyy")]?.[slot]
                return (
                <div key={slot} className={`flex items-center border-b last:border-b-0 py-3 ${appt ? "bg-red-50" : ""}`}>
                  <div className="w-32 font-medium text-muted-foreground">{slot}</div>
                  {appt ? (
                    <div className="flex-1">
                      <div className="font-semibold truncate" title={appt.name || appt.customer || appt.email}>
                        {appt.name || appt.customer || appt.email}
                            </div>
                      {appt.email && (
                        <div className="text-xs text-muted-foreground truncate" title={appt.email}>
                          {appt.email}
                        </div>
                      )}
                      <div className="text-xs">{appt.serviceName || appt.service}</div>
                      <div className="text-xs text-muted-foreground">Barber: {appt.barber}</div>
                    </div>
                  ) : (
                    <div className="flex-1 text-muted-foreground">Available</div>
                  )}
                  {appt && (
                    <div className="text-right text-sm min-w-[60px]">{appt.estimatedWait ? `${appt.estimatedWait} min` : ""}</div>
                  )}
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="min-w-[900px]">
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="col-span-1"></div>
              {weekDates.map(day => (
                <div key={day.toISOString()} className="col-span-1 text-center font-medium">
                      <div>{format(day, "EEE")}</div>
                  <div className="text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto">
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>
            {timeSlots.map(slot => (
              <div key={slot} className="grid grid-cols-8 gap-2 border-b last:border-b-0 py-1">
                <div className="col-span-1 text-sm text-muted-foreground pt-2">{slot}</div>
                {weekDates.map(day => {
                  const appt = appointmentsByDateTime[format(day, "MMMM d, yyyy")]?.[slot]
                      return (
                    <div key={day.toISOString()} className="col-span-1">
                      {appt ? (
                        <div className="p-2 rounded-md bg-red-50">
                          <div className="font-semibold truncate" title={appt.name || appt.customer || appt.email}>
                            {appt.name || appt.customer || appt.email}
                          </div>
                          {appt.email && (
                            <div className="text-xs text-muted-foreground truncate" title={appt.email}>
                              {appt.email}
                              </div>
                          )}
                          <div className="text-xs">{appt.serviceName || appt.service}</div>
                          <div className="text-xs text-muted-foreground">Barber: {appt.barber}</div>
                        </div>
                          ) : (
                        <div className="h-10 border border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">
                          Available
                        </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
        )}
            </div>
    </div>
  )
}
