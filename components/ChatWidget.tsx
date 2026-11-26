'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { GREETING, reply, type Reply } from '@/lib/chatbot'
import { WEBSITE_TEASER } from '@/lib/ellie-copy'

type Msg = { from: 'bot' | 'me'; r: Reply }

const ELLIE = '/ellie.jpg'

function ElliePhoto({ size, fill = false }: { size: number; fill?: boolean }) {
  return (
    // Decorative: her name sits beside the photo, and the file is already a small JPEG.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ELLIE}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{
        width: fill ? '100%' : size,
        height: fill ? '100%' : size,
        maxWidth: 'none',
        borderRadius: fill ? 0 : '50%',
        objectFit: 'cover',
        objectPosition: 'center 28%',
        display: 'block',
        background: '#1B3A2D',
      }}
    />
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', r: GREETING }])
  const [narrow, setNarrow] = useState(false)
  const [lastUnclear, setLastUnclear] = useState<number | undefined>(undefined)
  const end = useRef<HTMLDivElement>(null)
  const seen = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if (!seen.current) setTeaser(true)
    }, 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing, open])

  function openChat() {
    seen.current = true
    setTeaser(false)
    setOpen(true)
  }

  async function send(text: string) {
    const t = text.trim()
    if (!t || typing) return
    const history = [...msgs, { from: 'me' as const, r: { text: t } }]
    setInput('')
    setMsgs(history)
    setTyping(true)
    const local = () => {
      const turn = reply(t, { lastUnclear })
      if (typeof turn.unclearIndex === 'number') setLastUnclear(turn.unclearIndex)
      setMsgs(m => [...m, { from: 'bot', r: { text: turn.text, chips: turn.chips, link: turn.link } }])
    }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastUnclear,
          messages: history.map(m => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.r.text })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.reply?.text) {
        local()
      } else {
        if (typeof data.unclearIndex === 'number') setLastUnclear(data.unclearIndex)
        setMsgs(m => [...m, { from: 'bot', r: data.reply }])
      }
    } catch {
      local()
    } finally {
      setTyping(false)
    }
  }

  const edge = 'max(16px, env(safe-area-inset-right))'
  const bottom = 'max(16px, env(safe-area-inset-bottom))'

  return (
    <div
      className="sc-chat-root"
      style={{
        position: 'fixed',
        right: edge,
        bottom,
        zIndex: 100,
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {open && (
        <div
          style={{
            width: 'min(370px, calc(100vw - 32px))',
            height: narrow
              ? 'min(540px, calc(100dvh - 100px - env(safe-area-inset-bottom, 0px)))'
              : 'min(540px, calc(100dvh - 110px - env(safe-area-inset-bottom, 0px)))',
            maxHeight: 'calc(100dvh - 88px - env(safe-area-inset-bottom, 0px))',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(27,58,45,.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 14,
            animation: 'chatIn .25s ease-out',
          }}
        >
          <div style={{ background: '#1B3A2D', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ borderRadius: '50%', boxShadow: '0 0 0 2px rgba(255,255,255,.9)', flexShrink: 0 }}>
              <ElliePhoto size={40} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, letterSpacing: '-0.011em' }}>Ellie · Swift Clear</div>
              <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.84)' }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,.22)', flexShrink: 0 }} />
                Here to help
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Minimise chat" style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, cursor: 'pointer', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>–</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const, padding: 14, background: '#F8F4EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => {
              const mine = m.from === 'me'
              const chips = m.r.chips?.length && i === msgs.length - 1 && i > 0 && !typing ? m.r.chips : []
              const body = (
                <>
                  <div style={{ background: mine ? '#E08B20' : '#fff', color: mine ? '#fff' : '#1f2a24', padding: '10px 14px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 3px rgba(27,58,45,.08)', wordBreak: 'break-word' }}>{m.r.text}</div>
                  {m.r.link && (
                    <Link href={m.r.link.href} style={{ display: 'inline-block', marginTop: 6, background: '#1B3A2D', color: '#fff', padding: '10px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{m.r.link.label}</Link>
                  )}
                  {chips.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {chips.map(c => (
                        <button key={c} type="button" onClick={() => send(c)} style={{ background: 'transparent', border: '1px solid rgba(27,58,45,.18)', color: '#3e5348', padding: '6px 10px', borderRadius: 999, fontSize: 12, lineHeight: 1.3, cursor: 'pointer', minHeight: 36 }}>{c}</button>
                      ))}
                    </div>
                  )}
                </>
              )
              if (mine) {
                return (
                  <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>{body}</div>
                )
              }
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'flex-start', maxWidth: '100%' }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <ElliePhoto size={32} />
                  </div>
                  <div style={{ minWidth: 0, maxWidth: 'calc(100% - 40px)' }}>{body}</div>
                </div>
              )
            })}
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'flex-end' }} aria-live="polite" aria-label="Ellie is typing">
                <ElliePhoto size={32} />
                <div style={{ background: '#fff', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, boxShadow: '0 1px 3px rgba(27,58,45,.08)' }}>
                  <span className="sc-type-dot" />
                  <span className="sc-type-dot" />
                  <span className="sc-type-dot" />
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
          <form onSubmit={e => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee', background: '#fff' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message Ellie…"
              aria-label="Message Ellie"
              enterKeyHint="send"
              style={{ flex: 1, minWidth: 0, border: '1px solid #ddd', borderRadius: 999, padding: '12px 14px', fontSize: 16, outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" aria-label="Send" style={{ background: '#E08B20', color: '#fff', border: 0, borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>➤</button>
          </form>
        </div>
      )}
      {!open && teaser && (
        <div
          onClick={openChat}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat() } }}
          style={{
            position: 'absolute',
            right: narrow ? 0 : 76,
            bottom: narrow ? 76 : 10,
            width: narrow ? 'min(240px, calc(100vw - 96px))' : 236,
            maxWidth: 'calc(100vw - 96px)',
            background: '#fff',
            color: '#1f2a24',
            padding: '10px 14px',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(27,58,45,.16)',
            fontSize: 13.5,
            lineHeight: 1.45,
            cursor: 'pointer',
            animation: 'chatIn .3s ease-out',
            zIndex: 1,
          }}
        >
          {WEBSITE_TEASER}
          <span
            aria-hidden="true"
            style={narrow ? {
              position: 'absolute',
              bottom: -6,
              right: 22,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #fff',
            } : {
              position: 'absolute',
              right: -7,
              bottom: 18,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: '7px solid #fff',
            }}
          />
        </div>
      )}
      <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0, zIndex: 2 }}>
        <button
          type="button"
          className="sc-chat-launch"
          onClick={() => {
            if (open) setOpen(false)
            else openChat()
          }}
          aria-label={open ? 'Close chat' : 'Open chat with Ellie'}
          aria-expanded={open}
          style={{
            display: 'block',
            width: 62,
            height: 62,
            padding: 0,
            borderRadius: '50%',
            border: '3px solid #fff',
            background: '#1B3A2D',
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(27,58,45,.28)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ElliePhoto size={56} fill />
          {open && (
            <span style={{ position: 'absolute', inset: 0, background: 'rgba(27,58,45,.72)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, lineHeight: 1 }}>×</span>
          )}
        </button>
        {!open && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: -1,
              bottom: -1,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#4ade80',
              border: '2px solid #fff',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes chatIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes scDot { 0%, 80%, 100% { opacity: .28; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        .sc-type-dot { width: 6px; height: 6px; border-radius: 50%; background: #1B3A2D; display: block; animation: scDot 1.2s infinite; }
        .sc-type-dot:nth-child(2) { animation-delay: .15s; }
        .sc-type-dot:nth-child(3) { animation-delay: .3s; }
        .sc-chat-launch:focus-visible { outline: 3px solid #E08B20; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .sc-chat-root, .sc-chat-root * { animation: none !important; }
          .sc-type-dot { opacity: .7; }
        }
      `}</style>
    </div>
  )
}
