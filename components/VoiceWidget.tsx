'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

type Line = { role: 'user' | 'assistant'; text: string }
type WebConfig = { assistantId: string; publicKey: string | null; configured: boolean }

const GREEN = '#1B3A2D'
const AMBER = '#E08B20'
const CREAM = '#F8F4EE'

export default function VoiceWidget() {
  const vapiRef = useRef<Vapi | null>(null)
  const [cfg, setCfg] = useState<WebConfig | null>(null)
  const [cfgError, setCfgError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [narrow, setNarrow] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vapi/web-config')
        const data = (await res.json()) as WebConfig & { error?: string }
        if (cancelled) return
        if (!res.ok) {
          setCfgError(data.error || 'Could not load voice config')
          return
        }
        setCfg(data)
      } catch {
        if (!cancelled) setCfgError('Could not load voice config')
      }
    })()
    return () => {
      cancelled = true
      try {
        vapiRef.current?.stop()
      } catch {
        /* ignore */
      }
      vapiRef.current = null
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, open, speaking])

  const ensureVapi = useCallback(() => {
    if (!cfg?.publicKey) return null
    if (vapiRef.current) return vapiRef.current
    const v = new Vapi(cfg.publicKey)
    v.on('call-start', () => {
      setConnected(true)
      setBusy(false)
      setError(null)
    })
    v.on('call-end', () => {
      setConnected(false)
      setSpeaking(false)
      setBusy(false)
    })
    v.on('speech-start', () => setSpeaking(true))
    v.on('speech-end', () => setSpeaking(false))
    v.on(
      'message',
      (message: {
        type?: string
        role?: string
        transcript?: string
        transcriptType?: string
      }) => {
        if (message.type !== 'transcript' || !message.transcript) return
        if (message.transcriptType && message.transcriptType !== 'final') return
        const role = message.role === 'user' ? 'user' : 'assistant'
        setLines((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === role && last.text === message.transcript) return prev
          return [...prev, { role, text: message.transcript! }]
        })
      },
    )
    v.on('error', (err: unknown) => {
      console.error('Vapi web error', err)
      setBusy(false)
      setError(
        typeof err === 'string'
          ? err
          : 'Voice call failed. Check the public key and mic permission.',
      )
    })
    vapiRef.current = v
    return v
  }, [cfg])

  async function startCall() {
    setError(null)
    setOpen(true)
    if (!cfg?.configured || !cfg.publicKey) {
      setError('missing-key')
      return
    }
    const v = ensureVapi()
    if (!v) {
      setError('missing-key')
      return
    }
    setBusy(true)
    setLines([])
    try {
      await v.start(cfg.assistantId)
    } catch (e) {
      console.error(e)
      setBusy(false)
      setError('Could not start Ellie. Allow the microphone, then try again.')
    }
  }

  function endCall() {
    try {
      vapiRef.current?.stop()
    } catch {
      /* ignore */
    }
    setConnected(false)
    setSpeaking(false)
    setBusy(false)
  }

  function closePanel() {
    if (connected) endCall()
    setOpen(false)
  }

  const statusLabel = connected
    ? speaking
      ? 'Ellie is speaking…'
      : 'Listening…'
    : busy
      ? 'Connecting…'
      : 'Ready when you are'

  // Stack above Clearbot FAB (56px) + gap; respect iOS safe area
  const bottom = 'calc(16px + 56px + 12px + env(safe-area-inset-bottom, 0px))'
  const edge = 'max(16px, env(safe-area-inset-right))'

  const micIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )

  return (
    <div
      style={{
        position: 'fixed',
        right: edge,
        bottom,
        zIndex: 110,
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {open && (
        <div
          style={{
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'min(420px, calc(100dvh - 160px - env(safe-area-inset-bottom, 0px)))',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,.28)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'ellieIn .25s ease-out',
          }}
        >
          <div
            style={{
              background: GREEN,
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: AMBER,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>Ellie</div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: connected ? (speaking ? '#f87171' : '#4ade80') : '#a8a29e',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: speaking ? 'elliePulse 1s infinite' : undefined,
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{statusLabel}</span>
              </div>
            </div>
            <button
              onClick={closePanel}
              aria-label="Close Ellie"
              style={{
                background: 'none',
                border: 0,
                color: '#fff',
                fontSize: 22,
                cursor: 'pointer',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              –
            </button>
          </div>

          <div
            style={{
              padding: 14,
              background: CREAM,
              flex: 1,
              minHeight: 0,
              maxHeight: narrow ? 200 : 260,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as const,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {error === 'missing-key' || (cfg && !cfg.configured) || cfgError ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: '#1f2a24',
                  wordBreak: 'break-word',
                }}
              >
                <strong style={{ color: GREEN }}>One more step to talk on the site</strong>
                <p style={{ margin: '8px 0' }}>
                  Browser voice needs a <strong>Vapi Public</strong> key (not the private key). Private
                  keys stay on the server only.
                </p>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Open{' '}
                    <a
                      href="https://dashboard.vapi.ai/org/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: GREEN }}
                    >
                      Vapi → API Keys → Public
                    </a>
                  </li>
                  <li>
                    Add Key → allow origin <code>http://localhost:3100</code> → assistant Swift Clear
                    Receptionist
                  </li>
                  <li>
                    Put it in <code>.env.local</code> as{' '}
                    <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY=...</code> (or <code>VAPI_PUBLIC_KEY=...</code>)
                  </li>
                  <li>
                    Restart <code>npm run dev -- -p 3100</code>, then click Talk again
                  </li>
                </ol>
                {cfgError && (
                  <p style={{ marginTop: 8, color: '#b91c1c' }}>{cfgError}</p>
                )}
              </div>
            ) : lines.length === 0 && !connected && !busy ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#1f2a24',
                }}
              >
                Tap <strong>Start talking</strong>, allow the mic, then say something like “I need a
                sofa collected tomorrow in SW1A.”
              </div>
            ) : (
              lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: l.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                  }}
                >
                  <div
                    style={{
                      background: l.role === 'user' ? AMBER : '#fff',
                      color: l.role === 'user' ? '#fff' : '#1f2a24',
                      padding: '8px 12px',
                      borderRadius:
                        l.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13,
                      lineHeight: 1.45,
                      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {l.text}
                  </div>
                </div>
              ))
            )}
            {error && error !== 'missing-key' && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 12,
                  wordBreak: 'break-word',
                }}
              >
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div
            style={{
              padding: 12,
              borderTop: '1px solid #eee',
              background: '#fff',
              display: 'flex',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {!connected ? (
              <button
                onClick={startCall}
                disabled={busy}
                style={{
                  flex: 1,
                  background: GREEN,
                  color: '#fff',
                  border: 0,
                  borderRadius: 999,
                  padding: '14px 16px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  minHeight: 48,
                }}
              >
                {busy ? 'Connecting…' : '🎤 Start talking'}
              </button>
            ) : (
              <button
                onClick={endCall}
                style={{
                  flex: 1,
                  background: '#dc2626',
                  color: '#fff',
                  border: 0,
                  borderRadius: 999,
                  padding: '14px 16px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                End call
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (open) closePanel()
          else {
            setOpen(true)
            setError(null)
          }
        }}
        aria-label="Talk to Ellie"
        title="Talk to Ellie"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: narrow ? 0 : 10,
          width: narrow ? 56 : undefined,
          height: 56,
          padding: narrow ? 0 : '0 18px 0 14px',
          borderRadius: 999,
          border: 0,
          background: connected ? '#dc2626' : GREEN,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: connected
            ? '0 8px 24px rgba(220,38,38,.45)'
            : '0 8px 24px rgba(27,58,45,.45)',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
          animation: open || connected ? undefined : 'elliePulseRing 2.6s infinite',
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: AMBER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {connected ? (
            <span style={{ fontSize: 16 }}>■</span>
          ) : (
            micIcon
          )}
        </span>
        {!narrow && (connected ? 'End Ellie' : 'Talk to Ellie')}
      </button>

      <style>{`
        @keyframes ellieIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes elliePulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes elliePulseRing{0%{box-shadow:0 0 0 0 rgba(27,58,45,.5)}70%{box-shadow:0 0 0 16px rgba(27,58,45,0)}100%{box-shadow:0 0 0 0 rgba(27,58,45,0)}}
      `}</style>
    </div>
  )
}
