import { redis, cmdKey, cors, authed, cleanRoom } from "./_lib.js";

// The controller UI calls this. It validates the command, then pushes it into
// a short-lived per-room queue that the agent drains via /api/poll.
//
// Body: { room, token, command }
//   command = { type:"dot", motors:[{index,intensity}], duration }
//           | { type:"stop" }

const MAX_QUEUE = 60; // guardrail so a stuck agent can't accumulate a huge backlog

function sanitizeCommand(command) {
  if (!command || typeof command !== "object") return null;
  if (command.type === "stop") return { type: "stop" };
  if (command.type === "dot") {
    if (!Array.isArray(command.motors)) return null;
    const motors = [];
    for (const m of command.motors) {
      const index = Number(m && m.index);
      const intensity = Number(m && m.intensity);
      if (!Number.isFinite(index) || !Number.isFinite(intensity)) return null;
      motors.push({
        index: Math.max(0, Math.min(39, Math.round(index))),
        intensity: Math.max(0, Math.min(100, Math.round(intensity))),
      });
    }
    if (!motors.length) return null;
    let duration = Number(command.duration);
    if (!Number.isFinite(duration)) duration = 200;
    duration = Math.max(20, Math.min(5000, Math.round(duration)));
    return { type: "dot", motors, duration };
  }
  return null;
}

export default async function handler(req, res) {
  cors(res, "POST");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  if (!authed(body.token)) return res.status(401).json({ error: "bad token" });
  const room = cleanRoom(body.room);
  if (!room) return res.status(400).json({ error: "invalid room" });

  const command = sanitizeCommand(body.command);
  if (!command) return res.status(400).json({ error: "invalid command" });

  const key = cmdKey(room);
  try {
    if (command.type === "stop") {
      // Stop jumps the queue: clear anything pending, then put stop at the head.
      await redis.del(key);
      await redis.lpush(key, command);
    } else {
      const len = await redis.rpush(key, command);
      if (len > MAX_QUEUE) await redis.ltrim(key, -MAX_QUEUE, -1);
    }
    await redis.expire(key, 30); // stale commands self-destruct; no surprise buzzes later
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
