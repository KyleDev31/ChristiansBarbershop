"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, startOfWeek, addDays, isSameDay, parse, startOfDay, endOfDay, endOfWeek, isValid } from "date-fns"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bell } from "lucide-react"

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
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
  const [resultOpen, setResultOpen] = useState(false)
  const [resultData, setResultData] = useState<any | null>(null)
  const [isSendingReminders, setIsSendingReminders] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchAppointments = async () => {
      setIsLoading(true)
      try {
        const appointmentsRef = collection(db, "appointments")
        let results: any[] = []

        if (view === 'day') {
          const windowStart = Timestamp.fromDate(startOfDay(addDays(selectedDate, -1)))
          const windowEnd = Timestamp.fromDate(endOfDay(addDays(selectedDate, 1)))
          const qts = query(appointmentsRef, where("scheduledAt", ">=", windowStart), where("scheduledAt", "<=", windowEnd))
          const snapTs = await getDocs(qts)
          results = snapTs.docs.map(d => ({ id: d.id, ...d.data() }))

          const dateStr = format(selectedDate, "MMMM d, yyyy")
          const qstr = query(appointmentsRef, where("date", "==", dateStr))
          const snapStr = await getDocs(qstr)
          const stringResults = snapStr.docs.map(d => ({ id: d.id, ...d.data() }))

          const byId = new Map<string, any>()
          results.concat(stringResults).forEach(r => byId.set(r.id, r))
          results = Array.from(byId.values())
        } else {
          const weekDates = getWeekDates(selectedDate)
          const weekStart = startOfDay(addDays(weekDates[0], -1))
          const weekEnd = endOfDay(addDays(weekDates[6], 1))

          const qts = query(appointmentsRef, where("scheduledAt", ">=", Timestamp.fromDate(weekStart)), where("scheduledAt", "<=", Timestamp.fromDate(weekEnd)))
          const snapTs = await getDocs(qts)
          results = snapTs.docs.map(d => ({ id: d.id, ...d.data() }))

          const datesToFetch = weekDates.map(d => format(d, "MMMM d, yyyy"))
          const qstr = query(appointmentsRef, where("date", "in", datesToFetch))
          const snapStr = await getDocs(qstr)
          const stringResults = snapStr.docs.map(d => ({ id: d.id, ...d.data() }))

          const byId = new Map<string, any>()
          results.concat(stringResults).forEach(r => byId.set(r.id, r))
          results = Array.from(byId.values())
        }

        const normalized = results.map((r) => {
          const scheduled: any = r.scheduledAt
          let dateVal = r.date
          let timeVal = r.time
          try {
            if (!dateVal && scheduled && scheduled.toDate) dateVal = format(scheduled.toDate(), "MMMM d, yyyy")
            if (!timeVal && scheduled && scheduled.toDate) timeVal = format(scheduled.toDate(), "h:mm a")
          } catch (e) {}
          return { ...r, date: dateVal, time: timeVal }
        })

        const filtered = normalized.filter((r) => {
          const d = r.scheduledAt && r.scheduledAt.toDate ? r.scheduledAt.toDate() : (r.date ? parse(r.date, 'MMMM d, yyyy', new Date()) : null)
          if (!d) return true
          if (view === 'day') return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate()
          return getWeekDates(selectedDate).some(wd => wd.getFullYear() === d.getFullYear() && wd.getMonth() === d.getMonth() && wd.getDate() === d.getDate())
        })

        if (!mounted) return
        setAppointments(filtered)
      } catch (err) {
        console.error('fetchAppointments error', err)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    fetchAppointments()
    return () => { mounted = false }
  }, [selectedDate, view])

  const normalizeDateKey = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null
    try {
      const d = parse(dateStr, 'MMMM d, yyyy', new Date())
      if (isValid(d)) return format(d, 'MMMM d, yyyy')
    } catch {}
    return dateStr
  }

  const normalizeTimeKey = (timeStr: string | undefined): string | null => {
    if (!timeStr) return null
    const candidates = ['h:mm a', 'h:mma', 'h a', 'H:mm']
    for (const fmt of candidates) {
      try {
        const dt = parse(timeStr.replace(/\s+/g, ' ').trim().toUpperCase(), fmt.toUpperCase(), new Date())
        if (isValid(dt)) {
          return format(dt, 'h:mm a')
        }
      } catch {}
    }
    // Fallback: best-effort uppercasing AM/PM spacing
    return timeStr.toUpperCase().replace(/AM|PM/, (m) => ` ${m}` as any).replace(/\s+/, ' ').trim()
  }

  const appointmentsByDateTime: Record<string, Record<string, any[]>> = {}
  appointments.forEach(appt => {
    const dateKey = normalizeDateKey(appt.date)
    const timeKey = normalizeTimeKey(appt.time)
    if (!dateKey || !timeKey) return
    if (!appointmentsByDateTime[dateKey]) appointmentsByDateTime[dateKey] = {}
    if (!appointmentsByDateTime[dateKey][timeKey]) appointmentsByDateTime[dateKey][timeKey] = []
    appointmentsByDateTime[dateKey][timeKey].push(appt)
  })

  const weekDates = getWeekDates(selectedDate)

  const sendReminders = async () => {
    setIsSendingReminders(true)
    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: format(addDays(new Date(), 1), 'yyyy-MM-dd') })
      })
      const result = await response.json()
      setResultData(result)
      setResultOpen(true)
    } catch (error) {
      setResultData({ ok: false, error: error instanceof Error ? error.message : 'Failed to send reminders' })
      setResultOpen(true)
    } finally {
      setIsSendingReminders(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Appointments</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="border rounded px-2 py-1" onClick={() => setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000))}>&lt;</button>
          <button className="border rounded px-2 py-1" onClick={() => setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000))}>&gt;</button>
        </div>

        <div className="font-semibold text-base sm:text-lg">
          {view === 'day'
            ? `${format(selectedDate, "MMMM d, yyyy")} `
            : `${format(weekDates[0], "MMM d")} - ${format(weekDates[6], "MMM d, yyyy")}`}
          <span className="ml-2 text-xs sm:text-sm text-muted-foreground">{view === 'day' ? format(selectedDate, "EEEE") : 'Week'}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${view === 'day' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setView('day')}>Day</button>
            <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setView('week')}>Week</button>
          </div>
          <div className="w-full sm:w-auto">
            <Button onClick={sendReminders} disabled={isSendingReminders} className="flex items-center gap-2 w-full sm:w-auto">
              <Bell className="w-4 h-4" />
              {isSendingReminders ? 'Sending...' : 'Send Tomorrow\'s Reminders'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <div className="text-lg font-medium text-muted-foreground">Loading appointments...</div>
          </div>
        ) : view === 'day' ? (
          <div>
            {timeSlots.map((slot) => {
              const appts = appointmentsByDateTime[format(selectedDate, "MMMM d, yyyy")]?.[slot] || []
              const sorted = [...appts].sort((a, b) => (a.barber || "").localeCompare(b.barber || ""))
              return (
                <div key={slot} className={`flex flex-col sm:flex-row items-start sm:items-center border-b last:border-b-0 py-3 ${sorted.length ? "bg-red-50" : ""}`}>
                  <div className="w-full sm:w-32 font-medium text-muted-foreground mb-2 sm:mb-0">{slot}</div>
                  {sorted.length ? (
                    <div className="flex-1 flex flex-wrap gap-2">
                      {sorted.map((appt, idx) => (
                        <div key={appt.id || idx} className="p-2 rounded-md bg-white border min-w-[160px] sm:min-w-[220px]">
                          <div className="font-semibold truncate" title={appt.name || appt.customer || appt.email}>{appt.name || appt.customer || appt.email}</div>
                          {appt.email && (<div className="text-xs text-muted-foreground truncate" title={appt.email}>{appt.email}</div>)}
                          <div className="text-xs">{appt.serviceName || appt.service}</div>
                          <div className="text-xs text-muted-foreground">Barber: {appt.barber}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 text-muted-foreground">Available</div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <>
            {/* Mobile stacked week view (small screens) */}
            <div className="md:hidden space-y-3">
              {weekDates.map((day) => (
                <Card key={day.toISOString()} className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium">{format(day, "EEEE")}</div>
                      <div className="text-xs text-muted-foreground">{format(day, "MMMM d, yyyy")}</div>
                    </div>
                    <div className="text-sm rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 text-primary font-semibold">{format(day, "d")}</div>
                  </div>

                  <div className="space-y-2">
                    {timeSlots.map((slot) => {
                      const appts = appointmentsByDateTime[format(day, "MMMM d, yyyy")]?.[slot] || []
                      return (
                        <div key={slot} className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground w-24">{slot}</div>
                          <div className="flex-1 ml-3">
                            {appts.length ? (
                              <div className="space-y-2">
                                {appts.map((appt, idx) => (
                                  <div key={appt.id || idx} className="p-3 rounded-lg bg-white border shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-sm truncate" title={appt.name || appt.customer || appt.email}>{appt.name || appt.customer || appt.email}</div>
                                        <div className="text-xs text-muted-foreground truncate">{appt.serviceName || appt.service}</div>
                                      </div>
                                      <div className="ml-3 text-xs text-muted-foreground">{appt.barber}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Available</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop/tablet week grid (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="col-span-1"></div>
                  {weekDates.map(day => (
                    <div key={day.toISOString()} className="col-span-1 text-center font-medium">
                      <div>{format(day, "EEE")}</div>
                      <div className="text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>

                {timeSlots.map(slot => (
                  <div key={slot} className="grid grid-cols-8 gap-2 border-b last:border-b-0 py-1">
                    <div className="col-span-1 text-sm text-muted-foreground pt-2">{slot}</div>
                    {weekDates.map(day => {
                      const appts = appointmentsByDateTime[format(day, "MMMM d, yyyy")]?.[slot] || []
                      const sorted = [...appts].sort((a, b) => (a.barber || "").localeCompare(b.barber || ""))
                      return (
                        <div key={day.toISOString()} className="col-span-1">
                          {sorted.length ? (
                            <div className="p-2 rounded-md bg-red-50 space-y-2">
                              {sorted.map((appt, idx) => (
                                <div key={appt.id || idx} className="p-2 rounded-md bg-white border">
                                  <div className="font-semibold truncate" title={appt.name || appt.customer || appt.email}>{appt.name || appt.customer || appt.email}</div>
                                  {appt.email && (<div className="text-xs text-muted-foreground truncate" title={appt.email}>{appt.email}</div>)}
                                  <div className="text-xs">{appt.serviceName || appt.service}</div>
                                  <div className="text-xs text-muted-foreground">Barber: {appt.barber}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-10 border border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">Available</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Result dialog (pop-up) */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{resultData?.success ? 'Reminders Sent Successfully' : 'Reminder Error'}</DialogTitle>
            <DialogDescription>
              {resultData?.success ? (
                resultData?.total === 0 ? 'No appointments found for tomorrow.' : `Processed ${resultData?.total} appointments. ${resultData?.sent} reminders sent successfully.`
              ) : (
                resultData?.error || 'An error occurred while sending reminders.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {resultData?.appointments && Array.isArray(resultData.appointments) && (
              <div className="space-y-2 max-h-60 overflow-auto">
                <h4 className="font-medium text-sm">Appointment Details:</h4>
                {resultData.appointments.map((r: any) => (
                  <div key={r.id} className="p-3 border rounded bg-gray-50">
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Email: <span className={r.emailStatus === 'sent' ? 'text-green-600' : r.emailStatus === 'failed' ? 'text-red-600' : 'text-gray-500'}>{r.emailStatus}</span>{r.email && ` (${r.email})`}</div>
                    {/* SMS removed: only email and notifications now */}
                    {r.error && (<div className="text-xs text-red-600 mt-1">{r.error}</div>)}
                  </div>
                ))}
              </div>
            )}

          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setResultOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}