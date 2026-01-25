import bcrypt from "bcryptjs";
import { getDb } from "../_db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing username/password" });

  const db = await getDb();
  const users = db.collection("users");
  const exists = await users.findOne({ username });
  if (exists) return res.status(409).json({ error: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const r = await users.insertOne({ username, passwordHash, createdAt: new Date() });

  return res.status(201).json({ ok: true, userId: String(r.insertedId) });
}
