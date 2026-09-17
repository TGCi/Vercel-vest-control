# Vest Relay — control your X40 from anywhere, no open ports

Three parts:

- **Controller UI** (`/`) — the body map. Open it anywhere; it sends commands
  to the relay API.
- **Relay API** (`/api/*`) — three tiny Vercel functions that pass commands
  through a small store (Upstash Redis). No socket relay, so Vercel's
  per-instance limits don't bite.
- **Agent** (`/agent`) — a page you open **on the vest PC**. It dials *out* to
  the relay (nothing inbound → no firewall changes) and forwards commands into
  bHaptics Player locally.

```
[Controller UI]  --POST /api/send-->  [Vercel + Upstash]  <--GET /api/poll (held open)--  [Agent on vest PC]  --ws://127.0.0.1:15881-->  Player --> vest
   (anywhere, https)                    (the relay)              (dials OUT, no ports)
```

Only bHaptics Player is required on the vest PC — same as before.

---

## Deploy (one time, ~5 min)

1. **Get the code on GitHub** (or use the Vercel CLI). Push this folder to a repo.

2. **Import to Vercel** → New Project → pick the repo → Deploy. It builds as-is.

3. **Add a Redis store.** In the project: **Storage → Create → Upstash Redis**
   (Marketplace). Connect it to the project. This auto-adds the
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars (the code also
   accepts the `KV_REST_API_*` names).

4. **Set your shared secret.** Project → **Settings → Environment Variables** →
   add `RELAY_TOKEN` = a long random string. This is the password both the
   controller and the agent must present.

5. **Confirm Fluid Compute is on** (Settings → Functions). It's the default now;
   it's what lets the poll request stay open. Then **Redeploy** so the env vars
   and settings take effect.

Your app is at `https://<your-app>.vercel.app`.

---

## Use it

**On the vest PC** (use Chrome or Edge):
1. Start bHaptics Player, make sure the X40 is paired.
2. Open `https://<your-app>.vercel.app/agent`.
3. Enter your **Room** (any name you pick, e.g. `my-vest`) and the **Token**
   (the `RELAY_TOKEN` value). Leave Host/Port at `127.0.0.1` / `15881`.
   Click **Save & (re)connect**. Both dots go teal: Player + Relay.
   Leave this window open.

**Anywhere** (phone, laptop, another PC):
1. Open `https://<your-app>.vercel.app/`.
2. Enter the **same Room and Token**, click **Save**. Header shows "vest online".
3. Click motors — they fire on the vest through the relay.

`Esc` / red button on the controller sends a stop. On the agent, the local
**STOP** and **Pause remote** always win over the remote side.

---

## Notes & limits

- **Latency:** every buzz makes a cloud round trip, so it's a touch laggier than
  LAN/Tailscale. Set the project **region** (Settings → Functions) near you to
  minimise it. Fine for manual control; not for tight real-time patterns.
- **Keep the agent tab open and foregrounded.** Browsers throttle background
  tabs, which can delay polling. If you want a headless, always-on agent that
  runs as a background service instead of a tab, ask — it's a ~40-line Node
  version of `/agent` that behaves identically.
- **Security is token-level.** Anyone with your URL + room + token can drive the
  vest. Treat the token like a password; rotate it by changing `RELAY_TOKEN`.
  Because it's a device on a body, the agent's local STOP/Pause is the real
  safety layer and never depends on the remote side.
- **Pulses are time-bounded** (each carries its own duration) and the queue
  self-expires after 30s, so a dropped connection can't leave a motor stuck on.

## Optional: launch the agent as an app window

Put `Launch Agent.bat` (below) on the vest PC's desktop, edit the URL inside to
your deployment, and double-click it to open the agent in a clean Edge window.
