import crypto from "crypto";

const COOKIE = "session";

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(data) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSession(userId) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: String(userId),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 ngày
  }));
  const data = `${header}.${payload}`;
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function readSession(req) {
  const cookie = req.headers.cookie || "";
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return null;
  const token = m[1];

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  if (sign(data) !== s) return null;

  const payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return { userId: payload.sub };
}

export function setSessionCookie(res, jwt) {
  // httpOnly để JS không đọc được cookie => an toàn
  res.setHeader("Set-Cookie", `${COOKIE}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Secure`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
}
