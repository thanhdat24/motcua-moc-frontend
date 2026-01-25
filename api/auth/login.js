import bcrypt from "bcryptjs";
import { getDb } from "../_db.js";
import { createSession, setSessionCookie } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing username/password" });

  const db = await getDb();
  const user = await db.collection("users").findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const jwt = createSession(user._id);
  setSessionCookie(res, jwt);

  return res.status(200).json({ ok: true, username });
}
