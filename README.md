# Vest Relay — realtime X40 control from anywhere, no open ports

Realtime over **Ably** (free tier). Three parts:

- **Controller UI** (`/`) — the vest body map. Drag to fire motors; publishes commands live.
- **Token API** (`/api/ably-token`) — one Vercel function that hands out short-lived,
  room-scoped Ably tokens. Your Ably secret stays on the server; access is gated by
  your `RELAY_TOKEN`.
- **Agent** (`VestAgent.html`, run locally on the vest PC) — subscribes to the room in
  realtime and drives bHaptics Player. Shows a live read-only view of what's firing.

```
[Controller]  --wss-->  [ Ably realtime ]  <--wss--  [Agent on vest PC]  --ws://127.0.0.1:15881-->  Player --> vest
   (Vercel, https)        (nearest edge)              (local file, dials OUT)
```

Nothing inbound on the vest PC (no firewall changes), everything encrypted, and messages
route through Ably's nearest edge — lower latency than the old polling relay.

---

## Deploy (one time)

1. **Ably key.** Sign up free at ably.com → create an app → copy its **Root API key**
   (looks like `xxxx.yyyy:zzzz`). Free tier: 6M messages/month, 200 connections.

2. **Deploy to Vercel.** Upload this folder (or import the repo). It builds as-is and
   installs the `ably` dependency.

3. **Environment variables** (Project → Settings → Environment Variables):
   - `ABLY_API_KEY` = the Ably root key from step 1
   - `RELAY_TOKEN`  = a long random string (your shared password for both ends)

4. **Redeploy** so the variables take effect. Confirm it works by opening
   `https://<your-app>.vercel.app/api/ably-token?room=test&token=YOUR_TOKEN` —
   you should get JSON with a `keyName`/`mac` (a token request). `bad token` means the
   token doesn't match; an `ABLY_API_KEY not set` error means the key didn't save.

No database, no Upstash — Ably is the realtime layer.

---

## Use it

**On the vest PC** (Chrome or Edge): open the local file **`VestAgent.html`**
(not the hosted `/agent` — an https page can't reach `ws://localhost`). Start bHaptics
Player with the X40 paired. Set **Relay base URL** = `https://<your-app>.vercel.app`,
your **Room** (any name) and **Token**, leave Host/Port at `127.0.0.1` / `15881`, and
**Save & (re)connect**. Both dots go teal (Player + Relay). Leave it open.

**Anywhere:** open `https://<your-app>.vercel.app/`, enter the **same Room and Token**,
Save. Header shows "vest online". Drag across the vests — motors fire live and the
wearer's screen mirrors them.

`Esc` / red button = stop. On the agent, **Pause remote** and **Disconnect** always win.

---

## Notes

- **Free-tier headroom:** dragging streams ~16 messages/sec. Ably's free cap is 6M/month
  and 50 msg/sec per channel, so normal use is well within it; only many hours of
  continuous dragging would approach the monthly cap.
- **Latency:** realtime, but still a cloud round-trip — very usable, not zero. Same-network
  users who want the absolute lowest latency could run a LAN/Tailscale path instead.
- **Security:** the Ably secret never leaves Vercel; clients get room-scoped tokens, gated
  by `RELAY_TOKEN`. Treat that token like a password. The agent's local stop is the real
  safety layer and never depends on the network.
- **Keep the agent window open and foregrounded** (browsers throttle background tabs). A
  headless Node agent removes that caveat — ask if you want it.
