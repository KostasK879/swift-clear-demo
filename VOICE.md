# Swift Clear AI phone receptionist (Vapi) — Ellie

"Ellie" answers the phone, quotes from `lib/pricing.ts`, checks the diary, books a slot,
texts a confirmation mid-call, and can transfer to a human. She uses the same storage as the
website (Supabase, or the in-memory demo store when `DEMO_MODE=1` or Supabase isn't configured).

| File | What it does |
| --- | --- |
| `app/api/vapi/route.ts` | Webhook for tools: `get_price`, `check_availability`, `create_booking`, `send_sms` |
| `vapi/assistant.json` | Assistant config: ElevenLabs British voice, prompt, tools + `transferCall` / `endCall` |
| `scripts/setup-vapi.mjs` | Creates/updates the assistant on Vapi and prints its id |

## What's new (matching the Instagram reels)

1. **SMS confirmation mid-call** — after booking, Ellie calls `send_sms` and texts the caller a short summary (reference, date, slot, address, price). Uses Twilio when `TWILIO_*` env vars are set; otherwise logs the SMS and returns success (demo-safe).
2. **Transfer to a human** — built-in Vapi `transferCall` to `HUMAN_TRANSFER_NUMBER`. If asked "are you AI?", she discloses and offers to transfer; if they want a person, she transfers.
3. **Better voice** — ElevenLabs (`11labs`) Flash v2.5, default voice **Lily** (`pFZP5JQG7iQjIQuC4Bku`, British female). Override with `ELEVENLABS_VOICE_ID`. STT stays Deepgram `en-GB`.

## Env vars

Add these to `.env.local` (and your Vercel / tunnel host):

```
DEMO_MODE=1
VAPI_SECRET=some-long-random-string

# Twilio (real SMS). Without these, send_sms still "succeeds" in demo and logs the body.
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Used by scripts/setup-vapi.mjs when pushing assistant.json to Vapi
HUMAN_TRANSFER_NUMBER=+447xxxxxxxxx
ELEVENLABS_VOICE_ID=pFZP5JQG7iQjIQuC4Bku
```

## Setup (live phone / Talk to Assistant)

1. **Deploy or tunnel** so Vapi can reach the webhook (localhost alone is not enough for voice):
   - Deploy: `vercel --prod`, or
   - Tunnel: `npx cloudflared tunnel --url http://localhost:3100` / `ngrok http 3100`
2. **Pick a secret**: `VAPI_SECRET=...` in `.env.local` and on the host.
3. **Vapi account** at https://dashboard.vapi.ai — copy your **private** API key.
4. **Create/update the assistant** (PowerShell):
   ```powershell
   $env:VAPI_API_KEY="..."
   $env:SERVER_URL="https://your-tunnel-or-vercel-url"
   $env:VAPI_SECRET="same-as-step-2"
   $env:HUMAN_TRANSFER_NUMBER="+447..."   # your phone for transfers
   # optional: $env:ELEVENLABS_VOICE_ID="..."
   node scripts/setup-vapi.mjs
   ```
5. **UK number** (optional for demos): Twilio Buy → import into Vapi → Inbound assistant = Swift Clear Receptionist.
6. **Quick voice test without a number:** open the assistant in the Vapi dashboard → **Talk to Assistant** (browser mic). This still needs a public `SERVER_URL` for tools.

## How to try on localhost (website + chatbot)

You **cannot** hear Ellie from the website alone — Vapi needs an API key and a public URL for the webhook. Localhost is for the site and Clearbot chat.

1. From the `swift-clear` folder:
   ```powershell
   npm run dev -- -p 3100
   ```
2. Open **http://localhost:3100** — landing page, quote wizard, amber Clearbot bubble (bottom-right).
3. Admin (if `ADMIN_PASSWORD` is set): **http://localhost:3100/admin**

### Optional: smoke-test `send_sms` in DEMO_MODE

With the dev server running:

```powershell
curl -X POST http://localhost:3100/api/vapi `
  -H "Content-Type: application/json" `
  -d "{\"message\":{\"type\":\"tool-calls\",\"toolCallList\":[{\"id\":\"t1\",\"function\":{\"name\":\"send_sms\",\"arguments\":{\"to\":\"07700900123\",\"message\":\"Swift Clear: booked Fri 10am, £140. Ref DEMO1234.\"}}}]}}"
```

Check the terminal: you should see `[Ellie SMS DEMO]` with the body. The JSON response should include a success `result`.

## Demo call script (~90 seconds)

> **Ellie:** Hi, thanks for calling Swift Clear, this is Ellie, the AI assistant. Are you looking to get something cleared?
> **You:** Yeah, I've got an old sofa and a fridge to get rid of.
> **Ellie:** No problem. The sofa's seventy pounds and the fridge is seventy, so a hundred and forty all-in. What day suits you?
> **You:** Friday?
> **Ellie:** Friday I've got 10am, 12pm and 4pm free. Which works?
> **You:** 10am. Deacon, 07700 900123, 12 High Street, E1 6AN.
> **Ellie:** … Shall I book that in?
> **You:** Yes.
> **Ellie:** Done — I've just texted the confirmation. Your reference is A1B2C3D4…
> **You (curveball):** Are you a real person?
> **Ellie:** I'm an AI assistant for Swift Clear — happy to keep helping, or I can put you through to someone on the team.
> **You:** Put me through.
> **Ellie:** Of course — putting you through now. *(transferCall)*

Other curveballs: "Can you take asbestos?" (refused), re-book a taken slot (she offers another).

Bookings then appear in `/admin`.

## Notes

- Phone bookings have no email unless the caller gives one; SMS is the mid-call confirmation path.
- In demo mode bookings live in memory and reset on redeploy / cold start.
- Real SMS needs Twilio. Real transfer needs a real `HUMAN_TRANSFER_NUMBER` and a live phone call (not browser Talk-to-Assistant for transfer testing).
- To re-skin for another trade: change the prompt, prices in `lib/pricing.ts`, the name and the voice id.

## In-browser voice (website widget)

1. Create a **Public** API key in the Vapi dashboard (API Keys → Public).
2. Set `NEXT_PUBLIC_VAPI_PUBLIC_KEY` (or `VAPI_PUBLIC_KEY`) in `.env.local`.
3. Open http://localhost:3100 and click **Talk to Ellie** (green pill above Clearbot).
4. Allow the microphone and speak.

Do **not** expose `VAPI_API_KEY` (private) to the browser. Vapi rejects private keys for `/call/web`.

