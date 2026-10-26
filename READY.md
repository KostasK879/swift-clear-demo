# Ellie is ready - quick start

**Updated:** 26 Oct 2026 (Europe/London)

## Links (while this PC keeps these processes running)

| What | URL |
| --- | --- |
| Website + Clearbot + Ellie web voice | http://localhost:3100 |
| Ellie how-to page | http://localhost:3100/demo-voice |
| **Public tunnel (Vapi webhook)** | https://floating-diabetes-gbp-gbp.trycloudflare.com |
| Public demo page | https://floating-diabetes-gbp-gbp.trycloudflare.com/demo-voice |
| Webhook path | `POST https://floating-diabetes-gbp-gbp.trycloudflare.com/api/vapi` |

If the tunnel URL stops working, restart it:

```powershell
& "$env:TEMP\cloudflared.exe" tunnel --url http://localhost:3100
```

(Dev server must already be on port 3100: `npm run dev -- -p 3100`)

## Talk to Ellie on the website

1. Create a **Public** API key at https://dashboard.vapi.ai/org/api-keys  
   - Allowed Origins: `http://localhost:3100` (and your tunnel URL if you share it)  
   - Allowed Assistants: Swift Clear Receptionist  
2. Add to `.env.local` (never commit):

```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=fe2e9be2-9621-4ec1-99b1-7f315d19f69c
```

   (Or use server-only `VAPI_PUBLIC_KEY=` — the site loads it via `/api/vapi/web-config`. Never put the **private** key in `NEXT_PUBLIC_*`.)

3. Restart the dev server, open http://localhost:3100, click the green **Talk to Ellie** pill, allow mic, **Start talking**.

The private `VAPI_API_KEY` is only for server scripts / webhook setup. Vapi rejects it for browser web calls.

## Hear Ellie via Vapi dashboard (fallback)

```powershell
$env:VAPI_API_KEY="paste-your-private-key-here"
$env:SERVER_URL="https://floating-diabetes-gbp-gbp.trycloudflare.com"
$env:VAPI_SECRET="demo-local-secret"
$env:HUMAN_TRANSFER_NUMBER="+447xxxxxxxxx"
node scripts/setup-vapi.mjs
```

Then Vapi → **Swift Clear Receptionist** → **Talk to Assistant**.

## What works now

- Clearbot chat bubble on every page
- Green **Talk to Ellie** web voice widget (needs public key)
- Ellie tools: quote prices, check slots, book, SMS (demo-logged without Twilio)
- Transfer-to-human via `HUMAN_TRANSFER_NUMBER`
- ElevenLabs British voice (Lily)
- `/demo-voice` instructions page

## Still need for a real UK phone number + SMS

| Item | Why |
| --- | --- |
| Vapi **public** key | In-browser Talk to Ellie |
| Vapi private key | Create/update assistant, server scripts |
| Twilio Account SID, Auth Token, From number | Real mid-call SMS |
| UK Twilio number imported into Vapi | Customers can dial Ellie |
| Your mobile as `HUMAN_TRANSFER_NUMBER` | "Put me through to a person" |

## Files

- `components/VoiceWidget.tsx` - in-browser Ellie
- `app/api/vapi/web-config/route.ts` - public key + assistant id for the browser (no private key)
- `app/api/vapi/route.ts` - webhook tools
- `vapi/assistant.json` - Ellie prompt + voice + tools
- `scripts/setup-vapi.mjs` - push config to Vapi
- `app/demo-voice/page.tsx` - review page
- `VOICE.md` - full detail + 90s demo script
- `.env.local.example` - env var names

Nothing was committed or pushed.
