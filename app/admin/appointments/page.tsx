"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, startOfWeek, addDays, isSameDay, parse, startOfDay, endOfDay, endOfWeek } from "date-fns"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bell } from "lucide-react"

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
  const [resultOpen, setResultOpen] = useState(false)
  const [resultData, setResultData] = useState<any | null>(null)
  const [isSendingReminders, setIsSendingReminders] = useState(false)

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true)

      // Attempt to query by Timestamp (scheduledAt) for accurate day/week ranges
      const appointmentsRef = collection(db, "appointments")
      let results: any[] = []

      if (view === 'day') {
        // use a slightly expanded window (previous day -> next day) to account for timezone offsets
        const windowStart = Timestamp.fromDate(startOfDay(addDays(selectedDate, -1)))
        const windowEnd = Timestamp.fromDate(endOfDay(addDays(selectedDate, 1)))
        const qts = query(appointmentsRef, where("scheduledAt", ">=", windowStart), where("scheduledAt", "<=", windowEnd))
        const snapTs = await getDocs(qts)
        results = snapTs.docs.map(d => ({ id: d.id, ...d.data() }))

        // also fetch by string date as additional fallback
        const dateStr = format(selectedDate, "MMMM d, yyyy")
        const qstr = query(appointmentsRef, where("date", "==", dateStr))
        const snapStr = await getDocs(qstr)
        const stringResults = snapStr.docs.map(d => ({ id: d.id, ...d.data() }))

        // merge unique (id) results
        const byId = new Map<string, any>()
        results.concat(stringResults).forEach(r => byId.set(r.id, r))
        results = Array.from(byId.values())
      } else {
        // week view: expand window by one day on both ends and filter client-side
        const weekStart = startOfDay(addDays(getWeekDates(selectedDate)[0], -1))
        const weekEnd = endOfDay(addDays(getWeekDates(selectedDate)[6], 1))
        const qts = query(appointmentsRef, where("scheduledAt", ">=", Timestamp.fromDate(weekStart)), where("scheduledAt", "<=", Timestamp.fromDate(weekEnd)))
        const snapTs = await getDocs(qts)
        results = snapTs.docs.map(d => ({ id: d.id, ...d.data() }))

        // fallback: also fetch by string dates for the week and merge unique
        const datesToFetch = getWeekDates(selectedDate).map(d => format(d, "MMMM d, yyyy"))
        const qstr = query(appointmentsRef, where("date", "in", datesToFetch))
        const snapStr = await getDocs(qstr)
        const stringResults = snapStr.docs.map(d => ({ id: d.id, ...d.data() }))
        const byId = new Map<string, any>()
        results.concat(stringResults).forEach(r => byId.set(r.id, r))
        results = Array.from(byId.values())
      }

      // Normalize: derive date/time from scheduledAt when missing so UI can render correctly
      const normalized = results.map((r) => {
        const scheduled: any = r.scheduledAt
        const hasDate = !!r.date
        const hasTime = !!r.time
        let dateVal = r.date
        let timeVal = r.time
        try {
          if (!hasDate && scheduled && scheduled.toDate) {
            dateVal = format(scheduled.toDate(), "MMMM d, yyyy")
          }
          if (!hasTime && scheduled && scheduled.toDate) {
            timeVal = format(scheduled.toDate(), "h:mm a")
          }
        } catch (e) {
          // ignore formatting errors
        }
        return { ...r, date: dateVal, time: timeVal }
      })

      // Client-side filtering: keep only records that match the selected date/week in local timezone
      const filtered = normalized.filter((r) => {
        if (view === 'day') {
          const d = r.scheduledAt && r.scheduledAt.toDate ? r.scheduledAt.toDate() : (r.date ? parse(r.date, 'MMMM d, yyyy', new Date()) : null)
          if (!d) return true // keep if we can't determine
          return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate()
        } else {
          // week: check if date is within weekDates
          const d = r.scheduledAt && r.scheduledAt.toDate ? r.scheduledAt.toDate() : (r.date ? parse(r.date, 'MMMM d, yyyy', new Date()) : null)
          if (!d) return true
          return getWeekDates(selectedDate).some(wd => wd.getFullYear() === d.getFullYear() && wd.getMonth() === d.getMonth() && wd.getDate() === d.getDate())
        }
      })

      results = filtered

      // Use the filtered, normalized set for the UI
      setAppointments(results)
      setIsLoading(false)
    }
    fetchAppointments()
  }, [selectedDate, view])

  // Map appointments by date and time for quick lookup (support multiple per slot)
  const appointmentsByDateTime: Record<string, Record<string, any[]>> = {}
  appointments.forEach(appt => {
    const dateKey = appt.date
    const timeKey = appt.time
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetDate: format(addDays(new Date(), 1), 'yyyy-MM-dd')
        })
      })
      
      const result = await response.json()
      setResultData(result)
      setResultOpen(true)
    } catch (error) {
      setResultData({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send reminders'
      })
      setResultOpen(true)
    } finally {
      setIsSendingReminders(false)
    }
  }

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
        <div className="ml-auto">
          <Button 
            onClick={sendReminders}
            disabled={isSendingReminders}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            {isSendingReminders ? 'Sending...' : 'Send Tomorrow\'s Reminders'}
          </Button>
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
              const appts = appointmentsByDateTime[format(selectedDate, "MMMM d, yyyy")]?.[slot] || []
              const sorted = [...appts].sort((a, b) => (a.barber || "").localeCompare(b.barber || ""))
              return (
                <div key={slot} className={`flex items-center border-b last:border-b-0 py-3 ${sorted.length ? "bg-red-50" : ""}`}>
                  <div className="w-32 font-medium text-muted-foreground">{slot}</div>
                  {sorted.length ? (
                    <div className="flex-1 flex flex-wrap gap-2">
                      {sorted.map((appt, idx) => (
                        <div key={appt.id || idx} className="p-2 rounded-md bg-white border min-w-[220px]">
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
                  const appts = appointmentsByDateTime[format(day, "MMMM d, yyyy")]?.[slot] || []
                  const sorted = [...appts].sort((a, b) => (a.barber || "").localeCompare(b.barber || ""))
                  return (
                    <div key={day.toISOString()} className="col-span-1">
                      {sorted.length ? (
                        <div className="p-2 rounded-md bg-red-50 space-y-2">
                          {sorted.map((appt, idx) => (
                            <div key={appt.id || idx} className="p-2 rounded-md bg-white border">
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
                          ))}
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

      {/* Result dialog (pop-up) */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {resultData?.success ? 'Reminders Sent Successfully' : 'Reminder Error'}
            </DialogTitle>
            <DialogDescription>
              {resultData?.success ? (
                resultData?.total === 0 
                  ? 'No appointments found for tomorrow.' 
                  : `Processed ${resultData?.total} appointments. ${resultData?.sent} reminders sent successfully.`
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
                    <div className="text-xs text-muted-foreground mt-1">
                      Email: <span className={r.emailStatus === 'sent' ? 'text-green-600' : r.emailStatus === 'failed' ? 'text-red-600' : 'text-gray-500'}>{r.emailStatus}</span>
                      {r.email && ` (${r.email})`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SMS: <span className={r.smsStatus === 'sent' ? 'text-green-600' : r.smsStatus === 'failed' ? 'text-red-600' : 'text-gray-500'}>{r.smsStatus}</span>
                      {r.phone && ` (${r.phone})`}
                    </div>
                    {r.error && (
                      <div className="text-xs text-red-600 mt-1">{r.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {resultData?.debug && (
              <div className="mt-4 p-2 rounded bg-yellow-50 text-sm">
                <div className="font-medium">Debug info:</div>
                <div className="mt-1">Date string query: <code>{resultData.dateStr}</code></div>
                <div className="mt-1">Window query results: {resultData.windowCount} found</div>
                <div className="mt-1">Date query results: {resultData.dateCount} found</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-medium">Window docs (first 5):</div>
                    {resultData.windowDocs?.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="text-xs truncate" title={JSON.stringify(doc)}>
                        {doc.id} - {doc.barber} - {doc.serviceName}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-medium">Date docs (first 5):</div>
                    {resultData.dateDocs?.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="text-xs truncate" title={JSON.stringify(doc)}>
                        {doc.id} - {doc.barber} - {doc.serviceName}
                      </div>
                    ))}
                  </div>
                </div>
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
