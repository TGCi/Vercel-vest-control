import { Rest } from "ably";
import { cors, authed, cleanRoom } from "./_lib.js";

// Mints a short-lived Ably token scoped to this room's channel. The Ably secret
// stays here on the server; the browser and agent only ever get a scoped token.
// Access is gated by RELAY_TOKEN, so the same secret you already use still applies.

export default async function handler(req, res) {
  cors(res, "GET");
  if (req.method === "OPTIONS") return res.status(204).end();

  const token = req.query.token;
  if (!authed(token)) return res.status(401).json({ error: "bad token" });
  const room = cleanRoom(req.query.room);
  if (!room) return res.status(400).json({ error: "invalid room" });

  const key = process.env.ABLY_API_KEY;
  if (!key) return res.status(500).json({ error: "ABLY_API_KEY not set" });

  const who = req.query.who === "agent" ? "agent" : "controller";
  const clientId = who + "-" + Math.random().toString(36).slice(2, 8);
  const channel = "vest:" + room;

  try {
    const rest = new Rest(key);
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability: JSON.stringify({ [channel]: ["publish", "subscribe", "presence"] }),
    });
    return res.status(200).json(tokenRequest);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
