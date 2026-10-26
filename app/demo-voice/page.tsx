import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try Ellie | Swift Clear Voice Demo',
  description: 'Talk to Ellie on the website or via Vapi. AI phone receptionist for Swift Clear.',
}

export default function DemoVoicePage() {
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
          Voice demo
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--green)' }}>
          Meet Ellie
        </h1>
        <p className="text-lg text-stone-700 mb-8 leading-relaxed">
          Ellie is the AI receptionist for Swift Clear. She quotes real prices, checks free slots,
          books a collection, texts a confirmation, and can transfer you to a human. Talk to her
          from this website (green pill), or from the Vapi dashboard.
        </p>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            1. Talk to Ellie on the website (preferred)
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-stone-700 mb-4">
            <li>
              Open{' '}
              <a href="http://localhost:3100" className="underline font-medium" style={{ color: 'var(--green)' }}>
                http://localhost:3100
              </a>
            </li>
            <li>
              Click the green <strong>Talk to Ellie</strong> pill (above the amber Clearbot bubble)
            </li>
            <li>Allow the microphone → <strong>Start talking</strong></li>
            <li>Try: “I need a sofa collected tomorrow morning in SW1A”</li>
          </ol>
          <p className="text-sm text-stone-600 leading-relaxed">
            Needs a <strong>Vapi Public</strong> key in <code className="bg-stone-100 px-1 rounded">.env.local</code> as{' '}
            <code className="bg-stone-100 px-1 rounded">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> (or{' '}
            <code className="bg-stone-100 px-1 rounded">VAPI_PUBLIC_KEY</code>). Create one at{' '}
            <a
              href="https://dashboard.vapi.ai/org/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
              style={{ color: 'var(--green)' }}
            >
              dashboard.vapi.ai → API Keys → Public
            </a>
            . Allow origin <code className="bg-stone-100 px-1 rounded">http://localhost:3100</code>. Never put the
            private key in the browser.
          </p>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            2. Website chat (no key needed)
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-stone-700">
            <li>Click the amber bubble (Clearbot) bottom-right for a quick price</li>
            <li>
              Or go to{' '}
              <Link href="/quote" className="underline font-medium" style={{ color: 'var(--green)' }}>
                Get a Quote
              </Link>
            </li>
          </ol>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            3. Vapi dashboard fallback
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-stone-700 mb-4">
            <li>Keep the site + tunnel up so Ellie&apos;s tools can hit the webhook</li>
            <li>
              In Vapi → <strong>Swift Clear Receptionist</strong> → <strong>Talk to Assistant</strong>
            </li>
          </ol>
          <p className="text-sm text-stone-600">
            See <code className="bg-stone-100 px-1 rounded">READY.md</code> for tunnel + setup commands.
          </p>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-stone-200 bg-white">
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--green)' }}>
            Still needed for a live UK number
          </h2>
          <ul className="list-disc list-inside space-y-2 text-stone-700">
            <li>Twilio account + UK number (SMS + inbound calls)</li>
            <li>Import that number into Vapi and set inbound assistant = Swift Clear Receptionist</li>
            <li>
              Optional: real <code className="text-sm bg-stone-100 px-1 rounded">TWILIO_*</code> env vars for mid-call SMS
            </li>
          </ul>
        </section>

        <p className="text-sm text-stone-500">
          Full walkthrough: <code className="bg-stone-100 px-1 rounded">READY.md</code> and{' '}
          <code className="bg-stone-100 px-1 rounded">VOICE.md</code> in the project folder.
        </p>
      </main>
    </div>
  )
}
