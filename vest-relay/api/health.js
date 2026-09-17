import { redis, onlineKey, cors, authed, cleanRoom } from "./_lib.js";

// The controller UI calls this every few seconds to show whether the vest PC's
// agent is currently connected (i.e. has polled recently).

export default async function handler(req, res) {
  cors(res, "GET");
  if (req.method === "OPTIONS") return res.status(204).end();

  const token = req.query.token;
  if (!authed(token)) return res.status(401).json({ error: "bad token" });
  const room = cleanRoom(req.query.room);
  if (!room) return res.status(400).json({ error: "invalid room" });

  try {
    const v = await redis.get(onlineKey(room));
    return res.status(200).json({ agentOnline: !!v });
  } catch (e) {
    return res.status(200).json({ agentOnline: false, error: String(e && e.message || e) });
  }
}
