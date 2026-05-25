'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import type { Booking, BlockedSlot, TimeSlot } from '@/types'
import { TIME_SLOTS } from '@/types'
import { serviceSummary, formatPrice } from '@/lib/pricing'

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [blockDate, setBlockDate] = useState('')
  const [blockSlot, setBlockSlot] = useState<TimeSlot>('8am')
  const [blocking, setBlocking] = useState(false)
  const [sortCol, setSortCol] = useState<'date' | 'created_at' | 'price'>('date')

  const load = useCallback(async () => {
    setLoading(true)
    const [bRes, bsRes] = await Promise.all([
      fetch('/api/bookings'),
      fetch('/api/blocked-slots'),
    ])
    const [bData, bsData] = await Promise.all([bRes.json(), bsRes.json()])
    setBookings(bData.bookings ?? [])
    setBlockedSlots(bsData.blocked_slots ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function blockSlotFn() {
    if (!blockDate) return
    setBlocking(true)
    await fetch('/api/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: blockDate, time_slot: blockSlot }),
    })
    await load()
    setBlocking(false)
  }

  async function unblockSlot(id: string) {
    await fetch(`/api/blocked-slots/${id}`, { method: 'DELETE' })
    setBlockedSlots(prev => prev.filter(s => s.id !== id))
  }

  const sorted = [...bookings].sort((a, b) => {
    if (sortCol === 'date') return a.date < b.date ? 1 : -1
    if (sortCol === 'price') return b.price - a.price
    return a.created_at < b.created_at ? 1 : -1
  })

  const thisWeek = bookings.filter(b => {
    const d = new Date(b.date)
    const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    const end = new Date(start); end.setDate(start.getDate() + 7)
    return d >= start && d < end
  })

  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0)

  const card = {
    background: '#1A1D26',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
  }

  return (
    <div style={{ background: '#0F1117', minHeight: '100vh', color: '#e8e8e8', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#141720', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#E08B20' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-white">Swift Clear</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(224,139,32,0.15)', color: '#E08B20' }}>Admin</span>
          </div>
          <a href="/" className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>← View site</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total bookings', val: bookings.length, sub: 'all time' },
            { label: 'This week', val: thisWeek.length, sub: 'bookings' },
            { label: 'Total revenue', val: formatPrice(totalRevenue), sub: 'all bookings' },
          ].map(s => (
            <div key={s.label} style={card} className="p-5">
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
              <div className="text-3xl font-bold text-white">{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bookings table */}
          <div className="lg:col-span-2">
            <div style={card} className="overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="font-semibold text-sm text-white">All Bookings</h2>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Sort:
                  {(['date', 'created_at', 'price'] as const).map(col => (
                    <button
                      key={col}
                      onClick={() => setSortCol(col)}
                      className="px-2 py-0.5 rounded text-xs transition-colors"
                      style={{
                        background: sortCol === col ? 'rgba(224,139,32,0.2)' : 'transparent',
                        color: sortCol === col ? '#E08B20' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {col === 'created_at' ? 'Newest' : col.charAt(0).toUpperCase() + col.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
              ) : sorted.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No bookings yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Customer', 'Date / Time', 'Service', 'Price', 'Phone'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((b, i) => (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white text-sm">{b.name}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white text-sm">{format(new Date(b.date + 'T00:00:00'), 'dd MMM yyyy')}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.time_slot}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {serviceSummary(b.service_details)}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.address.split(',').slice(-2).join(',').trim()}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold" style={{ color: '#E08B20' }}>{formatPrice(b.price)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{b.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Block a slot */}
            <div style={card} className="p-5">
              <h3 className="font-semibold text-sm text-white mb-4">Block a time slot</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Date</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={e => setBlockDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Time slot</label>
                  <select
                    value={blockSlot}
                    onChange={e => setBlockSlot(e.target.value as TimeSlot)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }}
                  >
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button
                  onClick={blockSlotFn}
                  disabled={!blockDate || blocking}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
                  style={{ background: '#E08B20', color: '#fff', opacity: !blockDate || blocking ? 0.5 : 1, cursor: !blockDate || blocking ? 'default' : 'pointer' }}
                >
                  {blocking ? 'Blocking…' : 'Block this slot'}
                </button>
              </div>
            </div>

            {/* Active blocks */}
            <div style={card} className="p-5">
              <h3 className="font-semibold text-sm text-white mb-4">
                Blocked slots
                {blockedSlots.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(224,139,32,0.15)', color: '#E08B20' }}>
                    {blockedSlots.length}
                  </span>
                )}
              </h3>
              {blockedSlots.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No blocked slots</p>
              ) : (
                <div className="space-y-2">
                  {blockedSlots.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-xs font-medium text-white">{format(new Date(s.date + 'T00:00:00'), 'dd MMM yyyy')}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.time_slot}</div>
                      </div>
                      <button
                        onClick={() => unblockSlot(s.id)}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
