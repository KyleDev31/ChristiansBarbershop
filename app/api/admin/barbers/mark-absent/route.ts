import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, Timestamp, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { format, startOfDay, endOfDay } from 'date-fns'
import nodemailer from 'nodemailer'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { barber, targetDate, adminEmail } = await request.json()
    if (!barber) return NextResponse.json({ success: false, error: 'Missing barber' }, { status: 400 })

    const date = targetDate ? new Date(targetDate) : new Date()
    const start = Timestamp.fromDate(startOfDay(date))
    const end = Timestamp.fromDate(endOfDay(date))
    const dateString = format(date, 'MMMM d, yyyy')

    const appointmentsRef = collection(db, 'appointments')

    // Avoid composite query combining equality on 'barber' with range on 'scheduledAt'
    // because Firestore requires a composite index for that. Instead query by the
    // date window and/or date string and filter by barber in code.
    const qts = query(appointmentsRef, where('scheduledAt', '>=', start), where('scheduledAt', '<=', end))
    const qstr = query(appointmentsRef, where('date', '==', dateString))

    const [snapTs, snapStr] = await Promise.all([getDocs(qts), getDocs(qstr)])

    const map = new Map<string, any>()
    snapTs.docs.forEach(d => {
      const data = d.data()
      if (data?.barber === barber) map.set(d.id, { id: d.id, ref: d.ref, data })
    })
    snapStr.docs.forEach(d => {
      const data = d.data()
      if (data?.barber === barber && !map.has(d.id)) map.set(d.id, { id: d.id, ref: d.ref, data })
    })

    const all = Array.from(map.values())

    // Filter out already completed/cancelled
    const toCancel = all.filter(a => {
      const st = a.data?.status
      return st !== 'cancelled' && st !== 'completed'
    })

    if (toCancel.length === 0) {
      return NextResponse.json({ success: true, message: 'No appointments to cancel', totalFound: all.length, cancelled: 0 })
    }

    // Batch updates (Firestore limits 500 per batch)
    const chunkSize = 450
    let cancelled = 0
    const batchErrors: any[] = []
    for (let i = 0; i < toCancel.length; i += chunkSize) {
      const batch = writeBatch(db)
      const chunk = toCancel.slice(i, i + chunkSize)
      for (const ap of chunk) {
        batch.update(ap.ref, { status: 'cancelled', cancelledAt: serverTimestamp(), cancellationReason: 'Barber absent', cancelledBy: adminEmail || null })
      }
      try {
        await batch.commit()
        cancelled += chunk.length
      } catch (batchErr) {
        console.error('Batch commit failed for chunk starting at', i, batchErr)
        batchErrors.push({ index: i, error: batchErr instanceof Error ? batchErr.message : String(batchErr) })
      }
    }

    // Create in-app notifications for each affected appointment
    const notifPromises: Promise<any>[] = []
    const notifFailures: any[] = []
    for (const ap of toCancel) {
      const apdata = ap.data || {}
      const targetEmail = apdata.email || apdata.customerEmail || null
      notifPromises.push(createNotification({
        targetEmail,
        title: 'Appointment Cancelled - Barber Absent',
        body: `Your appointment on ${apdata.date || dateString} at ${apdata.time || ''} with ${barber} has been cancelled because the barber is absent. Please rebook.`,
        type: 'cancelled',
        data: { appointmentId: ap.id }
      }).catch(e => {
        console.error('createNotification failed for', ap.id, e)
        notifFailures.push({ id: ap.id, error: e instanceof Error ? e.message : String(e) })
      }))
    }
    const notifResults = await Promise.allSettled(notifPromises)

    // Send cancellation emails if mail is configured
    const emailFailures: any[] = []
    const canSendEmail = !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
    if (canSendEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        })

        const emailPromises = toCancel.map(async (ap) => {
          const apdata = ap.data || {}
          const to = apdata.email || apdata.customerEmail
          if (!to) return { skipped: true }
          const mail = {
            from: process.env.EMAIL_USER,
            to,
            subject: `Appointment Cancelled - Christian's Barbershop`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1a1a1a; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Christian's Barbershop</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                  <h2 style="color: #333; margin-bottom: 20px;">Appointment Cancelled</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello,</p>
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">We regret to inform you that your appointment on <strong>${apdata.date || dateString}</strong> at <strong>${apdata.time || ''}</strong> with <strong>${barber}</strong> has been cancelled because the barber is absent. Please rebook at your convenience.</p>
                  <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #0066cc; font-size: 14px;"><strong>Contact:</strong> Poblacion Nabunturan, Davao de Oro<br><strong>Phone:</strong> 09500675739<br><strong>Email:</strong> christians.barbershop2011@gmail.com</p>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">Thank you for your understanding.</p>
                </div>
                <div style="background-color: #1a1a1a; color: white; padding: 15px; text-align: center; font-size: 12px;"><p style="margin: 0;">© 2025 Christian's Barbershop</p></div>
              </div>
            `
          }

          try {
            await transporter.sendMail(mail)
            return { ok: true, to }
          } catch (e) {
            console.error('Failed to send cancellation email for', ap.id, to, e)
            return { ok: false, id: ap.id, to, error: e instanceof Error ? e.message : String(e) }
          }
        })

        const emailResults = await Promise.all(emailPromises)
        for (const r of emailResults) if (r && r.ok === false) emailFailures.push(r)
      } catch (e) {
        console.error('Failed to initialize email transporter', e)
        emailFailures.push({ error: e instanceof Error ? e.message : String(e) })
      }
    } else {
      console.log('Email not configured; skipping sending cancellation emails')
    }

  return NextResponse.json({ success: true, message: 'Barber marked absent and appointments cancelled', totalFound: all.length, cancelled, batchErrors: batchErrors.length ? batchErrors : undefined, notifFailures: notifFailures.length ? notifFailures : undefined, emailFailures: emailFailures?.length ? emailFailures : undefined, affectedIds: toCancel.map(a => a.id) })
  } catch (err) {
    console.error('mark-absent error', err)
    // Provide richer error data when available
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
