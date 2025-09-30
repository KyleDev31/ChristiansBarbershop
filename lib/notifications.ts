import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { format, addDays, isToday, isTomorrow } from 'date-fns'

export type NotificationType = 'upcoming' | 'completed' | 'cancelled' | 'reminder'

export type CreateNotificationInput = {
  userId?: string
  targetEmail?: string
  title: string
  body: string
  type: NotificationType
  data?: Record<string, any>
}

export async function createNotification(input: CreateNotificationInput) {
  const payload = {
    userId: input.userId || null,
    targetEmail: input.targetEmail || null,
    title: input.title,
    body: input.body,
    type: input.type,
    data: input.data || {},
    read: false,
    createdAt: serverTimestamp(),
  }
  await addDoc(collection(db, 'notifications'), payload)
}

// Function to create appointment reminder notifications
export async function createAppointmentReminders() {
  try {
    // Get all appointments for today and tomorrow
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    const todayStr = format(today, 'MMMM d, yyyy')
    const tomorrowStr = format(tomorrow, 'MMMM d, yyyy')
    
    // Query appointments for today and tomorrow
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('date', 'in', [todayStr, tomorrowStr])
    )
    
    const appointmentsSnap = await getDocs(appointmentsQuery)
    const appointments = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
    
    // Create reminders for each appointment
    for (const appointment of appointments) {
      const isTodayAppointment = appointment.date === todayStr
      const isTomorrowAppointment = appointment.date === tomorrowStr
      
      if (isTodayAppointment || isTomorrowAppointment) {
        const reminderType = isTodayAppointment ? 'today' : 'tomorrow'
        const timeText = appointment.time || 'your scheduled time'
        
        await createNotification({
          targetEmail: appointment.email || appointment.customerEmail,
          title: `Appointment Reminder - ${reminderType === 'today' ? 'Today' : 'Tomorrow'}`,
          body: `You have an appointment ${reminderType} at ${timeText} with ${appointment.barber} for ${appointment.serviceName}.`,
          type: 'reminder',
          data: {
            appointmentId: appointment.id,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            barber: appointment.barber,
            serviceName: appointment.serviceName
          }
        })
      }
    }
    
    console.log(`Created ${appointments.length} appointment reminders`)
  } catch (error) {
    console.error('Error creating appointment reminders:', error)
  }
}


