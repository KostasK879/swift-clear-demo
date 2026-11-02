import Link from 'next/link'
import type { Metadata } from 'next'
import { phoneDisplay, phoneTelHref } from '@/lib/site-phone'

export const metadata: Metadata = {
  title: 'Call Ellie | Swift Clear',
  description: 'Ellie is the AI phone receptionist for Swift Clear. Call the number on the site.',
}

export default function DemoVoicePage() {
  const href = phoneTelHref()
  const number = phoneDisplay()
  return (
    <div className="min-h-screen sc-fab-pad" style={{ background: 'var(--cream)', fontFamily: 'var(--font-dm-sans)' }}>
      <header style={{ background: 'var(--green)' }} className="sticky top-0 z-50 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--amber)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">Swift Clear</span>
          </Link>
          <Link href="/quote" className="btn-amber text-sm" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Get a Quote
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--amber)' }}>
          Phone receptionist
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--green)' }}>
          Call Ellie
        </h1>
        <p className="text-lg text-stone-700 mb-8 leading-relaxed">
          Ellie is the AI receptionist for Swift Clear. She answers the phone, quotes from the price list,
          checks free slots, books a collection, and texts you a summary afterwards. She is not a button on the website.
        </p>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            1. Ring the number on the site
          </h2>
          {href ? (
            <p className="text-stone-700 mb-3">
              <a href={href} className="underline font-semibold text-xl" style={{ color: 'var(--green)' }}>{number}</a>
            </p>
          ) : (
            <p className="text-stone-700 mb-3 leading-relaxed">
              The site is showing <strong>{number}</strong>. Put a real Twilio or Vapi UK number in{' '}
              <code className="bg-stone-100 px-1 rounded">NEXT_PUBLIC_PHONE_NUMBER</code>.{' '}
              020 7946 0000 is an Ofcom drama number and cannot take calls.
            </p>
          )}
          <p className="text-sm text-stone-600 leading-relaxed">
            Import that number into Vapi and set the inbound assistant to Swift Clear Receptionist.
            After you change <code className="bg-stone-100 px-1 rounded">vapi/assistant.json</code>, run{' '}
            <code className="bg-stone-100 px-1 rounded">scripts/setup-vapi.mjs</code> so the live assistant picks up the new phone manner.
          </p>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            2. Website chat
          </h2>
          <p className="text-stone-700 leading-relaxed">
            The amber bubble is Ellie in writing. With <code className="bg-stone-100 px-1 rounded">AI_GATEWAY_API_KEY</code> or{' '}
            <code className="bg-stone-100 px-1 rounded">OPENAI_API_KEY</code> she uses a real model. With neither key she falls back to the keyword replies.
          </p>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            3. What you get after a call
          </h2>
          <p className="text-stone-700 leading-relaxed">
            Every call or booking logs a summary for you. Set <code className="bg-stone-100 px-1 rounded">OWNER_SMS_NUMBER</code> and the Twilio
            keys and it is texted to that mobile. Open <Link href="/admin" className="underline font-medium" style={{ color: 'var(--green)' }}>Admin</Link> to
            see the texts and the house-clearance prices, which stay blank until you set them.
          </p>
        </section>

        <p className="text-sm text-stone-500">
          Full walkthrough: <code className="bg-stone-100 px-1 rounded">READY.md</code> and{' '}
          <code className="bg-stone-100 px-1 rounded">VOICE.md</code> in the project folder.
        </p>
      </main>
    </div>
  )
}
