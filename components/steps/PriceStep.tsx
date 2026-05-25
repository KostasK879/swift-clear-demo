'use client'

import type { ServiceDetails } from '@/types'
import { calculatePrice, formatPrice, serviceSummary, FURNITURE_PRICES, APPLIANCE_PRICES, APPLIANCE_LABELS } from '@/lib/pricing'

interface Props {
  details: ServiceDetails
  onBack: () => void
  onNext: () => void
}

export default function PriceStep({ details, onBack, onNext }: Props) {
  const price = calculatePrice(details)
  const summary = serviceSummary(details)

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>Your price estimate</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Based on what you told us</p>

      {/* Big price display */}
      <div className="rounded-2xl p-8 text-center mb-6 relative overflow-hidden grain-overlay" style={{ background: 'var(--green)' }}>
        <p className="text-white/60 text-sm mb-2">Estimated total</p>
        <div className="font-display text-6xl font-bold" style={{ color: 'var(--amber)', letterSpacing: '-0.03em' }}>
          {formatPrice(price)}
        </div>
        <p className="text-white/50 text-xs mt-3">VAT included · Final price confirmed on arrival</p>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--green)' }}>What&apos;s included</h3>
        <div className="space-y-2">
          {details.category === 'furniture' && (details.items ?? []).map(item => (
            <div key={item.type} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{item.quantity}× {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {formatPrice((FURNITURE_PRICES[item.type] ?? 50) * item.quantity)}
              </span>
            </div>
          ))}
          {(details.category === 'garden' || details.category === 'rubble' || details.category === 'junk') && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{summary}</span>
              <span className="font-medium">{formatPrice(price)}</span>
            </div>
          )}
          {details.category === 'appliances' && (details.applianceTypes ?? []).map(type => (
            <div key={type} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{APPLIANCE_LABELS[type] ?? type}</span>
              <span className="font-medium">{formatPrice(APPLIANCE_PRICES[type] ?? 55)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold" style={{ borderColor: 'rgba(27,58,45,0.1)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--amber)' }}>{formatPrice(price)}</span>
        </div>
      </div>

      {/* Trust notes */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: '✓', text: 'No hidden fees' },
          { icon: '♻', text: 'Eco disposal' },
          { icon: '🛡', text: 'Fully insured' },
        ].map(b => (
          <div key={b.text} className="rounded-xl p-3 text-center text-xs" style={{ background: '#fff', color: 'var(--text-muted)' }}>
            <div className="text-lg mb-1">{b.icon}</div>
            {b.text}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </button>
        <button className="btn-amber" onClick={onNext}>
          Book this collection →
        </button>
      </div>
    </div>
  )
}
