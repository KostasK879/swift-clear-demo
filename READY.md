# Ellie is ready - quick start

**Updated:** 26 Oct 2026 (Europe/London)

## Links (while this PC keeps these processes running)

| What | URL |
| --- | --- |
| Website + Ellie chat | http://localhost:3100 |
| Ellie how-to page | http://localhost:3100/demo-voice |
| **Public tunnel (Vapi webhook)** | https://floating-diabetes-gbp-gbp.trycloudflare.com |
| Public demo page | https://floating-diabetes-gbp-gbp.trycloudflare.com/demo-voice |
| Webhook path | `POST https://floating-diabetes-gbp-gbp.trycloudflare.com/api/vapi` |

If the tunnel URL stops working, restart it:

```powershell
& "$env:TEMP\cloudflared.exe" tunnel --url http://localhost:3100
```

(Dev server must already be on port 3100: `npm run dev -- -p 3100`)

## Talk to Ellie

Ellie is on the phone, not a button on the website. Set `NEXT_PUBLIC_PHONE_NUMBER` to the real Twilio/Vapi UK number (do not use 020 7946 0000). Customers ring that number.

The amber chat bubble is Ellie in writing. Set `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` for the model. With neither key, the keyword replies are used.

After each call or booking, a summary is logged on `/admin`. Set `OWNER_SMS_NUMBER` (and the Twilio keys) to text it to your mobile.

The private `VAPI_API_KEY` is only for server scripts / webhook setup.

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

- Ellie chat bubble on every page (model if a key is set, otherwise keyword replies)
- Ellie tools: quote prices, check slots, book, SMS to the caller and a summary to the owner (demo-logged without Twilio)
- Transfer-to-human via `HUMAN_TRANSFER_NUMBER`
- ElevenLabs British voice (Lily)
- `/demo-voice` instructions page

## Still need for a real UK phone number + SMS

| Item | Why |
| --- | --- |
| `NEXT_PUBLIC_PHONE_NUMBER` | The number printed on the site |
| `OWNER_SMS_NUMBER` | Your mobile for the call summary text |
| Vapi private key | Create/update assistant, server scripts |
| Twilio Account SID, Auth Token, From number | Real SMS (caller confirmation and your summary) |
| UK Twilio number imported into Vapi | Customers can dial Ellie |
| Your mobile as `HUMAN_TRANSFER_NUMBER` | "Put me through to a person" |

## Files

- `app/api/chat/route.ts` - website chat (model, or keyword fallback)
- `app/api/vapi/route.ts` - webhook tools and the owner summary after a call
- `vapi/assistant.json` - Ellie prompt + voice + tools
- `scripts/setup-vapi.mjs` - push config to Vapi
- `app/demo-voice/page.tsx` - review page
- `VOICE.md` - full detail + 90s demo script
- `.env.local.example` - env var names

Nothing was committed or pushed.
