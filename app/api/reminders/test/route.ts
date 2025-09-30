import { NextRequest, NextResponse } from 'next/server'
import { createAppointmentReminders } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    // Create appointment reminders for today and tomorrow
    await createAppointmentReminders()
    
    return NextResponse.json({
      success: true,
      message: 'Appointment reminders created successfully'
    })
  } catch (error) {
    console.error('Error creating appointment reminders:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
