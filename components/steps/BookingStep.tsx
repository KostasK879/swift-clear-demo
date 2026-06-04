'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import type { TimeSlot } from '@/types'
import { TIME_SLOTS } from '@/types'

interface Props {
  date: string
  timeSlot: TimeSlot | null
  address: string
  onDateChange: (d: string) => void
  onTimeChange: (t: TimeSlot) => void
  onAddressChange: (a: string) => void
  onBack: () => void
  onNext: () => void
}

const TIME_LABELS: Record<TimeSlot, string> = {
  '8am': '8:00 AM',
  '10am': '10:00 AM',
  '12pm': '12:00 PM',
  '2pm': '2:00 PM',
  '4pm': '4:00 PM',
}

export default function BookingStep({
  date, timeSlot, address,
  onDateChange, onTimeChange, onAddressChange,
  onBack, onNext,
}: Props) {
  const [availability, setAvailability] = useState<Record<TimeSlot, boolean> | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Build a 30-day calendar
  const today = startOfDay(new Date())
  const days = Array.from({ length: 35 }, (_, i) => addDays(today, i + 1))

  useEffect(() => {
    if (!date) return
    setLoadingSlots(true)
    setAvailability(null)
    fetch(`/api/availability?date=${date}`)
      .then(r => r.json())
      .then(({ availability: avail }) => {
        const map: Record<string, boolean> = {}
        avail.forEach(({ slot, available }: { slot: TimeSlot; available: boolean }) => {
          map[slot] = available
        })
        setAvailability(map as Record<TimeSlot, boolean>)
      })
      .finally(() => setLoadingSlots(false))
  }, [date])

  const canProceed = !!date && !!timeSlot && address.trim().length > 5

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>Pick a date & time</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>We collect Monday to Saturday, 8am–6pm</p>

      {/* Simple calendar grid */}
      <div className="mb-6">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--green)' }}>Choose a date</p>
        <div className="grid grid-cols-7 gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
          {/* Offset for first day */}
          {Array.from({ length: (days[0].getDay() + 6) % 7 }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.slice(0, 28).map(day => {
            const iso = format(day, 'yyyy-MM-dd')
            const isSunday = day.getDay() === 0
            const isSelected = date === iso
            return (
              <button
                key={iso}
                onClick={() => { if (!isSunday) { onDateChange(iso); onTimeChange(null as unknown as TimeSlot) } }}
                disabled={isSunday}
                className="rounded-lg py-2 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2"
                style={{
                  background: isSelected ? 'var(--green)' : isSunday ? 'transparent' : '#fff',
                  color: isSelected ? '#fff' : isSunday ? 'rgba(0,0,0,0.2)' : 'var(--text)',
                  border: isSelected ? '2px solid var(--green)' : isSunday ? 'none' : '1px solid var(--cream-dark)',
                  cursor: isSunday ? 'default' : 'pointer',
                  outlineColor: 'var(--green)',
                }}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {date && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--green)' }}>
            Available times for {format(new Date(date + 'T00:00:00'), 'EEE d MMM')}
          </p>
          {loadingSlots ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking availability…</div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {TIME_SLOTS.map(slot => {
                const avail = availability?.[slot] ?? true
                const isSelected = timeSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => avail && onTimeChange(slot)}
                    disabled={!avail}
                    className="rounded-xl py-3 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2"
                    style={{
                      background: isSelected ? 'var(--green)' : !avail ? 'var(--cream-dark)' : '#fff',
                      color: isSelected ? '#fff' : !avail ? 'rgba(0,0,0,0.25)' : 'var(--text)',
                      border: isSelected ? '2px solid var(--green)' : '2px solid var(--cream-dark)',
                      cursor: avail ? 'pointer' : 'default',
                      textDecoration: !avail ? 'line-through' : 'none',
                      outlineColor: 'var(--green)',
                    }}
                  >
                    {TIME_LABELS[slot]}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Address */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--green)' }}>
          Collection address
        </label>
        <textarea
          value={address}
          onChange={e => onAddressChange(e.target.value)}
          placeholder="e.g. 14 Maple Street, Lewisham, London SE13 6AB"
          rows={2}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            background: '#fff',
            border: '2px solid var(--cream-dark)',
            color: 'var(--text)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
        />
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </button>
        <button className="btn-amber" onClick={onNext} disabled={!canProceed}>
          Next: Contact details →
        </button>
      </div>
    </div>
  )
}
