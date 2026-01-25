import { readSession } from "./_auth.js";
import { getDb } from "./_db.js";
import { decryptToken } from "./_crypto.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "Not logged in" });

  // 4 upstream API: BXD (gap/dangXuLy) + BYT (gap/dangXuLy)
  const { API_BXD_GAP, API_BXD_DANG_XU_LY, API_BYT_GAP, API_BYT_DANG_XU_LY } =
    process.env;

  if (
    !API_BXD_GAP ||
    !API_BXD_DANG_XU_LY ||
    !API_BYT_GAP ||
    !API_BYT_DANG_XU_LY
  ) {
    return res.status(500).json({
      error:
        "Missing env: API_BXD_GAP/API_BXD_DANG_XU_LY/API_BYT_GAP/API_BYT_DANG_XU_LY",
    });
  }

  const db = await getDb();
  const doc = await db.collection("user_tokens").findOne({ userId: s.userId });

  if (!doc || doc.invalid) {
    return res.status(401).json({ error: "Missing token", needToken: true });
  }

  const token = decryptToken(doc.tokenEnc);
  const authHeader = token.toLowerCase().startsWith("bearer ")
    ? token
    : `Bearer ${token}`;

  const fetchOne = async (url) => {
    const r = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
    });
    const raw = await r.text();

    if (!r.ok) return { ok: false, status: r.status };

    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch {
      return { ok: false, status: 502 };
    }
  };

  const toList = (x) =>
    Array.isArray(x?.content) ? x.content : Array.isArray(x) ? x : [];

  const [bxdGapRes, bxdDangRes, bytGapRes, bytDangRes] = await Promise.all([
    fetchOne(API_BXD_GAP),
    fetchOne(API_BXD_DANG_XU_LY),
    fetchOne(API_BYT_GAP),
    fetchOne(API_BYT_DANG_XU_LY),
  ]);

  const is401or403 = (r) => !r.ok && (r.status === 401 || r.status === 403);

  const unauthorized =
    is401or403(bxdGapRes) ||
    is401or403(bxdDangRes) ||
    is401or403(bytGapRes) ||
    is401or403(bytDangRes);

  if (unauthorized) {
    await db
      .collection("user_tokens")
      .updateOne({ userId: s.userId }, { $set: { invalid: true } });

    return res.status(401).json({
      unauthorized: true,
      needToken: true,
      boXayDung: { gap: [], dangXuLy: [] },
      boYTe: { gap: [], dangXuLy: [] },
    });
  }

  return res.status(200).json({
    boXayDung: {
      gap: bxdGapRes.ok ? toList(bxdGapRes.data) : [],
      dangXuLy: bxdDangRes.ok ? toList(bxdDangRes.data) : [],
    },
    boYTe: {
      gap: bytGapRes.ok ? toList(bytGapRes.data) : [],
      dangXuLy: bytDangRes.ok ? toList(bytDangRes.data) : [],
    },
  });
}
