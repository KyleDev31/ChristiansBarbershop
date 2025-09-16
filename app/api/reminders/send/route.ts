import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'
import nodemailer from 'nodemailer'
import twilio from 'twilio'

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface Appointment {
  id: string
  email: string
  phone?: string
  name: string
  customerName: string
  barber: string
  serviceName: string
  date: string
  time: string
  scheduledAt?: Timestamp
}

export async function POST(request: NextRequest) {
  try {
    const { targetDate } = await request.json()
    
    // If no target date provided, default to tomorrow
    const tomorrow = addDays(new Date(), 1)
    const searchDate = targetDate ? new Date(targetDate) : tomorrow
    
    console.log('Searching for appointments on:', format(searchDate, 'MMMM d, yyyy'))
    
    // Query appointments for the target date
    const appointmentsRef = collection(db, 'appointments')
    
    // Query by timestamp range (more reliable)
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay(searchDate))
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay(searchDate))
    
    const timestampQuery = query(
      appointmentsRef,
      where('scheduledAt', '>=', startOfDayTimestamp),
      where('scheduledAt', '<=', endOfDayTimestamp)
    )
    
    // Also query by string date (fallback)
    const dateString = format(searchDate, 'MMMM d, yyyy')
    const dateQuery = query(
      appointmentsRef,
      where('date', '==', dateString)
    )
    
    const [timestampSnapshot, dateSnapshot] = await Promise.all([
      getDocs(timestampQuery),
      getDocs(dateQuery)
    ])
    
    // Combine results and remove duplicates
    const appointmentsMap = new Map<string, Appointment>()
    
    timestampSnapshot.docs.forEach(doc => {
      const data = doc.data() as Appointment
      appointmentsMap.set(doc.id, { ...data, id: doc.id })
    })
    
    dateSnapshot.docs.forEach(doc => {
      const data = doc.data() as Appointment
      if (!appointmentsMap.has(doc.id)) {
        appointmentsMap.set(doc.id, { ...data, id: doc.id })
      }
    })
    
    const appointments = Array.from(appointmentsMap.values())
    
    console.log(`Found ${appointments.length} appointments for ${format(searchDate, 'MMMM d, yyyy')}`)
    
    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments found for the target date',
        appointments: [],
        sent: 0,
        total: 0
      })
    }
    
    // Send reminders
    const results = []
    let sentCount = 0
    
    for (const appointment of appointments) {
      const result = {
        id: appointment.id,
        name: appointment.name || appointment.customerName,
        email: appointment.email,
        phone: appointment.phone,
        emailStatus: 'not_sent',
        smsStatus: 'not_sent',
        error: null as string | null
      }
      
      try {
        // Send email reminder
        if (appointment.email) {
          try {
            await sendEmailReminder(appointment)
            result.emailStatus = 'sent'
            sentCount++
          } catch (emailError) {
            result.emailStatus = 'failed'
            result.error = `Email failed: ${emailError}`
            console.error('Email send failed:', emailError)
          }
        }
        
        // Send SMS reminder
        if (appointment.phone) {
          try {
            await sendSMSReminder(appointment)
            result.smsStatus = 'sent'
            if (result.emailStatus !== 'sent') sentCount++
          } catch (smsError) {
            result.smsStatus = 'failed'
            result.error = result.error ? `${result.error}; SMS failed: ${smsError}` : `SMS failed: ${smsError}`
            console.error('SMS send failed:', smsError)
          }
        }
        
      } catch (error) {
        result.error = `General error: ${error}`
        console.error('Reminder send failed for appointment:', appointment.id, error)
      }
      
      results.push(result)
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${appointments.length} appointments`,
      appointments: results,
      sent: sentCount,
      total: appointments.length,
      targetDate: format(searchDate, 'MMMM d, yyyy')
    })
    
  } catch (error) {
    console.error('Reminder API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      appointments: [],
      sent: 0,
      total: 0
    }, { status: 500 })
  }
}

async function sendEmailReminder(appointment: Appointment) {
  const emailContent = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: `Appointment Reminder - Christian's Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a1a1a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Christian's Barbershop</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Established Since 2011</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Reminder</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hello ${appointment.name || appointment.customerName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder about your upcoming appointment at Christian's Barbershop.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Appointment Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${appointment.date}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Time:</strong> ${appointment.time}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Service:</strong> ${appointment.serviceName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Barber:</strong> ${appointment.barber}</p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us as soon as possible.
          </p>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-size: 14px;">
              <strong>Location:</strong> Poblacion Nabunturan, Davao de Oro<br>
              <strong>Phone:</strong> (123) 456-7890<br>
              <strong>Email:</strong> info@christiansbarbershop.com
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Thank you for choosing Christian's Barbershop. We look forward to seeing you!
          </p>
        </div>
        
        <div style="background-color: #1a1a1a; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Christian's Barbershop. All rights reserved.</p>
        </div>
      </div>
    `
  }
  
  await emailTransporter.sendMail(emailContent)
}

async function sendSMSReminder(appointment: Appointment) {
  const message = `Hi ${appointment.name || appointment.customerName}! This is a reminder about your appointment at Christian's Barbershop tomorrow (${appointment.date}) at ${appointment.time} with ${appointment.barber} for ${appointment.serviceName}. Please arrive 10 minutes early. Call (123) 456-7890 if you need to reschedule.`
  
  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: appointment.phone!
  })
}
