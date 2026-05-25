import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)', fontFamily: 'var(--font-dm-sans)' }}>
      <Nav />
      <Hero />
      <Services />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header style={{ background: 'var(--green)' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--amber)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">Swift Clear</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Services</a>
          <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">How It Works</a>
          <a href="tel:02079460000" className="text-sm font-medium text-white/70 hover:text-white transition-colors">020 7946 0000</a>
          <Link href="/quote" className="btn-amber text-sm px-5 py-2.5" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>Get a Quote</Link>
        </nav>
        <Link href="/quote" className="md:hidden btn-amber" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Quote</Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="grain-overlay relative overflow-hidden" style={{ background: 'var(--green)', minHeight: '560px' }}>
      {/* Radial gradient blobs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute" style={{ width: '600px', height: '600px', top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(61,122,93,0.5) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="absolute" style={{ width: '400px', height: '400px', bottom: '-100px', left: '10%', background: 'radial-gradient(circle, rgba(224,139,32,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-12" style={{ zIndex: 2 }}>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 animate-fade-up" style={{ background: 'rgba(224,139,32,0.2)', color: 'var(--amber)', border: '1px solid rgba(224,139,32,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
            Same-day collection available across London
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-5 animate-fade-up delay-100" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
            London&apos;s fastest<br />
            <span style={{ color: 'var(--amber)' }}>waste removal</span><br />
            service
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-lg animate-fade-up delay-200" style={{ lineHeight: '1.7' }}>
            Furniture, garden waste, construction rubble, junk, and appliances — cleared fast, responsibly, and at a fair price.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-up delay-300">
            <Link href="/quote" className="btn-amber">
              Get a Free Quote →
            </Link>
            <a href="tel:02079460000" className="btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
              020 7946 0000
            </a>
          </div>
          <div className="flex flex-wrap gap-6 mt-10 justify-center md:justify-start animate-fade-up delay-400">
            {['Fully licensed', 'Fully insured', '5★ rated', 'Eco-friendly'].map(badge => (
              <div key={badge} className="flex items-center gap-1.5 text-white/60 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel */}
        <div className="flex-shrink-0 w-full md:w-72 animate-fade-up delay-300">
          <div className="rounded-2xl p-6 grid grid-cols-2 gap-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
            {[
              { val: '2,400+', label: 'Loads cleared' },
              { val: '4.9★', label: 'Google rating' },
              { val: 'Same day', label: 'Collection available' },
              { val: '100%', label: 'Eco disposal' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="font-display text-2xl font-bold" style={{ color: 'var(--amber)' }}>{s.val}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const SERVICES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    title: 'Furniture Removal',
    desc: 'Sofas, beds, wardrobes, tables — single items or full house clearances.',
    from: '£40 per item',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0110 10" /><path d="M12 2C6.48 2 2 6.48 2 12" /><circle cx="12" cy="12" r="3" /><path d="M12 8v1M12 15v1M8 12H9M15 12h1" />
      </svg>
    ),
    title: 'Garden Waste',
    desc: 'Soil, grass, branches, shrubs — we take it all away, sorted for composting.',
    from: 'From £50',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    title: 'Construction Rubble',
    desc: 'Bricks, concrete, plasterboard, tiles — for builders, renovators, and tradespeople.',
    from: 'From £100',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
      </svg>
    ),
    title: 'General Junk',
    desc: 'Old toys, clothes, office clutter, books — anything you need gone.',
    from: 'From £60',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Appliance Removal',
    desc: 'Fridges, washing machines, ovens — safely disconnected and responsibly recycled.',
    from: '£50 per item',
  },
]

function Services() {
  return (
    <section id="services" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>What we remove</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>Every type of waste, cleared fast</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(s => (
            <div key={s.title} className="group rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#fff', border: '1px solid var(--cream-dark)', boxShadow: '0 2px 12px rgba(27,58,45,0.06), 0 1px 3px rgba(27,58,45,0.04)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#e8f0ec', color: 'var(--green)' }}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1" style={{ color: 'var(--green)' }}>{s.title}</h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{s.desc}</p>
                  <div className="text-sm font-bold" style={{ color: 'var(--amber)' }}>{s.from}</div>
                </div>
              </div>
            </div>
          ))}
          {/* CTA card */}
          <div className="rounded-2xl p-7 flex flex-col justify-between grain-overlay" style={{ background: 'var(--green)', boxShadow: '0 2px 12px rgba(27,58,45,0.18)' }}>
            <div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Not sure what you need?</h3>
              <p className="text-sm text-white/60 mb-6" style={{ lineHeight: '1.6' }}>Tell us what you have and we&apos;ll sort it — mixed loads welcome.</p>
            </div>
            <Link href="/quote" className="btn-amber" style={{ alignSelf: 'flex-start' }}>Get a quote →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Get your quote', desc: 'Select your items or waste type, see an instant price, and pick a date and time that suits you.' },
    { num: '02', title: 'We arrive on time', desc: 'Our licensed team turns up at your chosen slot — fully equipped and ready to load.' },
    { num: '03', title: 'Job done', desc: "We clear everything, leave the area clean, and send your receipt. No mess, no fuss." },
  ]

  return (
    <section id="how-it-works" className="py-20 px-6" style={{ background: 'var(--cream-dark)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>Simple process</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-0 h-px" style={{ background: 'var(--green)', opacity: 0.15 }} />
              )}
              <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid var(--cream-dark)', boxShadow: '0 2px 12px rgba(27,58,45,0.05)' }}>
                <div className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--amber)', opacity: 0.5 }}>{step.num}</div>
                <h3 className="font-display font-bold text-xl mb-3" style={{ color: 'var(--green)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyUs() {
  const items = [
    { icon: '✓', title: 'Fully licensed & insured', desc: 'Environment Agency registered waste carrier. Full public liability insurance.' },
    { icon: '⚡', title: 'Same-day available', desc: 'Book before 10am for same-day collection across most London postcodes.' },
    { icon: '♻', title: 'Eco-responsible disposal', desc: '95% of waste recycled or reused — we never fly-tip.' },
    { icon: '💷', title: 'No hidden charges', desc: 'The price you see is the price you pay. No surprises on the day.' },
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>Why choose us</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>Trusted by thousands of London homes</h2>
          <p className="mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            We&apos;ve been clearing London since 2014. Whether it&apos;s a single sofa or a full house clear, we show up, work hard, and leave things clean.
          </p>
          <Link href="/quote" className="btn-amber">Book your collection →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {items.map(item => (
            <div key={item.title} className="rounded-xl p-6" style={{ background: 'var(--cream-dark)', border: '1px solid rgba(27,58,45,0.1)' }}>
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-display font-bold text-base mb-2" style={{ color: 'var(--green)' }}>{item.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const reviews = [
    { name: 'Sarah T.', location: 'Lewisham', stars: 5, text: "Used Swift Clear for a full house clearance before moving. The team arrived on time, worked quickly and were incredibly polite. Left the place spotless. Would use again in a heartbeat." },
    { name: 'Marcus B.', location: 'Hackney', stars: 5, text: "Needed an old sofa and fridge taken away same day. Booked online at 8am, they were there by 10. Pricing was clear, no nonsense. Exactly what you want from a clearance company." },
    { name: 'Priya K.', location: 'Bromley', stars: 5, text: "After a kitchen renovation I had a mountain of rubble and old units. Swift Clear sorted it in one visit. Quoted online, paid online, done. Brilliant service." },
  ]

  return (
    <section className="py-20 px-6" style={{ background: 'var(--cream-dark)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>Reviews</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: 'var(--green)', letterSpacing: '-0.02em' }}>What customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(r => (
            <div key={r.name} className="rounded-2xl p-7 flex flex-col" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(27,58,45,0.07)' }}>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--amber)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <p className="text-sm flex-1 mb-5" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>&ldquo;{r.text}&rdquo;</p>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--green)' }}>{r.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBanner() {
  return (
    <section className="py-20 px-6 grain-overlay" style={{ background: 'var(--green)' }}>
      <div className="relative max-w-3xl mx-auto text-center" style={{ zIndex: 2 }}>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4" style={{ letterSpacing: '-0.03em' }}>Ready to clear it out?</h2>
        <p className="text-white/60 text-lg mb-8">Get an instant quote in 60 seconds — no forms to fill, no calls required.</p>
        <Link href="/quote" className="btn-amber text-lg" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
          Get my free quote →
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#0f1f18', color: 'rgba(255,255,255,0.5)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--amber)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-white">Swift Clear</span>
          </div>
          <p className="text-sm" style={{ lineHeight: '1.7' }}>London&apos;s trusted waste removal service since 2014. Licensed, insured, and eco-responsible.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Services</h4>
          <ul className="space-y-2 text-sm">
            {['Furniture Removal', 'Garden Waste', 'Construction Rubble', 'General Junk', 'Appliance Removal'].map(s => (
              <li key={s}><Link href="/quote" className="hover:text-white transition-colors">{s}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>📞 <a href="tel:02079460000" className="hover:text-white transition-colors">020 7946 0000</a></li>
            <li>✉ <a href="mailto:info@swiftclear.co.uk" className="hover:text-white transition-colors">info@swiftclear.co.uk</a></li>
            <li>📍 London, UK</li>
            <li className="pt-2"><Link href="/admin" className="text-xs opacity-40 hover:opacity-70 transition-opacity">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span>© 2025 Swift Clear Ltd. All rights reserved.</span>
        <span>Environment Agency Licence No. CBDU123456</span>
      </div>
    </footer>
  )
}
