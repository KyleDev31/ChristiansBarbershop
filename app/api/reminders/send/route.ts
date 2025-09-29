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
            console.log(`✅ Email sent successfully to ${appointment.email}`)
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
            console.log(`✅ SMS sent successfully to ${appointment.phone}`)
          } catch (smsError) {
            result.smsStatus = 'failed'
            result.error = result.error ? `${result.error}; SMS failed: ${smsError}` : `SMS failed: ${smsError}`
            console.error('SMS send failed:', smsError)
          }
        } else {
          result.smsStatus = 'no_phone'
          console.log(`⚠️ No phone number for appointment ${appointment.id}`)
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
            Hello,
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
              <strong>Phone:</strong> 09500675739<br>
              <strong>Email:</strong> christians.barbershop2011@gmail.com
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
  const message = `Hi! This is a reminder about your appointment at Christian's Barbershop tomorrow (${appointment.date}) at ${appointment.time} with ${appointment.barber} for ${appointment.serviceName}. Please arrive 10 minutes early. Call (123) 456-7890 if you need to reschedule.`
  
  // Validate phone number
  if (!appointment.phone) {
    throw new Error('No phone number provided for SMS reminder')
  }
  
  // Format phone number (ensure it starts with +)
  let phoneNumber = appointment.phone.trim()
  if (!phoneNumber.startsWith('+')) {
    // If it doesn't start with +, assume it's a US number and add +1
    if (phoneNumber.length === 10) {
      phoneNumber = '+1' + phoneNumber
    } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
      phoneNumber = '+' + phoneNumber
    } else {
      phoneNumber = '+' + phoneNumber
    }
  }
  
  console.log(`Sending SMS to: ${phoneNumber}`)
  
  // Try SMS Chef first, then fallback to other providers
  const smsChefApiKey = process.env.SMS_CHEF_API_KEY
  const smsChefSender = process.env.SMS_CHEF_SENDER || 'ChristianBarber'
  const smsChefBaseUrl = process.env.SMS_CHEF_BASE_URL || 'https://api.smschef.com'

  if (smsChefApiKey) {
    try {
      console.log('Using SMS Chef API for SMS sending')
      
      // SMS Chef API payload (adjust based on their actual API documentation)
      const payload = {
        to: phoneNumber,
        message: message,
        from: smsChefSender,
        // Add any other required fields based on SMS Chef API documentation
      }

      const res = await fetch(smsChefBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${smsChefApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('SMS Chef send failed', res.status, data)
        throw new Error(`SMS Chef error: ${res.status} ${JSON.stringify(data)}`)
      }

      console.log('SMS sent successfully via SMS Chef:', data)
      return data
    } catch (err) {
      console.error('SMS Chef SMS error:', err)
      // Don't throw here, fallback to other providers
    }
  }

  // Fallback to Infobip if SMS Chef fails or not configured
  const infoBipKey = process.env.INFOBIP_API_KEY
  const infoBipSender = process.env.INFOBIP_SENDER || process.env.TWILIO_PHONE_NUMBER?.trim() || 'ChristianBarber'
  const infoBipBase = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com'

  if (infoBipKey) {
    try {
      console.log('Using Infobip API for SMS sending')
      const payload = {
        messages: [
          {
            from: infoBipSender,
            destinations: [{ to: phoneNumber }],
            text: message
          }
        ]
      }

      // Ensure the base URL has https:// protocol
      const baseUrl = infoBipBase.startsWith('http') ? infoBipBase : `https://${infoBipBase}`
      const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${infoBipKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Infobip send failed', res.status, data)
        throw new Error(`Infobip error: ${res.status} ${JSON.stringify(data)}`)
      }

      console.log('SMS sent successfully via Infobip:', data)
      return data
    } catch (err) {
      console.error('Infobip SMS error:', err)
      // Don't throw here, fallback to Twilio
    }
  }

  // Final fallback to Twilio
  const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()
  if (!twilioFromNumber) {
    throw new Error('No SMS provider configured. Please set up SMS Chef, Infobip, or Twilio credentials.')
  }
  
  console.log('Using Twilio API for SMS sending')
  const result = await twilioClient.messages.create({
    body: message,
    from: twilioFromNumber,
    to: phoneNumber
  })
  
  console.log('SMS sent successfully via Twilio:', result.sid)
  return result
}
