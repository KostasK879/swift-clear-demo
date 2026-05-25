'use client'

interface Props {
  name: string
  email: string
  phone: string
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}

function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--green)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
        style={{
          background: '#fff',
          border: '2px solid var(--cream-dark)',
          color: 'var(--text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--green)'}
        onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
      />
    </div>
  )
}

export default function ContactStep({
  name, email, phone,
  onNameChange, onEmailChange, onPhoneChange,
  onBack, onNext,
}: Props) {
  const canProceed = name.trim().length > 1 && email.includes('@') && phone.trim().length > 7

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>Your contact details</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>We&apos;ll send your confirmation here</p>

      <div className="space-y-4 mb-8">
        <Field label="Full name" type="text" value={name} onChange={onNameChange} placeholder="Jane Smith" />
        <Field label="Email address" type="email" value={email} onChange={onEmailChange} placeholder="jane@example.com" />
        <Field label="Phone number" type="tel" value={phone} onChange={onPhoneChange} placeholder="07700 900000" />
      </div>

      <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.08)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Your details are only used to confirm your booking and send a receipt. We never share your information with third parties.
        </p>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </button>
        <button className="btn-amber" onClick={onNext} disabled={!canProceed}>
          Review booking →
        </button>
      </div>
    </div>
  )
}
