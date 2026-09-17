import { Redis } from "@upstash/redis";

// Works whether the Upstash integration set UPSTASH_* or KV_* env var names.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const TOKEN = process.env.RELAY_TOKEN || "";

// Namespaced keys, so several vests can share one deployment via different rooms.
export const cmdKey = (room) => `cmd:${room}`;
export const onlineKey = (room) => `online:${room}`;

export function cors(res, methods) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods + ", OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

// Returns true if the token is valid. Uses a length-safe compare.
export function authed(token) {
  if (!TOKEN) return false;              // server misconfigured -> deny
  if (typeof token !== "string") return false;
  if (token.length !== TOKEN.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ TOKEN.charCodeAt(i);
  return diff === 0;
}

export function cleanRoom(room) {
  if (typeof room !== "string") return null;
  const r = room.trim();
  if (!r || r.length > 64 || !/^[A-Za-z0-9_.-]+$/.test(r)) return null;
  return r;
}
