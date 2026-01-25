import { readSession } from "./_auth.js";
import { getDb } from "./_db.js";
import { decryptToken } from "./_crypto.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "Not logged in" });

  const { API_DAT, API_SAU } = process.env;
  if (!API_DAT || !API_SAU) return res.status(500).json({ error: "Missing API_DAT/API_SAU env" });

  const db = await getDb();
  const doc = await db.collection("user_tokens").findOne({ userId: s.userId });

  if (!doc || doc.invalid) return res.status(401).json({ error: "Missing token", needToken: true });

  const token = decryptToken(doc.tokenEnc);
  const authHeader = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;

  const fetchOne = async (url) => {
    const r = await fetch(url, { method: "GET", headers: { Authorization: authHeader } });
    const raw = await r.text();
    if (!r.ok) return { ok: false, status: r.status };
    try { return { ok: true, data: JSON.parse(raw) }; } catch { return { ok: false, status: 502 }; }
  };

  const toList = (x) => (Array.isArray(x?.content) ? x.content : Array.isArray(x) ? x : []);

  const [datRes, sauRes] = await Promise.all([fetchOne(API_DAT), fetchOne(API_SAU)]);

  const unauthorized =
    (!datRes.ok && (datRes.status === 401 || datRes.status === 403)) ||
    (!sauRes.ok && (sauRes.status === 401 || sauRes.status === 403));

  if (unauthorized) {
    // đánh dấu token invalid để lần sau FE biết cần nhập mới
    await db.collection("user_tokens").updateOne({ userId: s.userId }, { $set: { invalid: true } });
    return res.status(401).json({ unauthorized: true, needToken: true, dat: [], sau: [] });
  }

  return res.status(200).json({
    dat: datRes.ok ? toList(datRes.data) : [],
    sau: sauRes.ok ? toList(sauRes.data) : [],
  });
}
