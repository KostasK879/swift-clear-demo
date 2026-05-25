'use client'

import type { ServiceDetails, ServiceCategory } from '@/types'
import { FURNITURE_LABELS, FURNITURE_PRICES, LOAD_SIZE_LABELS, APPLIANCE_LABELS, APPLIANCE_PRICES } from '@/lib/pricing'

interface Props {
  details: ServiceDetails | null
  onChange: (d: ServiceDetails) => void
  onNext: () => void
}

const CATEGORIES: { id: ServiceCategory; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'furniture',
    label: 'Furniture',
    desc: 'Sofas, beds, wardrobes, tables & more',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    id: 'garden',
    label: 'Garden Waste',
    desc: 'Soil, grass, branches, shrubs',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" /><path d="M17.5 7.5A5 5 0 0012 12" /><path d="M6.5 7.5A5 5 0 0112 12" /><path d="M20 16a5 5 0 01-8 4" /><path d="M4 16a5 5 0 008 4" />
      </svg>
    ),
  },
  {
    id: 'rubble',
    label: 'Construction Rubble',
    desc: 'Bricks, concrete, plasterboard, tiles',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: 'junk',
    label: 'General Junk',
    desc: 'Mixed household clutter and rubbish',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
      </svg>
    ),
  },
  {
    id: 'appliances',
    label: 'Appliances',
    desc: 'Fridges, washing machines, ovens',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
]

const FURNITURE_ITEMS = Object.keys(FURNITURE_LABELS)
const LOAD_SIZES = ['small', 'half', 'full'] as const
const APPLIANCE_TYPES = Object.keys(APPLIANCE_LABELS)

export default function ServiceStep({ details, onChange, onNext }: Props) {
  const cat = details?.category

  function selectCategory(c: ServiceCategory) {
    if (c === 'furniture') onChange({ category: c, items: [] })
    else if (c === 'garden' || c === 'rubble' || c === 'junk') onChange({ category: c, loadSize: 'small' })
    else onChange({ category: c, applianceTypes: [] })
  }

  function setFurnitureQty(type: string, qty: number) {
    const items = (details?.items ?? []).filter(i => i.type !== type)
    if (qty > 0) items.push({ type, quantity: qty })
    onChange({ ...details!, items })
  }

  function getFurnitureQty(type: string) {
    return details?.items?.find(i => i.type === type)?.quantity ?? 0
  }

  function toggleAppliance(type: string) {
    const current = details?.applianceTypes ?? []
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type]
    onChange({ ...details!, applianceTypes: next })
  }

  const canProceed = (() => {
    if (!cat) return false
    if (cat === 'furniture') return (details?.items?.length ?? 0) > 0
    if (cat === 'appliances') return (details?.applianceTypes?.length ?? 0) > 0
    return true
  })()

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>What do you need removed?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Select a category to get started</p>

      {/* Category grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.id)}
            className="rounded-xl p-4 text-left transition-all duration-150 focus-visible:outline focus-visible:outline-2"
            style={{
              background: cat === c.id ? 'var(--green)' : '#fff',
              color: cat === c.id ? '#fff' : 'var(--text)',
              border: cat === c.id ? '2px solid var(--green)' : '2px solid var(--cream-dark)',
              boxShadow: cat === c.id ? '0 4px 16px rgba(27,58,45,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
              outlineColor: 'var(--green)',
            }}
          >
            <div className="mb-2 opacity-80">{c.icon}</div>
            <div className="font-semibold text-sm">{c.label}</div>
            <div className="text-xs mt-0.5 opacity-60">{c.desc}</div>
          </button>
        ))}
      </div>

      {/* Sub-selectors */}
      {cat === 'furniture' && (
        <div className="rounded-xl p-5" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--green)' }}>How many of each item?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FURNITURE_ITEMS.map(type => (
              <div key={type} className="flex items-center justify-between bg-white rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{FURNITURE_LABELS[type]}</div>
                  <div className="text-xs" style={{ color: 'var(--amber)' }}>£{FURNITURE_PRICES[type]} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFurnitureQty(type, Math.max(0, getFurnitureQty(type) - 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--cream-dark)', color: 'var(--green)' }}
                  >−</button>
                  <span className="w-5 text-center font-bold text-sm">{getFurnitureQty(type)}</span>
                  <button
                    onClick={() => setFurnitureQty(type, getFurnitureQty(type) + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--green)', color: '#fff' }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(cat === 'garden' || cat === 'rubble' || cat === 'junk') && (
        <div className="rounded-xl p-5" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--green)' }}>How much waste do you have?</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {LOAD_SIZES.map(size => (
              <button
                key={size}
                onClick={() => onChange({ ...details!, loadSize: size })}
                className="rounded-xl p-4 text-center transition-all focus-visible:outline focus-visible:outline-2"
                style={{
                  background: details?.loadSize === size ? 'var(--green)' : '#fff',
                  color: details?.loadSize === size ? '#fff' : 'var(--text)',
                  border: details?.loadSize === size ? '2px solid var(--green)' : '2px solid var(--cream-dark)',
                  outlineColor: 'var(--green)',
                }}
              >
                <div className="font-semibold capitalize text-sm">{size === 'half' ? 'Half load' : size === 'full' ? 'Full load' : 'Small load'}</div>
                <div className="text-xs mt-1 opacity-60">{LOAD_SIZE_LABELS[size]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {cat === 'appliances' && (
        <div className="rounded-xl p-5" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--green)' }}>Which appliances?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {APPLIANCE_TYPES.map(type => {
              const selected = details?.applianceTypes?.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => toggleAppliance(type)}
                  className="flex items-center justify-between bg-white rounded-lg px-4 py-3 transition-all focus-visible:outline focus-visible:outline-2"
                  style={{
                    border: selected ? '2px solid var(--green)' : '2px solid transparent',
                    outlineColor: 'var(--green)',
                  }}
                >
                  <div className="text-sm font-medium text-left">{APPLIANCE_LABELS[type]}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--amber)' }}>£{APPLIANCE_PRICES[type]}</span>
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: selected ? 'var(--green)' : 'var(--cream-dark)' }}>
                      {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button className="btn-amber" onClick={onNext} disabled={!canProceed}>
          Next: See your price →
        </button>
      </div>
    </div>
  )
}
