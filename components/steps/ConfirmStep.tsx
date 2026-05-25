'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { ServiceDetails, TimeSlot } from '@/types'
import { formatPrice, serviceSummary } from '@/lib/pricing'


interface Props {
  name: string
  email: string
  phone: string
  address: string
  date: string
  timeSlot: TimeSlot
  serviceDetails: ServiceDetails
  price: number
  onBack: () => void
}

const TIME_LABELS: Record<TimeSlot, string> = {
  '8am': '8:00 AM', '10am': '10:00 AM', '12pm': '12:00 PM', '2pm': '2:00 PM', '4pm': '4:00 PM',
}

export default function ConfirmStep({ name, email, phone, address, date, timeSlot, serviceDetails, price, onBack }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refId, setRefId] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, date, time_slot: timeSlot, service_details: serviceDetails, price }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setRefId(data.booking.id.slice(0, 8).toUpperCase())
      setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--green)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>Booking confirmed!</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Reference: <span className="font-mono font-bold" style={{ color: 'var(--green)' }}>SC-{refId}</span></p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>A confirmation email has been sent to <strong>{email}</strong></p>
        <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span style={{ color: 'var(--text-muted)' }}>Name</span><br /><strong>{name}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Date</span><br /><strong>{format(new Date(date + 'T00:00:00'), 'EEE d MMMM yyyy')}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Time</span><br /><strong>{TIME_LABELS[timeSlot]}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Price</span><br /><strong style={{ color: 'var(--amber)' }}>{formatPrice(price)}</strong></div>
            <div className="sm:col-span-2"><span style={{ color: 'var(--text-muted)' }}>Address</span><br /><strong>{address}</strong></div>
          </div>
        </div>
        <a href="/" className="btn-amber">← Back to homepage</a>
      </div>
    )
  }

  const rows = [
    { label: 'Service', value: serviceSummary(serviceDetails) },
    { label: 'Date', value: format(new Date(date + 'T00:00:00'), 'EEE d MMMM yyyy') },
    { label: 'Time', value: TIME_LABELS[timeSlot] },
    { label: 'Address', value: address },
    { label: 'Name', value: name },
    { label: 'Email', value: email },
    { label: 'Phone', value: phone },
  ]

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>Review your booking</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Check everything looks right before confirming</p>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid var(--cream-dark)' }}>
        {rows.map((row, i) => (
          <div key={row.label} className="flex gap-4 px-5 py-3.5" style={{ background: i % 2 === 0 ? '#fff' : 'var(--cream-dark)' }}>
            <span className="w-20 text-sm flex-shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
            <span className="text-sm font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex gap-4 px-5 py-4" style={{ background: 'var(--green)' }}>
          <span className="w-20 text-sm font-medium text-white/70">Total</span>
          <span className="font-display text-2xl font-bold" style={{ color: 'var(--amber)' }}>{formatPrice(price)}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: '#fff0f0', color: '#c0392b', border: '1px solid #f5c6cb' }}>
          {error}
        </div>
      )}

      <p className="text-xs mb-6" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
        By confirming, you agree to our terms. Payment is taken on the day of collection. Same-day cancellations may incur a fee.
      </p>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          ← Edit details
        </button>
        <button className="btn-amber" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Confirming…' : 'Confirm booking ✓'}
        </button>
      </div>
    </div>
  )
}
