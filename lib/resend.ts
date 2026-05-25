import { Resend } from 'resend'
import type { Booking } from '@/types'
import { serviceSummary, formatPrice } from './pricing'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(booking: Booking) {
  const summary = serviceSummary(booking.service_details)
  const price = formatPrice(booking.price)

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1B3A2D; padding: 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #E08B20; margin: 0; font-size: 28px;">Swift Clear</h1>
        <p style="color: #a8c4b8; margin: 8px 0 0;">Booking Confirmation</p>
      </div>
      <div style="background: #f8f4ee; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e0d8;">
        <p style="font-size: 18px;">Hi <strong>${booking.name}</strong>,</p>
        <p>Your booking is confirmed! Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666;">Service</td><td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>${summary}</strong></td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666;">Date</td><td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>${booking.date}</strong></td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666;">Time</td><td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>${booking.time_slot}</strong></td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666;">Address</td><td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>${booking.address}</strong></td></tr>
          <tr><td style="padding: 10px 0; color: #666;">Price</td><td style="padding: 10px 0;"><strong style="color: #E08B20; font-size: 20px;">${price}</strong></td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Reference: <code>${booking.id.slice(0, 8).toUpperCase()}</code></p>
        <p style="margin-top: 32px;">We'll be in touch if anything changes. See you on the day!</p>
        <p style="color: #666;">— The Swift Clear Team<br>📞 020 7946 0000 | info@swiftclear.co.uk</p>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Swift Clear <bookings@swiftclear.co.uk>',
      to: booking.email,
      subject: `Booking Confirmed — ${booking.date} at ${booking.time_slot}`,
      html,
    })
  } catch (err) {
    console.error('Resend email error (non-fatal):', err)
  }
}
