'use client'

import { useState } from 'react'
import type { ServiceDetails, TimeSlot } from '@/types'
import { calculatePrice } from '@/lib/pricing'
import ServiceStep from './steps/ServiceStep'
import PriceStep from './steps/PriceStep'
import BookingStep from './steps/BookingStep'
import ContactStep from './steps/ContactStep'
import ConfirmStep from './steps/ConfirmStep'

const STEPS = ['Service', 'Price', 'Date & Time', 'Your Details', 'Confirm']

export default function QuoteWizard() {
  const [step, setStep] = useState(0)

  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null)
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null)
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const price = serviceDetails ? calculatePrice(serviceDetails) : 0

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--amber)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--green)' }}>Swift Clear</span>
          </a>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>Get your instant quote</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Takes about 60 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                  style={{
                    background: i < step ? 'var(--green)' : i === step ? 'var(--amber)' : 'var(--cream-dark)',
                    color: i <= step ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {i < step ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--green)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--cream-dark)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: 'var(--green)', width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(27,58,45,0.08), 0 1px 4px rgba(27,58,45,0.04)', border: '1px solid var(--cream-dark)' }}>
          {step === 0 && (
            <ServiceStep
              details={serviceDetails}
              onChange={setServiceDetails}
              onNext={next}
            />
          )}
          {step === 1 && serviceDetails && (
            <PriceStep
              details={serviceDetails}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 2 && (
            <BookingStep
              date={date}
              timeSlot={timeSlot}
              address={address}
              onDateChange={setDate}
              onTimeChange={setTimeSlot}
              onAddressChange={setAddress}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 3 && (
            <ContactStep
              name={name}
              email={email}
              phone={phone}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPhoneChange={setPhone}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 4 && serviceDetails && date && timeSlot && (
            <ConfirmStep
              name={name}
              email={email}
              phone={phone}
              address={address}
              date={date}
              timeSlot={timeSlot}
              serviceDetails={serviceDetails}
              price={price}
              onBack={back}
            />
          )}
        </div>
      </div>
    </div>
  )
}
