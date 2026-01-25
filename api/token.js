import { readSession } from "./_auth.js";
import { getDb } from "./_db.js";
import { encryptToken } from "./_crypto.js";

export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "Not logged in" });

  const db = await getDb();
  const col = db.collection("user_tokens");

  if (req.method === "GET") {
    const doc = await col.findOne({ userId: s.userId });
    if (!doc || doc.invalid) return res.status(200).json({ hasToken: false });
    return res.status(200).json({ hasToken: true, updatedAt: doc.updatedAt });
  }

  if (req.method === "POST") {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") return res.status(400).json({ error: "Missing token" });

    const tokenEnc = encryptToken(token.trim());
    await col.updateOne(
      { userId: s.userId },
      { $set: { tokenEnc, invalid: false, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
