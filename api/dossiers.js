import { readSession } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "Not logged in" });

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

  const normalizeBearer = (t) => {
    const v = String(t || "").trim();
    if (!v) return "";
    return v.toLowerCase().startsWith("bearer ") ? v : `Bearer ${v}`;
  };

  // ✅ nhận token từ FE
  const { tokenBXD, tokenBYT } = req.body || {};
  const bxd = normalizeBearer(tokenBXD);
  const byt = normalizeBearer(tokenBYT);

  if (!bxd || !byt) {
    return res.status(401).json({ error: "Missing token", needToken: true });
  }

  const fetchOne = async (url, authHeader) => {
    const r = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
    });
    const raw = await r.text();

    if (!r.ok) return { ok: false, status: r.status, raw };

    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch {
      return { ok: false, status: 502, raw };
    }
  };

  const toList = (x) =>
    Array.isArray(x?.content) ? x.content : Array.isArray(x) ? x : [];

  const [bxdGapRes, bxdDangRes, bytGapRes, bytDangRes] = await Promise.all([
    fetchOne(API_BXD_GAP, bxd),
    fetchOne(API_BXD_DANG_XU_LY, bxd),
    fetchOne(API_BYT_GAP, byt),
    fetchOne(API_BYT_DANG_XU_LY, byt),
  ]);

  const is401or403 = (r) => !r.ok && (r.status === 401 || r.status === 403);
  const unauthorized =
    is401or403(bxdGapRes) ||
    is401or403(bxdDangRes) ||
    is401or403(bytGapRes) ||
    is401or403(bytDangRes);

  if (unauthorized) {
    return res.status(401).json({
      unauthorized: true,
      needToken: true,
      boXayDung: { gap: [], dangXuLy: [] },
      boYTe: { gap: [], dangXuLy: [] },
    });
  }

  // nếu upstream lỗi khác (500/502/timeout), trả 502 cho FE dễ xử lý
  const anyUpstreamFail =
    !bxdGapRes.ok || !bxdDangRes.ok || !bytGapRes.ok || !bytDangRes.ok;

  if (anyUpstreamFail) {
    return res.status(502).json({
      error: "Upstream error",
      detail: {
        bxdGap: { ok: bxdGapRes.ok, status: bxdGapRes.status },
        bxdDang: { ok: bxdDangRes.ok, status: bxdDangRes.status },
        bytGap: { ok: bytGapRes.ok, status: bytGapRes.status },
        bytDang: { ok: bytDangRes.ok, status: bytDangRes.status },
      },
      boXayDung: { gap: [], dangXuLy: [] },
      boYTe: { gap: [], dangXuLy: [] },
    });
  }

  return res.status(200).json({
    boXayDung: {
      gap: toList(bxdGapRes.data),
      dangXuLy: toList(bxdDangRes.data),
    },
    boYTe: {
      gap: toList(bytGapRes.data),
      dangXuLy: toList(bytDangRes.data),
    },
  });
}
