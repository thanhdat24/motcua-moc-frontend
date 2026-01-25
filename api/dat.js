// /api/dat.js

export default async function handler(req, res) {
  // ==== CORS cho mọi origin ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Trả lời preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Chỉ cho phép GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { API_DAT } = process.env;

  if (!API_DAT) {
    return res.status(500).json({ error: "API_DAT not configured in env" });
  }

  // LẤY TOKEN TỪ REQUEST CỦA FRONTEND
  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";

  if (!authHeader) {
    // Frontend chưa gửi token
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const response = await fetch(API_DAT, {
      method: "GET",
      headers: {
        // forward y nguyên header từ client sang API thật
        Authorization: authHeader,
      },
    });

    const rawText = await response.text();

    // GIỮ NGUYÊN STATUS CODE ĐỂ FRONTEND BẮT 401/403
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Remote API_DAT returned error",
        status: response.status,
        body: rawText?.slice(0, 500) || null,
      });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        error: "Remote API_DAT returned invalid JSON",
        message: e.message,
        bodySample: rawText?.slice(0, 500) || null,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Internal error calling API_DAT",
      message: err.message,
    });
  }
}