# Appointment Reminder System Setup

This document explains how to set up the automatic appointment reminder system for Christian's Barbershop.

## Features

- **Email Reminders**: Sends professional HTML email reminders to customers
- **SMS Reminders**: Sends text message reminders via Twilio
- **Automatic Scheduling**: Daily cron job to send reminders for tomorrow's appointments
- **Manual Trigger**: Admin can manually send reminders from the appointments page
- **Detailed Reporting**: Shows success/failure status for each reminder sent

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Email Configuration (Gmail recommended)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=kwjwflomxdfrbgul  # Use App Password, not regular password

# SMS Chef Configuration (Primary SMS Provider)
SMS_CHEF_API_KEY=your_sms_chef_api_key
SMS_CHEF_SENDER=your_sender_name_or_number
SMS_CHEF_BASE_URL=https://api.smschef.com

# Twilio Configuration (Fallback)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cron Job Security
CRON_SECRET=your_secret_key_for_cron_jobs

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

### 2. Gmail Setup (for Email Reminders)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

### 3. SMS Chef Setup (Primary SMS Provider)

1. Sign up for an SMS Chef account at https://www.smschef.com
2. Get your API key from the SMS Chef dashboard
3. Set up your sender name or number
4. Add these credentials to your environment variables:
   - `SMS_CHEF_API_KEY`: Your API key from SMS Chef dashboard
   - `SMS_CHEF_SENDER`: Your sender name or phone number
   - `SMS_CHEF_BASE_URL`: API base URL (usually https://api.smschef.com)

### 4. Twilio Setup (Fallback SMS Provider)

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number for sending SMS
4. Add these credentials to your environment variables (used as fallback)

### 5. Setting Up Automatic Reminders

#### Option A: Using Vercel Cron Jobs (Recommended for Production)

1. Add a `vercel.json` file to your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This will run the reminder job daily at 9 AM UTC.

#### Option B: Using External Cron Services

You can use services like:
- **Cron-job.org**: Set up a free cron job to call your API endpoint
- **EasyCron**: More advanced scheduling options
- **SetCronJob**: Simple cron service

Set the cron job to call: `https://your-domain.com/api/cron/send-reminders`

Make sure to include the authorization header: `Authorization: Bearer your_cron_secret`

### 5. Testing the System

1. **Manual Testing**: Go to Admin → Appointments and click "Send Tomorrow's Reminders"
2. **Check Logs**: Monitor the console for any errors
3. **Verify Emails**: Check that emails are being sent successfully
4. **Verify SMS**: Check that SMS messages are being delivered

## API Endpoints

### Send Reminders
- **POST** `/api/reminders/send`
- **Body**: `{ "targetDate": "2024-01-15" }` (optional, defaults to tomorrow)
- **Response**: Detailed results of reminder sending

### Cron Job
- **GET** `/api/cron/send-reminders`
- **Headers**: `Authorization: Bearer your_cron_secret`
- **Response**: Cron job execution results

## Appointment Data Requirements

The system looks for appointments with the following fields:
- `email`: Customer email address
- `phone`: Customer phone number (optional)
- `name` or `customerName`: Customer name
- `barber`: Barber name
- `serviceName`: Service type
- `date`: Appointment date (string format: "January 15, 2024")
- `time`: Appointment time (string format: "2:00 PM")
- `scheduledAt`: Firebase Timestamp (preferred for accurate querying)

## Troubleshooting

### Common Issues

1. **Email not sending**: Check Gmail app password and 2FA settings
2. **SMS not sending**: 
   - Verify SMS Chef API key and credentials
   - Check phone number format (should include country code)
   - Review SMS Chef API documentation for correct endpoint and payload format
   - Check fallback providers (Infobip, Twilio) if SMS Chef fails
3. **No appointments found**: Check date format and timezone settings
4. **Cron job failing**: Verify CRON_SECRET and endpoint accessibility

### Debug Mode

The system includes detailed logging. Check your server logs for:
- Number of appointments found
- Email/SMS sending status
- Error messages and stack traces

## Security Notes

- Keep your environment variables secure
- Use strong CRON_SECRET for production
- Consider rate limiting for the reminder API
- Monitor for abuse of the manual reminder feature

## Customization

### Email Template
Edit the HTML template in `app/api/reminders/send/route.ts` in the `sendEmailReminder` function.

### SMS Message
Edit the message template in the `sendSMSReminder` function.

### Timing
Change the cron schedule in `vercel.json` or your cron service settings.

## Support

For issues or questions about the reminder system, check:
1. Server logs for error messages
2. Environment variable configuration
3. Third-party service status (Gmail, Twilio)
4. Network connectivity and firewall settings
