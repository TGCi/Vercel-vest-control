import { redis, cmdKey, onlineKey, cors, authed, cleanRoom } from "./_lib.js";

// The agent (on the vest PC) calls this in a loop. The request is held open for
// up to HOLD_MS while we watch the queue; as soon as commands appear we return
// them, otherwise we return an empty list and the agent immediately re-polls.
//
// Holding the request open is what lets Vercel "push down" without a socket.
// With Fluid Compute (the default runtime mode) a function may run up to 300s;
// we stay well under that and the agent tolerates an early return either way.

const HOLD_MS = 20000; // how long one poll waits before returning empty
const STEP_MS = 300;   // how often we check the queue while waiting
const DRAIN = 20;      // max commands pulled per poll
const ONLINE_TTL = 45; // seconds the room is considered "online" after a poll

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  cors(res, "GET");
  if (req.method === "OPTIONS") return res.status(204).end();

  const token = req.query.token;
  if (!authed(token)) return res.status(401).json({ error: "bad token" });
  const room = cleanRoom(req.query.room);
  if (!room) return res.status(400).json({ error: "invalid room" });

  const key = cmdKey(room);

  // Mark this room's agent as alive so the controller can show "vest online".
  try { await redis.set(onlineKey(room), "1", { ex: ONLINE_TTL }); } catch {}

  const deadline = Date.now() + HOLD_MS;
  try {
    while (Date.now() < deadline) {
      // lpop with a count returns an array (or null) — oldest first.
      const items = await redis.lpop(key, DRAIN);
      if (items && items.length) {
        const commands = items.map((it) => {
          if (it && typeof it === "object") return it;      // client auto-parsed JSON
          try { return JSON.parse(it); } catch { return null; }
        }).filter(Boolean);
        if (commands.length) return res.status(200).json({ commands });
      }
      await sleep(STEP_MS);
    }
    return res.status(200).json({ commands: [] });
  } catch (e) {
    // Never make the agent crash on a transient store error — it just re-polls.
    return res.status(200).json({ commands: [], error: String(e && e.message || e) });
  }
}
