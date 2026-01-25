import { readSession } from "../_auth.js";
import { getDb } from "../_db.js";

export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ ok: false });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: (await import("mongodb")).ObjectId.createFromHexString(s.userId) }).catch(() => null);
  if (!user) return res.status(401).json({ ok: false });

  return res.status(200).json({ ok: true, username: user.username });
}
