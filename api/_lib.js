const TOKEN = process.env.RELAY_TOKEN || "";

export function cors(res, methods) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods + ", OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}
export function authed(token) {
  if (!TOKEN) return false;
  if (typeof token !== "string" || token.length !== TOKEN.length) return false;
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
