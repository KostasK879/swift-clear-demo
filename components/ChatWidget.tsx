'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { GREETING, reply, type Reply } from '@/lib/chatbot'

type Msg = { from: 'bot' | 'me'; r: Reply }

export default function ChatWidget({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', r: GREETING }])
  const [narrow, setNarrow] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setTeaser(true), 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    onOpenChange?.(open)
    return () => onOpenChange?.(false)
  }, [open, onOpenChange])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing, open])

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    setInput('')
    setMsgs(m => [...m, { from: 'me', r: { text: t } }])
    setTyping(true)
    setTimeout(() => {
      setMsgs(m => [...m, { from: 'bot', r: reply(t) }])
      setTyping(false)
    }, 600)
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
            boxShadow: '0 20px 60px rgba(0,0,0,.28)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 14,
            animation: 'chatIn .25s ease-out',
          }}
        >
          <div style={{ background: '#1B3A2D', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E08B20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>♻️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>Clearbot</div>
              <div style={{ fontSize: 12, opacity: .75 }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#4ade80', marginRight: 6 }} />Online · replies instantly</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Minimise chat" style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, cursor: 'pointer', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>–</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const, padding: 14, background: '#F8F4EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ background: m.from === 'me' ? '#E08B20' : '#fff', color: m.from === 'me' ? '#fff' : '#1f2a24', padding: '10px 14px', borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,.08)', wordBreak: 'break-word' }}>{m.r.text}</div>
                {m.r.link && (
                  <Link href={m.r.link.href} style={{ display: 'inline-block', marginTop: 6, background: '#1B3A2D', color: '#fff', padding: '10px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{m.r.link.label}</Link>
                )}
                {m.r.chips && i === msgs.length - 1 && !typing && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {m.r.chips.map(c => (
                      <button key={c} onClick={() => send(c)} style={{ background: '#fff', border: '1px solid #1B3A2D', color: '#1B3A2D', padding: '8px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer', minHeight: 36 }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: 16, fontSize: 14, color: '#888' }}>typing…</div>}
            <div ref={end} />
          </div>
          <form onSubmit={e => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee', background: '#fff' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question…"
              enterKeyHint="send"
              style={{ flex: 1, minWidth: 0, border: '1px solid #ddd', borderRadius: 999, padding: '12px 14px', fontSize: 16, outline: 'none' }}
            />
            <button type="submit" aria-label="Send" style={{ background: '#E08B20', color: '#fff', border: 0, borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>➤</button>
          </form>
        </div>
      )}
      {!open && teaser && (
        <div
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
          style={{
            position: 'absolute',
            right: narrow ? 0 : 70,
            // Clear the stacked Ellie launcher (56px) + gap (12px) + launcher (56px) + 8px.
            bottom: narrow ? 132 : 8,
            width: narrow ? 'min(220px, calc(100vw - 32px))' : 210,
            maxWidth: 'calc(100vw - 32px)',
            background: '#fff',
            padding: '10px 14px',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            fontSize: 13,
            lineHeight: 1.4,
            cursor: 'pointer',
            animation: 'chatIn .3s ease-out',
            zIndex: 1,
          }}
        >
          👋 Need a quick price? Ask me, it takes 10 seconds.
        </div>
      )}
      <button
        onClick={() => { setOpen(o => !o); setTeaser(false) }}
        aria-label="Open chat"
        style={{
          display: 'flex',
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 0,
          background: '#E08B20',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(224,139,32,.5)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
          animation: open ? undefined : 'chatPulse 2.4s infinite',
        }}
      >
        {open ? <span style={{ fontSize: 24 }}>×</span> : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        )}
      </button>
      <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes chatPulse{0%{box-shadow:0 0 0 0 rgba(224,139,32,.55)}70%{box-shadow:0 0 0 16px rgba(224,139,32,0)}100%{box-shadow:0 0 0 0 rgba(224,139,32,0)}}`}</style>
    </div>
  )
}
